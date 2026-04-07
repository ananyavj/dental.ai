import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables from root .env if running from backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

# Import Routers
from app.routers import chat, tools, rag

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB/Vector connections
    print("Application Startup: Connecting to ML models & Supabase")
    yield
    # Shutdown
    print("Application Shutdown")

app = FastAPI(
    title="dental.ai Backend",
    description="FastAPI + LangGraph ML Backend",
    version="2.0.0",
    lifespan=lifespan
)

# CORS config to allow Next.js local & prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(tools.router, prefix="/api/tools", tags=["Tools"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])

from app.routers import admin, triage
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(triage.router, prefix="/api/triage", tags=["Triage"])

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}
