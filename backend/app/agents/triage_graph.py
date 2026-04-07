from typing import TypedDict, Annotated, List, Dict, Any
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
import json
import os

class TriageState(TypedDict):
    patient_id: str
    chief_complaint: str
    duration: str
    pain_level: int
    associated_symptoms: List[str]
    extracted_features: Dict[str, Any]
    detected_red_flags: List[str]
    triage_decision: Dict[str, Any]

def extract_features(state: TriageState) -> TriageState:
    """Agent step 1: Extract normalized features from the raw inputs."""
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
    prompt = f"""You are a dental symptom extractor. Given:
    Complaint: {state['chief_complaint']}
    Duration: {state['duration']}
    Pain: {state['pain_level']}/10
    Symptoms: {', '.join(state['associated_symptoms'])}

    Output valid JSON summarizing 'primary_issue', 'severity_indicators', and 'possible_infections'.
    """
    resp = llm.invoke([HumanMessage(content=prompt)])
    # Strip markdown code blocks
    cleaned = resp.content.replace("```json", "").replace("```", "").strip()
    try:
        features = json.loads(cleaned)
    except:
        features = {"primary_issue": state['chief_complaint']}
    
    return {"extracted_features": features}

def check_red_flags(state: TriageState) -> TriageState:
    """Agent step 2: Identify critical emergency indicators."""
    red_flags = []
    text_to_check = f"{state['chief_complaint']} {' '.join(state['associated_symptoms'])}".lower()
    
    critical_terms = ["swelling", "difficulty breathing", "pus", "uncontrolled bleeding", "trauma", "avulsion", "fever"]
    for term in critical_terms:
        if term in text_to_check:
            red_flags.append(term)
    
    if state['pain_level'] >= 8:
        red_flags.append("severe debilitating pain")
        
    return {"detected_red_flags": red_flags}

def make_triage_decision(state: TriageState) -> TriageState:
    """Agent step 3: Final scoring and output generation."""
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)
    flags_text = ", ".join(state['detected_red_flags']) if state['detected_red_flags'] else "None"
    
    prompt = f"""You are a Dental Triage Engine.
    Patient Issue: {state['chief_complaint']}
    Pain: {state['pain_level']}
    Red Flags: {flags_text}
    
    Output ONLY valid JSON with no markdown formatting:
    {{
      "level": "EMERGENCY" | "URGENT" | "ROUTINE",
      "confidence": float between 0.0 and 1.0,
      "reasoning": "string",
      "action": "book_urgent" | "book_routine" | "escalate_to_doctor"
    }}
    
    Rule: If Red Flags exist, it must be EMERGENCY or URGENT. If you are not absolutely certain, drop confidence below 0.90.
    """
    
    resp = llm.invoke([HumanMessage(content=prompt)])
    cleaned = resp.content.replace("```json", "").replace("```", "").strip()
    try:
        decision = json.loads(cleaned)
    except:
        decision = {
            "level": "URGENT" if state['detected_red_flags'] else "ROUTINE",
            "confidence": 0.5,
            "reasoning": "Fallback due to parser error",
            "action": "escalate_to_doctor"
        }
        
    # Enforce Failure-Free fallback rule requested by user
    if decision.get("confidence", 0) < 0.90:
        decision["action"] = "escalate_to_doctor"
        decision["needs_doctor_review"] = True
    else:
        decision["needs_doctor_review"] = False
        
    return {"triage_decision": decision}

# Build LangGraph
workflow = StateGraph(TriageState)

workflow.add_node("extract", extract_features)
workflow.add_node("red_flags", check_red_flags)
workflow.add_node("decide", make_triage_decision)

workflow.set_entry_point("extract")
workflow.add_edge("extract", "red_flags")
workflow.add_edge("red_flags", "decide")
workflow.add_edge("decide", END)

triage_graph = workflow.compile()
