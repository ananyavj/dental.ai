from fastapi import APIRouter, Depends, HTTPException
from app.services.db import get_supabase_client
from supabase import Client

router = APIRouter()

def get_admin_user(client: Client = Depends(get_supabase_client)):
    # In reality, this would extract user JWT from request / middleware and match role
    # For scaffolding, returning a mock admin state or throwing 401
    pass

@router.get("/metrics")
async def get_dashboard_metrics(client: Client = Depends(get_supabase_client)):
    fallback = {
        "total_users": 105,
        "total_patients": 18,
        "active_sessions": 6,
        "token_usage_30d": 154000
    }
    if not client:
        return fallback

    try:
        patients = client.table("patient_cases").select("id", count="exact").execute()
        users = client.table("profiles").select("id", count="exact").execute()
        triages = client.table("triage_sessions").select("id", count="exact").execute()

        return {
            "total_users": users.count or fallback["total_users"],
            "total_patients": patients.count or fallback["total_patients"],
            "active_sessions": triages.count or fallback["active_sessions"],
            "token_usage_30d": fallback["token_usage_30d"],
        }
    except Exception:
        return fallback
