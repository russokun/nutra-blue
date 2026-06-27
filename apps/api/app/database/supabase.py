from supabase import create_client, Client
from app.core.config import settings

supabase_url = settings.supabase_url
supabase_key = settings.supabase_key
if settings.supabase_service_key and "your-" not in settings.supabase_service_key.lower():
    supabase_key = settings.supabase_service_key

supabase_client = None

# If credentials are not configured or are default placeholders, we print a warning
# and use local memory mock fallback in the routers to make the MVP run instantly out-of-the-box.
if not supabase_url or not supabase_key or "your-project" in supabase_url:
    print("WARNING: Supabase credentials are not configured. Running in LOCAL MOCK MODE.")
else:
    try:
        supabase_client = create_client(supabase_url, supabase_key)
        print("Connected to Supabase client successfully.")
    except Exception as e:
        print(f"Failed to connect to Supabase: {str(e)}. Running in LOCAL MOCK MODE.")

def get_supabase():
    return supabase_client
