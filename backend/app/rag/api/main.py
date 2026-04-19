from fastapi import FastAPI
from api.schemas import QueryRequest, QueryResponse
from rag.rag_pipeline import run_rag

app = FastAPI(title="Dentist RAG Chatbot")


@app.post("/ask", response_model=QueryResponse)
def ask_question(req: QueryRequest):

    answer = run_rag(req.question)

    return {"answer": answer}