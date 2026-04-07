from fastapi import APIRouter
from app.schemas.chat_schemas import RAGQuery

router = APIRouter()

@router.post("/query")
async def query_knowledge_base(request: RAGQuery):
    # Placeholder for actual pgvector execution
    # In production, this will use embeddings via Supabase pgvector
    return {
        "results": [
            {"content": "Mock retrieved document from dental guidelines.", "metadata": {"source": "IDA Guidelines"}}
        ]
    }
