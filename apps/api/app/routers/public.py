from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import datetime
from app.database.supabase import supabase_client

router = APIRouter(prefix="", tags=["Public"])

class LeadCreate(BaseModel):
    email: EmailStr
    source: Optional[str] = "Web"

class SuggestionCreate(BaseModel):
    text: Optional[str] = None
    product_name: Optional[str] = None  # alias principal visible en admin
    status: Optional[str] = "pendiente"

@router.post("/leads")
async def create_lead(lead: LeadCreate):
    if supabase_client is None:
        from app.core.mock_store import MOCK_LEADS
        new_lead = {
            "id": str(uuid.uuid4()),
            "email": lead.email,
            "source": lead.source,
            "created_at": datetime.datetime.now().isoformat()
        }
        MOCK_LEADS.append(new_lead)
        return new_lead
    try:
        res = supabase_client.from_("leads").insert({
            "email": lead.email,
            "source": lead.source
        }).execute()
        if not res.data:
            raise Exception("No data returned")
        return res.data[0]
    except Exception as e:
        # Fallback to local memory if table doesn't exist or insert fails
        from app.core.mock_store import MOCK_LEADS
        new_lead = {
            "id": str(uuid.uuid4()),
            "email": lead.email,
            "source": lead.source,
            "created_at": datetime.datetime.now().isoformat()
        }
        MOCK_LEADS.append(new_lead)
        return new_lead

@router.post("/product_suggestions")
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

@router.get("/coupons/validate/{code}")
async def validate_coupon(code: str):
    code_upper = code.upper().strip()
    if supabase_client is None:
        from app.core.mock_store import MOCK_COUPONS
        coupon = next((c for c in MOCK_COUPONS if c["code"] == code_upper), None)
        if not coupon:
            raise HTTPException(status_code=404, detail="Cupón no válido o vencido")
        return {
            "valid": True,
            "code": coupon["code"],
            "discount": coupon["discount"]
        }
    try:
        res = supabase_client.from_("coupons").select("*").eq("code", code_upper).execute()
        if not res.data:
            from app.core.mock_store import MOCK_COUPONS
            coupon = next((c for c in MOCK_COUPONS if c["code"] == code_upper), None)
            if coupon:
                return {
                    "valid": True,
                    "code": coupon["code"],
                    "discount": coupon["discount"]
                }
            raise HTTPException(status_code=404, detail="Cupón no válido o vencido")
        
        coupon = res.data[0]
        # Check expiry
        expiry_str = coupon.get("expiry")
        if expiry_str:
            expiry_date = datetime.date.fromisoformat(expiry_str.split("T")[0])
            if expiry_date < datetime.date.today():
                raise HTTPException(status_code=400, detail="El cupón ha vencido")
        return {
            "valid": True,
            "code": coupon["code"],
            "discount": coupon["discount"]
        }
    except HTTPException:
        raise
    except Exception as e:
        from app.core.mock_store import MOCK_COUPONS
        coupon = next((c for c in MOCK_COUPONS if c["code"] == code_upper), None)
        if coupon:
            return {
                "valid": True,
                "code": coupon["code"],
                "discount": coupon["discount"]
            }
        raise HTTPException(status_code=404, detail="Cupón no válido o vencido")
