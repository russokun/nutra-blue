from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import datetime
from app.core.config import settings
from app.database.supabase import supabase_client
from app.services.email_service import send_welcome_email
from app.services.leads_sheet import append_lead_to_sheet, notify_n8n

router = APIRouter(prefix="", tags=["Public"])

class LeadCreate(BaseModel):
    email: EmailStr
    source: Optional[str] = "Web"

class SuggestionCreate(BaseModel):
    text: Optional[str] = None
    product_name: Optional[str] = None  # alias principal visible en admin
    status: Optional[str] = "pendiente"

@router.get("/welcome-coupon")
async def get_welcome_coupon():
    """Cupon de bienvenida vigente, para que la tienda muestre el mismo porcentaje
    que va en el email del suscriptor sin tener que hardcodearlo."""
    return {
        "code": settings.welcome_coupon_code,
        "discount": settings.welcome_coupon_discount,
    }


@router.post("/leads")
async def create_lead(lead: LeadCreate, background_tasks: BackgroundTasks):
    """Alta de lead directa. Dispara el mismo email + planilla + n8n que
    /subscribers, para que un lead que entre por aca no se quede sin su cupon."""
    email_clean = str(lead.email).lower().strip()
    source = (lead.source or "Web").strip() or "Web"
    background_tasks.add_task(send_welcome_email, email_clean)
    background_tasks.add_task(append_lead_to_sheet, email_clean, source)
    background_tasks.add_task(notify_n8n, email_clean, source)

    if supabase_client is None:
        from app.core.mock_store import MOCK_LEADS
        new_lead = {
            "id": str(uuid.uuid4()),
            "email": email_clean,
            "source": source,
            "created_at": datetime.datetime.now().isoformat()
        }
        MOCK_LEADS.append(new_lead)
        return new_lead
    try:
        res = supabase_client.from_("leads").insert({
            "email": email_clean,
            "source": source
        }).execute()
        if not res.data:
            raise Exception("No data returned")
        return res.data[0]
    except Exception as e:
        # Fallback to local memory if table doesn't exist or insert fails
        from app.core.mock_store import MOCK_LEADS
        new_lead = {
            "id": str(uuid.uuid4()),
            "email": email_clean,
            "source": source,
            "created_at": datetime.datetime.now().isoformat()
        }
        MOCK_LEADS.append(new_lead)
        return new_lead

@router.post("/product_suggestions")
@router.post("/suggestions")
async def create_suggestion(sug: SuggestionCreate):
    # Normalizar: product_name es el campo canónico; text es alias legacy
    product_name = sug.product_name or sug.text or ""
    if not product_name:
        raise HTTPException(status_code=400, detail="Se requiere product_name o text")

    if supabase_client is None:
        from app.core.mock_store import MOCK_SUGGESTIONS
        new_sug = {
            "id": len(MOCK_SUGGESTIONS) + 1,
            "product_name": product_name,
            "text": product_name,
            "status": sug.status or "pendiente",
            "created_at": datetime.datetime.now().isoformat()
        }
        MOCK_SUGGESTIONS.append(new_sug)
        return new_sug
    try:
        res = supabase_client.from_("product_suggestions").insert({
            "product_name": product_name,
            "text": product_name,
            "status": sug.status or "pendiente"
        }).execute()
        if not res.data:
            raise Exception("No data returned")
        return res.data[0]
    except Exception as e:
        # Fallback en memoria si Supabase falla
        from app.core.mock_store import MOCK_SUGGESTIONS
        new_sug = {
            "id": len(MOCK_SUGGESTIONS) + 1,
            "product_name": product_name,
            "text": product_name,
            "status": sug.status or "pendiente",
            "created_at": datetime.datetime.now().isoformat()
        }
        MOCK_SUGGESTIONS.append(new_sug)
        return new_sug

