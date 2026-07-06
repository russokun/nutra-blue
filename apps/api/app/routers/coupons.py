"""Router de cupones de descuento para Nutra Blue."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/coupons", tags=["Coupons"])

# Cupones activos — migrar a Supabase en produccion
VALID_COUPONS: dict = {
    "WELCOME15": {"code": "WELCOME15", "discount": 15, "description": "Bienvenida 15% off", "active": True},
    "NUTRA10":   {"code": "NUTRA10",   "discount": 10, "description": "Descuento especial 10%", "active": True},
    "LONGEVIDAD20": {"code": "LONGEVIDAD20", "discount": 20, "description": "Longevidad 20% off", "active": True},
    "BIOHACK":   {"code": "BIOHACK",   "discount": 12, "description": "Biohackers 12% off", "active": True},
}


class CouponValidateResponse(BaseModel):
    code: str
    discount: int
    description: Optional[str] = None
    valid: bool


@router.get("/validate/{code}", response_model=CouponValidateResponse)
async def validate_coupon(code: str):
    """Valida un cupon y retorna el porcentaje de descuento."""
    normalized = code.strip().upper()
    coupon = VALID_COUPONS.get(normalized)
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupon no valido o no existe")
    if not coupon.get("active", False):
        raise HTTPException(status_code=400, detail="Este cupon ya no esta activo")
    return CouponValidateResponse(
        code=coupon["code"],
        discount=coupon["discount"],
        description=coupon.get("description"),
        valid=True,
    )


@router.get("/list")
async def list_active_coupons():
    """Lista cupones activos (uso interno)."""
    return [
        {"code": v["code"], "discount": v["discount"]}
        for v in VALID_COUPONS.values() if v.get("active")
    ]
