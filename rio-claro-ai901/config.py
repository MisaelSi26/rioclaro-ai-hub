"""Application configuration loaded from environment variables."""

import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


BASE_DIR = Path(__file__).resolve().parent


class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY") or secrets.token_hex(32)
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_MB", "16")) * 1024 * 1024
    UPLOAD_FOLDER = Path(os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "uploads")))
    ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}

    OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT", "").strip()
    OPENAI_KEY = os.getenv("OPENAI_KEY", "").strip()
    OPENAI_DEPLOYMENT = os.getenv("OPENAI_DEPLOYMENT", "").strip()

    SEARCH_ENDPOINT = os.getenv("SEARCH_ENDPOINT", "").strip()
    SEARCH_KEY = os.getenv("SEARCH_KEY", "").strip()
    SEARCH_INDEX = os.getenv("SEARCH_INDEX", "").strip()

    DOC_INTELLIGENCE_ENDPOINT = os.getenv("DOC_INTELLIGENCE_ENDPOINT", "").strip()
    DOC_INTELLIGENCE_KEY = os.getenv("DOC_INTELLIGENCE_KEY", "").strip()

    STORAGE_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING", "").strip()
    STORAGE_CONTAINER = os.getenv("STORAGE_CONTAINER", "rio-claro-invoices").strip()
    CHATBOT_ALLOWED_ROLES = {
        role.strip().casefold()
        for role in os.getenv("CHATBOT_ALLOWED_ROLES", "").split(",")
        if role.strip()
    }
    AZURE_OPENAI_API_VERSION = os.getenv(
        "AZURE_OPENAI_API_VERSION", "2024-06-01"
    ).strip()
    WTF_CSRF_ENABLED = os.getenv("WTF_CSRF_ENABLED", "true").lower() != "false"
