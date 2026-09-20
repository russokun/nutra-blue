"""Endpoint de suscriptores: guarda el lead y le manda su cupon de bienvenida."""
import logging

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.database.supabase import supabase_client
from app.services.email_service import send_welcome_email
from app.services.leads_sheet import append_lead_to_sheet, notify_n8n

router = APIRouter(prefix="/subscribers", tags=["Subscribers"])
logger = logging.getLogger(__name__)


class SubscriberCreate(BaseModel):
    email: EmailStr
    source: str = "website"


def _persist_lead(email: str, source: str) -> bool:
    """Guarda el lead en Supabase. Es la fuente de verdad del panel."""
    if supabase_client is None:
        logger.warning("Supabase no configurado: el lead %s no se persiste", email)
        return False
    try:
        supabase_client.from_("leads").upsert(
            {"email": email, "source": source},
            on_conflict="email",
        ).execute()
        return True
    except Exception as e:  # noqa: BLE001 - la suscripcion no debe fallar por esto
        logger.error("No se pudo guardar el lead %s en Supabase: %s", email, e)
        return False


@router.post("", status_code=201)
async def create_subscriber(data: SubscriberCreate, background_tasks: BackgroundTasks):
    """
    Registra un suscriptor del pop-up del home o del formulario del footer.

    El lead se replica en cuatro destinos, todos independientes entre si para que
    la caida de uno no se lleve al resto:
      1. Tabla `leads` de Supabase (lo que ve el panel de administracion).
      2. Email de bienvenida con el cupon de descuento (Resend).
      3. Planilla de Google Sheets (Apps Script), si esta configurada.
      4. Webhook de n8n, si esta configurado.

    Siempre responde 201: el visitante no tiene por que enterarse de un problema
    en un destino interno, y el lead queda registrado en al menos uno de ellos.
    """
    email_clean = data.email.lower().strip()
    source = (data.source or "website").strip() or "website"

    persisted = _persist_lead(email_clean, source)

    # Los envios salen en background para no hacer esperar al formulario.
    background_tasks.add_task(send_welcome_email, email_clean)
    background_tasks.add_task(append_lead_to_sheet, email_clean, source)
    background_tasks.add_task(notify_n8n, email_clean, source)

    logger.info(
        "Nuevo suscriptor: %s desde %s (persistido en Supabase: %s)",
        email_clean,
        source,
        persisted,
    )
    return {
        "success": True,
        "message": "Suscripcion registrada correctamente",
        "coupon_code": settings.welcome_coupon_code,
        "discount": settings.welcome_coupon_discount,
    }
