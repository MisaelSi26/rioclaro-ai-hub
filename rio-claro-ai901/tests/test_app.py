import io
import json

import pytest

from app import create_app
from services.chatbot_service import ChatbotService, NO_INFORMATION


class FakeDocumentAI:
    def analyze_invoice(self, file_bytes):
        assert file_bytes.startswith(b"%PDF-")
        return [
            {
                "label": "Número de factura",
                "value": "INV-100",
                "confidence": 0.74,
                "low_confidence": True,
            }
        ]


class FakeChatbot:
    def answer(self, question):
        return {
            "answer": f"Respuesta basada en documentos para: {question} [1]",
            "sources": [{"title": "Política", "source": "politica.pdf"}],
        }


@pytest.fixture
def client(tmp_path):
    app = create_app(
        {
            "TESTING": True,
            "WTF_CSRF_ENABLED": False,
            "UPLOAD_FOLDER": tmp_path,
            "MAX_CONTENT_LENGTH": 1024 * 1024,
        }
    )
    app.extensions["document_ai"] = FakeDocumentAI()
    app.extensions["chatbot"] = FakeChatbot()
    return app.test_client(), tmp_path


def test_home_and_about_render(client):
    test_client, _ = client
    assert test_client.get("/").status_code == 200
    response = test_client.get("/acerca")
    assert response.status_code == 200
    assert "Rendición de cuentas" in response.get_data(as_text=True)


def test_invoice_rejects_mismatched_file_signature(client):
    test_client, _ = client
    response = test_client.post(
        "/facturas",
        data={"invoice": (io.BytesIO(b"not a pdf"), "factura.pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert "Archivo no válido" in response.get_data(as_text=True)


def test_invoice_extracts_and_persists_result(client):
    test_client, upload_folder = client
    response = test_client.post(
        "/facturas",
        data={"invoice": (io.BytesIO(b"%PDF-1.7 contenido de prueba"), "factura.pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    assert "Revisar: menor a 80%" in response.get_data(as_text=True)
    persisted = list((upload_folder / "processed").glob("*.json"))
    assert len(persisted) == 1
    saved_result = json.loads(persisted[0].read_text(encoding="utf-8"))
    assert saved_result["fields"][0]["value"] == "INV-100"


def test_chatbot_renders_answer_and_source(client):
    test_client, _ = client
    response = test_client.post(
        "/chatbot",
        data={"question": "¿Cuál es la política?"},
    )
    page = response.get_data(as_text=True)
    assert response.status_code == 200
    assert "Respuesta basada en documentos" in page
    assert "politica.pdf" in page


def test_chatbot_rejects_blank_question(client):
    test_client, _ = client
    response = test_client.post("/chatbot", data={"question": "   "})
    assert response.status_code == 400


def test_chatbot_returns_no_information_without_search_results():
    class EmptySearch:
        def search(self, _question):
            return []

    service = ChatbotService.__new__(ChatbotService)
    service.search_service = EmptySearch()
    assert service.answer("Pregunta sin resultados") == {
        "answer": NO_INFORMATION,
        "sources": [],
    }
