"""Router de cupones de descuento para Nutra Blue."""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from app.services.coupons_service import validate_coupon_code, DEFAULT_COUPONS

router = APIRouter(prefix="/coupons", tags=["Coupons"])


class CouponValidateResponse(BaseModel):
    code: str
    discount: int
    description: Optional[str] = None
    first_purchase_only: bool = False
    valid: bool


@router.get("/validate/{code}", response_model=CouponValidateResponse)
async def validate_coupon(code: str, email: Optional[str] = Query(None, description="Email del cliente para verificar regla de primera compra")):
    """Valida un cupón y retorna el porcentaje de descuento, verificando reglas de uso."""
    coupon = validate_coupon_code(code=code, email=email)
    return CouponValidateResponse(
        code=coupon["code"],
        discount=coupon["discount"],
        description=coupon.get("description"),
        first_purchase_only=coupon.get("first_purchase_only", False),
        valid=True,
    )


@router.get("/list")
async def list_active_coupons():
    """Lista cupones activos (uso interno)."""
    return [
        {
            "code": v["code"],
            "discount": v["discount"],
            "description": v.get("description"),
            "first_purchase_only": v.get("first_purchase_only", False),
        }
        for v in DEFAULT_COUPONS.values() if v.get("active")
    ]

