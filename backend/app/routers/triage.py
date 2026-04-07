from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.db import get_supabase_client
from supabase import Client

router = APIRouter()

class TriageRequest(BaseModel):
    patient_id: str
    chief_complaint: str
    duration: str
    pain_level: int
    associated_symptoms: List[str]

from app.agents.triage_graph import triage_graph

@router.post("/run")
async def run_triage_graph_endpoint(request: TriageRequest, client: Client = Depends(get_supabase_client)):
    # Run the LangGraph agent
    state_input = {
        "patient_id": request.patient_id,
        "chief_complaint": request.chief_complaint,
        "duration": request.duration,
        "pain_level": request.pain_level,
        "associated_symptoms": request.associated_symptoms,
        "extracted_features": {},
        "detected_red_flags": [],
        "triage_decision": {}
    }
    
    result = triage_graph.invoke(state_input)
    decision = result["triage_decision"]
    
    session_data = {
        "patient_id": request.patient_id,
        "doctor_id": "00000000-0000-0000-0000-000000000000", # TODO: get from auth context
        "triage_level": decision.get("level", "ROUTINE"),
        "confidence_score": decision.get("confidence", 0.5),
        "reasoning": decision.get("reasoning", ""),
        "red_flags": result["detected_red_flags"],
        "ai_recommendation": {"action": decision.get("action")},
        "needs_doctor_review": decision.get("needs_doctor_review", True)
    }
    
    # Store in Supabase securely (RLS ignores service_role context or validates JWT)
    if client:
        try:
            # We omit storing in mock mode to avoid crash if tables aren't built
            client.table("triage_sessions").insert(session_data).execute()
        except Exception as e:
            print(f"DB Insert Failed (Make sure schema is deployed via Supabase CLI): {e}")
    
    return session_data
