"""Invoice extraction using Azure AI Document Intelligence."""

from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential


INVOICE_FIELDS = {
    "Número de factura": "InvoiceId",
    "Fecha": "InvoiceDate",
    "Proveedor": "VendorName",
    "Subtotal": "SubTotal",
    "Impuestos": "TotalTax",
    "Importe total": "InvoiceTotal",
}


def _display_value(value):
    if value is None:
        return None
    if hasattr(value, "amount"):
        amount = value.amount
        currency = getattr(value, "currency_code", None)
        return f"{amount} {currency}".strip() if currency else str(amount)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


class DocumentAIService:
    def __init__(self, endpoint, key):
        if not endpoint or not key:
            raise RuntimeError(
                "Configure DOC_INTELLIGENCE_ENDPOINT y DOC_INTELLIGENCE_KEY."
            )
        self.client = DocumentIntelligenceClient(
            endpoint=endpoint, credential=AzureKeyCredential(key)
        )

    def analyze_invoice(self, file_bytes):
        poller = self.client.begin_analyze_document(
            "prebuilt-invoice", body=file_bytes
        )
        result = poller.result()
        document = result.documents[0] if result.documents else None
        source_fields = document.fields if document else {}

        extracted = []
        for label, field_name in INVOICE_FIELDS.items():
            field = source_fields.get(field_name)
            confidence = getattr(field, "confidence", None) if field else None
            extracted.append(
                {
                    "label": label,
                    "value": _display_value(getattr(field, "value", None))
                    if field
                    else None,
                    "confidence": confidence,
                    "low_confidence": confidence is not None and confidence < 0.80,
                }
            )
        return extracted
