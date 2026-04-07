from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class Message(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message content text")

class ChatRequest(BaseModel):
    messages: List[Message]
    mode: str = Field(default="practitioner", description="Mode: practitioner, student, patient")
    specialty: Optional[str] = Field(default=None, description="Specialty override (e.g., Endo.ai)")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded image string")
    mime_type: Optional[str] = Field(default=None, description="Image mime type")

class RAGQuery(BaseModel):
    query: str
    top_k: int = 5
