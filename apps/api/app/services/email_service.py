import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.email_enabled or not settings.resend_api_key:
        logger.info("Email disabled or not configured. Would send to %s: %s", to, subject)
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.email_from,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
                timeout=15.0,
            )
            if response.status_code in (200, 201):
                return True
            logger.error("Resend API error %s: %s", response.status_code, response.text)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)

    return False


def format_clp(amount: int) -> str:
    return f"${amount:,.0f}".replace(",", ".")


async def send_order_confirmation(order: dict) -> bool:
    items_html = "".join(
        f"<li>{item.get('name', item.get('product_id', 'Producto'))} x{item['quantity']}</li>"
        for item in order.get("items", [])
    )
    html = f"""
    <h2>¡Gracias por tu compra, {order['customer_name']}!</h2>
    <p>Tu orden <strong>#{order['id']}</strong> ha sido registrada.</p>
    <ul>{items_html}</ul>
    <p><strong>Total:</strong> {format_clp(order['total'])} CLP</p>
    <p>Te notificaremos cuando tu pedido sea despachado.</p>
    <p>— Equipo Nutra Blue</p>
    """
    return await send_email(
        order["email"],
        f"Confirmación de orden #{order['id']} - Nutra Blue",
        html,
    )


async def send_payment_confirmation(order: dict) -> bool:
    html = f"""
    <h2>Pago confirmado</h2>
    <p>Hola {order['customer_name']},</p>
    <p>Recibimos el pago de tu orden <strong>#{order['id']}</strong>.</p>
    <p><strong>Total pagado:</strong> {format_clp(order['total'])} CLP</p>
    <p>Estamos preparando tu envío a {order['address']}, {order['city']}.</p>
    <p>— Equipo Nutra Blue</p>
    """
    return await send_email(
        order["email"],
        f"Pago confirmado - Orden #{order['id']} - Nutra Blue",
        html,
    )
