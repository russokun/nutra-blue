from fastapi import APIRouter
from app.database.supabase import supabase_client
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check():
    url = settings.supabase_url or ""
    key = settings.supabase_key or ""
    skey = settings.supabase_service_key or ""
    
    obfuscated_url = url[:15] + "..." if len(url) > 15 else "None"
    obfuscated_key = key[:10] + "..." if len(key) > 10 else "None"
    obfuscated_skey = skey[:10] + "..." if len(skey) > 10 else "None"

    return {
        "status": "ok",
        "supabase": {
            "initialized": supabase_client is not None,
            "url": obfuscated_url,
            "key_configured": obfuscated_key != "None",
            "service_key_configured": obfuscated_skey != "None",
            "environment": settings.environment,
            "admin_emails": settings.admin_emails
        }
    }
