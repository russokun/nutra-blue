"""Endpoint de suscriptores — dispara email de bienvenida via n8n."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
import httpx
import logging
from app.core.config import settings
from app.database.supabase import supabase_client
from app.services.email_service import send_welcome_email

router = APIRouter(prefix="/subscribers", tags=["Subscribers"])
logger = logging.getLogger(__name__)


class SubscriberCreate(BaseModel):
    email: EmailStr
    source: str = "website"


@router.post("", status_code=201)
async def create_subscriber(data: SubscriberCreate, background_tasks: BackgroundTasks):
    """
    Registra un nuevo suscriptor y dispara:
    1. Guardado en base de datos Supabase (tabla leads).
    2. Email de bienvenida con codigo WELCOME15 (via Resend directo).
    3. Webhook a n8n para enriquecer el lead en el CRM o Google Sheets.
    """
    email_clean = data.email.lower().strip()

    # 1. Guardar en Supabase si está disponible
    if supabase_client is not None:
        try:
            supabase_client.from_("leads").upsert(
                {"email": email_clean, "source": data.source},
                on_conflict="email"
            ).execute()
        except Exception as e:
            logger.warning("Could not persist lead in Supabase: %s", e)

    # 2. Email de bienvenida en background (no bloquea la respuesta)
    background_tasks.add_task(send_welcome_email, email_clean)

    # 3. Notificar a n8n si esta configurado
    n8n_webhook = getattr(settings, "n8n_subscriber_webhook", "")
    if n8n_webhook:
        background_tasks.add_task(_notify_n8n, email_clean, data.source, n8n_webhook)

    logger.info("New subscriber registered: %s from %s", email_clean, data.source)
    return {"success": True, "message": "Suscripcion registrada correctamente"}


async def _notify_n8n(email: str, source: str, webhook_url: str):
    """Envia el lead a n8n para orquestacion (CRM, segmentacion, etc.)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(webhook_url, json={"email": email, "source": source})
    except Exception as e:
        logger.warning("n8n webhook failed for %s: %s", email, e)

