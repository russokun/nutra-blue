"""Envio de leads a la planilla de Google Sheets.

La planilla se alimenta por dos caminos independientes, y cualquiera de los dos
basta para que el lead quede registrado:

1. `GOOGLE_SHEETS_LEADS_WEBHOOK`: URL de un Web App de Google Apps Script que
   agrega la fila directamente. No depende de que n8n este corriendo.
   El script esta en `apps/api/scripts/google_apps_script_leads.gs`.
2. `N8N_SUBSCRIBER_WEBHOOK`: el flujo de n8n (`n8n_subscriber_flow.json`), que
   ademas puede enriquecer el lead en un CRM.

Ninguno de los dos es obligatorio: si no estan configurados, el lead igual queda
en la tabla `leads` de Supabase y visible en el panel de administracion.
"""
import asyncio
import logging
from datetime import datetime, timezone

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Dos reintentos rapidos: cubren el caso comun de que Apps Script o n8n devuelvan
# un 5xx pasajero, sin dejar colgada la BackgroundTask.
_MAX_ATTEMPTS = 3
_BACKOFF_SECONDS = (1, 3)
_TIMEOUT = 10.0


def build_lead_payload(email: str, source: str) -> dict:
    """Payload comun para la planilla y para n8n."""
    return {
        "event": "new_lead_first_purchase",
        "email": email,
        "source": source or "website",
        "date": datetime.now(timezone.utc).isoformat(),
        "coupon_code": settings.welcome_coupon_code,
        "discount": settings.welcome_coupon_discount,
        "description": (
            f"Bienvenida {settings.welcome_coupon_discount}% off en primera compra"
        ),
    }


async def _post_with_retry(url: str, payload: dict, label: str) -> bool:
    last_error = "sin respuesta"
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
                response = await client.post(url, json=payload)
            if response.status_code < 400:
                logger.info("%s: lead %s registrado", label, payload.get("email"))
                return True
            last_error = f"HTTP {response.status_code}: {response.text[:200]}"
        except Exception as exc:  # noqa: BLE001 - nunca debe romper la suscripcion
            last_error = str(exc)

        if attempt < _MAX_ATTEMPTS:
            await asyncio.sleep(_BACKOFF_SECONDS[attempt - 1])

    # El lead no se pierde: queda en Supabase y en este log para reprocesarlo.
    logger.error(
        "%s: no se pudo registrar el lead %s tras %s intentos (%s)",
        label,
        payload.get("email"),
        _MAX_ATTEMPTS,
        last_error,
    )
    return False


async def append_lead_to_sheet(email: str, source: str) -> bool:
    """Agrega el lead a la planilla via Apps Script. No-op si no esta configurado."""
    webhook = settings.google_sheets_leads_webhook
    if not webhook:
        logger.debug("GOOGLE_SHEETS_LEADS_WEBHOOK sin configurar; se omite la planilla")
        return False

    payload = build_lead_payload(email, source)
    if settings.google_sheets_leads_token:
        payload["token"] = settings.google_sheets_leads_token
    return await _post_with_retry(webhook, payload, "Google Sheets")


async def notify_n8n(email: str, source: str) -> bool:
    """Envia el lead a n8n para orquestacion (CRM, planilla, cupones)."""
    webhook = settings.n8n_subscriber_webhook
    if not webhook:
        logger.debug("N8N_SUBSCRIBER_WEBHOOK sin configurar; se omite n8n")
        return False

    return await _post_with_retry(webhook, build_lead_payload(email, source), "n8n")
