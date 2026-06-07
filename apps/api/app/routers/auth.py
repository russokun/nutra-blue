from fastapi import APIRouter, Depends
from app.core.security import get_current_user, verify_admin_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    if not user:
        return {"authenticated": False, "user": None, "is_admin": False}

    from app.core.config import settings
    is_admin = user.get("email", "").lower() in settings.admin_emails

    return {
        "authenticated": True,
        "user": user,
        "is_admin": is_admin,
    }


@router.get("/admin-check")
async def admin_check(user: dict = Depends(verify_admin_user)):
    return {"is_admin": True, "user": user}
