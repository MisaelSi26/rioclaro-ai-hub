"""Invoice file and result persistence in Azure Blob Storage or local disk."""

import json
from pathlib import Path

from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobServiceClient
from azure.storage.blob import ContentSettings


class StorageService:
    def __init__(self, connection_string, container_name, local_folder):
        self.local_folder = Path(local_folder)
        self.container_client = None
        if connection_string:
            service = BlobServiceClient.from_connection_string(connection_string)
            self.container_client = service.get_container_client(container_name)

    def _upload_blob(self, blob_name, data, content_type):
        try:
            self.container_client.create_container()
        except ResourceExistsError:
            pass
        self.container_client.upload_blob(
            name=blob_name,
            data=data,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
        )
        return f"azure://{self.container_client.container_name}/{blob_name}"

    def save_upload(self, filename, file_bytes, content_type):
        if self.container_client:
            return self._upload_blob(
                f"invoices/{filename}", file_bytes, content_type
            )
        destination = self.local_folder / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(file_bytes)
        return f"local://invoices/{filename}"

    def save_result(self, result_id, result):
        encoded = json.dumps(result, ensure_ascii=False, indent=2).encode("utf-8")
        if self.container_client:
            return self._upload_blob(
                f"processed/{result_id}.json", encoded, "application/json"
            )
        destination = self.local_folder / "processed" / f"{result_id}.json"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(encoded)
        return f"local://processed/{result_id}.json"
