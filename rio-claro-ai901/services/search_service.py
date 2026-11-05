"""Retrieval from the configured Azure AI Search index."""

from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient


class SearchService:
    def __init__(self, endpoint, key, index_name):
        if not endpoint or not key or not index_name:
            raise RuntimeError(
                "Configure SEARCH_ENDPOINT, SEARCH_KEY y SEARCH_INDEX."
            )
        self.client = SearchClient(
            endpoint=endpoint,
            index_name=index_name,
            credential=AzureKeyCredential(key),
        )

    def search(self, query, top=5):
        results = self.client.search(search_text=query, top=top)
        documents = []
        for result in results:
            item = dict(result)
            content = item.get("content") or item.get("text") or item.get("chunk")
            if not content:
                continue
            documents.append(
                {
                    "content": str(content),
                    "title": str(
                        item.get("title")
                        or item.get("metadata_storage_name")
                        or "Documento empresarial"
                    ),
                    "source": str(
                        item.get("source")
                        or item.get("metadata_storage_path")
                        or item.get("id")
                        or "Fuente sin nombre"
                    ),
                    "score": item.get("@search.score"),
                }
            )
        return documents
