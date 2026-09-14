"""Servicio centralizado de cupones y validación de primera compra."""
import logging
import datetime
from typing import Optional
from fastapi import HTTPException
from app.database.supabase import supabase_client

logger = logging.getLogger(__name__)

DEFAULT_COUPONS: dict = {
    "WELCOME15": {
        "code": "WELCOME15",
        "discount": 15,
        "description": "Bienvenida 15% off en primera compra",
        "active": True,
        "first_purchase_only": True,
    },
    "BIENVENIDA15": {
        "code": "BIENVENIDA15",
        "discount": 15,
        "description": "Bienvenida 15% off en primera compra",
        "active": True,
        "first_purchase_only": True,
    },
    "NUTRA10": {
        "code": "NUTRA10",
        "discount": 10,
        "description": "Descuento especial 10%",
        "active": True,
        "first_purchase_only": False,
    },
    "LONGEVIDAD20": {
        "code": "LONGEVIDAD20",
        "discount": 20,
        "description": "Longevidad 20% off",
        "active": True,
        "first_purchase_only": False,
    },
    "BIOHACK": {
        "code": "BIOHACK",
        "discount": 12,
        "description": "Biohackers 12% off",
        "active": True,
        "first_purchase_only": False,
    },
}


def has_customer_completed_orders(email: str) -> bool:
    """Verifica si un cliente ya tiene compras pagadas registradas en el sistema."""
    if not email or not email.strip():
        return False

    email_clean = email.strip().lower()

    # 1. Consultar en Supabase si está disponible
    if supabase_client is not None:
        try:
            res = (
                supabase_client.from_("orders")
                .select("id")
                .ilike("email", email_clean)
                .in_("status", ["paid", "completed", "shipped", "delivered"])
                .limit(1)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return True
        except Exception as e:
            logger.warning("No se pudo verificar órdenes previas en Supabase: %s", e)

    # 2. Fallback a MOCK_ORDERS en desarrollo / local
    try:
        from app.core.mock_store import MOCK_ORDERS
        for order in MOCK_ORDERS.values():
            if (
                str(order.get("email", "")).strip().lower() == email_clean
                and order.get("status") in ("paid", "completed", "shipped", "delivered")
            ):
                return True
    except Exception as e:
        logger.warning("Error verificando MOCK_ORDERS: %s", e)

    return False


def validate_coupon_code(code: str, email: Optional[str] = None) -> dict:
    """
    Valida la vigencia y restricciones de un cupón de descuento.
    Si el cupón es exclusivo para primera compra y se proporciona email,
    verifica que el usuario no tenga compras pagadas previas.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Debes ingresar un código de cupón")

    normalized = code.strip().upper()
    coupon: Optional[dict] = None

    # 1. Buscar en base de datos Supabase si está disponible
    if supabase_client is not None:
        try:
            res = supabase_client.from_("coupons").select("*").eq("code", normalized).execute()
            if res.data:
                row = res.data[0]
                # Validar expiración si existe fecha
                expiry_str = row.get("expiry")
                if expiry_str:
                    try:
                        expiry_date = datetime.date.fromisoformat(expiry_str.split("T")[0])
                        if expiry_date < datetime.date.today():
                            raise HTTPException(status_code=400, detail="Este cupón ha expirado")
                    except ValueError:
                        pass

                coupon = {
                    "code": row.get("code", normalized),
                    "discount": int(row.get("discount", 0)),
                    "description": row.get("description") or f"Descuento {row.get('discount')}%",
                    "active": row.get("active", True),
                    "first_purchase_only": bool(row.get("first_purchase_only", normalized in ("WELCOME15", "BIENVENIDA15"))),
                }
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("Error consultando tabla coupons en Supabase: %s", e)

    # 2. Fallback a cupones estándar configurados
    if not coupon:
        coupon = DEFAULT_COUPONS.get(normalized)

    if not coupon:
        raise HTTPException(status_code=404, detail=f"El cupón '{normalized}' no es válido o no existe")

    if not coupon.get("active", True):
        raise HTTPException(status_code=400, detail="Este cupón ya no se encuentra activo")

    # 3. Validación de primera compra
    is_first_purchase_only = coupon.get("first_purchase_only", False)
    if is_first_purchase_only and email and email.strip():
        if has_customer_completed_orders(email):
            raise HTTPException(
                status_code=400,
                detail=f"El cupón {coupon['code']} es válido únicamente para tu primera compra."
            )

    return coupon
