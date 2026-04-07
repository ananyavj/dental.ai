import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase_client() -> Client:
    # Use the service role key for backend-level operations (bypassing RLS where needed)
    # OR we can inject the user's JWT to enforce RLS at the db level depending on the route wrapper
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: Missing SUPABASE config.")
        # In a real startup, we'd raise an exception here if missing
        return None
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)
