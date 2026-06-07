from typing import Optional
from fastapi import Header, HTTPException, Depends
from app.core.config import settings
from app.database.supabase import supabase_client


async def verify_internal_api_key(x_internal_api_key: str = Header(None, alias="X-Internal-API-Key")):
    """Protects internal endpoints. Requires INTERNAL_API_KEY to be configured."""
    if not settings.internal_api_key:
        raise HTTPException(
            status_code=503,
            detail="Internal API key is not configured on the server",
        )
    if not x_internal_api_key or x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Invalid or missing internal API key")


async def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    if supabase_client is None:
        return None

    token = authorization.split(" ", 1)[1]
    try:
        user_response = supabase_client.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": user_response.user.id,
                "email": user_response.user.email,
            }
    except Exception:
        pass
    return None


async def verify_admin_user(user: Optional[dict] = Depends(get_current_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not settings.admin_emails:
        raise HTTPException(status_code=503, detail="Admin access is not configured")

    if user.get("email", "").lower() not in settings.admin_emails:
        raise HTTPException(status_code=403, detail="Admin access denied")

    return user
