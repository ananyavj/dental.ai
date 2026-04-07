import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.schemas.chat_schemas import ChatRequest
import json

router = APIRouter()

# Core System Prompts ported from original frontend
PROMPTS = {
    "practitioner": "You are dental.ai, an expert AI co-pilot for practising dentists. Keep responses concise, evidence-based, and clinically focused. Always note when a specialist referral might be indicated.",
    "student": "You are dental.ai, a tutor for dental students. When asked clinical questions, guide the student to the answer using the Socratic method. Do not just give the direct answer immediately.",
    "patient": "You are dental.ai, a helpful AI assistant for dental patients. Explain dental concepts simply and reassuringly. Always emphasize that you are an AI and they must consult a real dentist for actual medical advice.",
    "Endo.ai": "You are Endo.ai, an expert endodontic AI assistant for practising dentists... (Responses should be structured with clear headings).",
    "Perio.ai": "You are Perio.ai, an expert periodontal AI assistant...",
    "Implant.ai": "You are Implant.ai, an expert implantology AI assistant...",
    "OralSurg.ai": "You are OralSurg.ai, an expert oral surgery AI assistant...",
}

@router.post("/stream")
async def chat_stream(request: ChatRequest):
    api_key = os.getenv("VITE_GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing in backend")

    # Select System Prompt
    system_text = PROMPTS.get(request.specialty or request.mode, PROMPTS["practitioner"])

    # Initialize LangChain LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0.3,
        streaming=True
    )

    # Build Message History
    messages = [SystemMessage(content=system_text)]
    
    for i, m in enumerate(request.messages):
        # If it's the last human message and we have an image
        if i == len(request.messages) - 1 and m.role == "user" and request.image_base64:
            content = [
                {"type": "text", "text": m.content},
                {"type": "image_url", "image_url": f"data:{request.mime_type or 'image/jpeg'};base64,{request.image_base64}"}
            ]
            messages.append(HumanMessage(content=content))
        else:
            if m.role == "user":
                messages.append(HumanMessage(content=m.content))
            else:
                messages.append(AIMessage(content=m.content))

    # Generator for Streaming
    async def generate():
        try:
            async for chunk in llm.astream(messages):
                yield chunk.content
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    return StreamingResponse(generate(), media_type="text/plain")
