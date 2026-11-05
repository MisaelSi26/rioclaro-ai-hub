"""Flask web application for Río Claro's AI-901 integrator project."""

import logging
import mimetypes
import os
import re
import uuid
from pathlib import Path

from flask import Flask, flash, render_template, request
from flask_wtf.csrf import CSRFProtect
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename

from config import Config
from services.chatbot_service import ChatbotService
from services.document_ai import DocumentAIService
from services.search_service import SearchService
from services.storage_service import StorageService

csrf = CSRFProtect()
LOGGER = logging.getLogger(__name__)
ALLOWED_SIGNATURES = {
    "pdf": lambda data: data.startswith(b"%PDF-"),
    "jpg": lambda data: data.startswith(b"\xff\xd8\xff"),
    "jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
    "png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
}


def _valid_invoice_file(filename, file_bytes, allowed_extensions):
    extension = Path(filename).suffix.lower().lstrip(".")
    signature_check = ALLOWED_SIGNATURES.get(extension)
    return (
        extension in allowed_extensions
        and bool(file_bytes)
        and signature_check is not None
        and signature_check(file_bytes)
    )


def _clean_question(value):
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value).strip()


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)
    app.config["UPLOAD_FOLDER"] = Path(app.config["UPLOAD_FOLDER"])
    app.config["UPLOAD_FOLDER"].mkdir(parents=True, exist_ok=True)
    logging.basicConfig(level=logging.INFO)
    if not os.getenv("FLASK_SECRET_KEY"):
        LOGGER.warning(
            "FLASK_SECRET_KEY is unset; a temporary key is being used. "
            "Set a persistent secret before deployment."
        )
    csrf.init_app(app)

    app.extensions["document_ai"] = DocumentAIService(
        app.config["DOC_INTELLIGENCE_ENDPOINT"],
        app.config["DOC_INTELLIGENCE_KEY"],
    ) if (
        app.config["DOC_INTELLIGENCE_ENDPOINT"]
        and app.config["DOC_INTELLIGENCE_KEY"]
    ) else None

    app.extensions["search_service"] = SearchService(
        app.config["SEARCH_ENDPOINT"],
        app.config["SEARCH_KEY"],
        app.config["SEARCH_INDEX"],
    ) if (
        app.config["SEARCH_ENDPOINT"]
        and app.config["SEARCH_KEY"]
        and app.config["SEARCH_INDEX"]
    ) else None

    app.extensions["chatbot"] = ChatbotService(
        app.extensions["search_service"],
        app.config["OPENAI_ENDPOINT"],
        app.config["OPENAI_KEY"],
        app.config["OPENAI_DEPLOYMENT"],
        app.config["AZURE_OPENAI_API_VERSION"],
    ) if (
        app.extensions["search_service"]
        and app.config["OPENAI_ENDPOINT"]
        and app.config["OPENAI_KEY"]
        and app.config["OPENAI_DEPLOYMENT"]
    ) else None

    app.extensions["storage"] = StorageService(
        app.config["STORAGE_CONNECTION_STRING"],
        app.config["STORAGE_CONTAINER"],
        app.config["UPLOAD_FOLDER"],
    )

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.route("/facturas", methods=["GET", "POST"])
    def facturas():
        if request.method == "GET":
            return render_template("facturas.html")

        uploaded = request.files.get("invoice")
        if not uploaded or not uploaded.filename:
            flash("Selecciona un archivo de factura.", "warning")
            return render_template("facturas.html"), 400

        original_name = secure_filename(uploaded.filename)
        file_bytes = uploaded.read()
        if not _valid_invoice_file(
            original_name, file_bytes, app.config["ALLOWED_EXTENSIONS"]
        ):
            flash(
                "Archivo no válido. Usa un PDF, JPG o PNG con contenido compatible.",
                "danger",
            )
            return render_template("facturas.html"), 400
        if not app.extensions["document_ai"]:
            flash(
                "El análisis no está disponible. Configura Azure AI Document "
                "Intelligence en las variables de entorno.",
                "danger",
            )
            return render_template("facturas.html"), 503

        document_id = uuid.uuid4().hex
        extension = Path(original_name).suffix.lower()
        saved_name = f"{document_id}{extension}"
        try:
            fields = app.extensions["document_ai"].analyze_invoice(file_bytes)
            content_type = mimetypes.guess_type(saved_name)[0] or "application/octet-stream"
            file_location = app.extensions["storage"].save_upload(
                saved_name, file_bytes, content_type
            )
            result = {
                "id": document_id,
                "filename": original_name,
                "fields": fields,
                "file_location": file_location,
            }
            result["result_location"] = app.extensions["storage"].save_result(
                document_id, result
            )
        except Exception:
            LOGGER.exception("No se pudo procesar la factura %s", document_id)
            flash(
                "Ocurrió un error al procesar o guardar la factura. "
                "Revisa los registros del servidor y la configuración.",
                "danger",
            )
            return render_template("facturas.html"), 502

        return render_template("facturas.html", result=result)

    @app.route("/chatbot", methods=["GET", "POST"])
    def chatbot():
        if request.method == "GET":
            return render_template("chatbot.html")

        question = _clean_question(request.form.get("question", ""))[:2000]
        if not question:
            flash("Escribe una pregunta para continuar.", "warning")
            return render_template("chatbot.html"), 400
        if not app.extensions["chatbot"]:
            flash(
                "El asistente no está disponible. Configura Azure AI Search y "
                "Azure OpenAI en las variables de entorno.",
                "danger",
            )
            return render_template("chatbot.html"), 503
        try:
            response = app.extensions["chatbot"].answer(question)
        except Exception:
            LOGGER.exception("Falló la consulta del chatbot")
            response = {
                "answer": (
                    "No fue posible generar una respuesta por un error al "
                    "consultar los servicios. Inténtalo más tarde."
                ),
                "sources": [],
            }
            flash(
                "No fue posible consultar los servicios de IA en este momento.",
                "danger",
            )
        return render_template(
            "chatbot.html", question=question, response=response
        )

    @app.get("/acerca")
    def about():
        return render_template("about.html")

    @app.errorhandler(RequestEntityTooLarge)
    def handle_large_upload(_error):
        flash("El archivo excede el límite configurado para la carga.", "danger")
        return render_template("facturas.html"), 413

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
