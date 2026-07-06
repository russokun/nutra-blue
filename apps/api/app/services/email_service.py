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
    items_rows = "".join(
        f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eef2f6; color: #334155; font-size: 14px;">
                {item.get('name', item.get('product_id', 'Producto'))}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eef2f6; color: #475569; font-size: 14px; text-align: center;">
                x{item.get('quantity', 1)}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eef2f6; color: #334155; font-size: 14px; text-align: right; font-weight: 600;">
                {format_clp(int(item.get('price', 0)) * int(item.get('quantity', 1)))} CLP
            </td>
        </tr>
        """
        for item in order.get("items", [])
    )
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Pedido</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <!-- Header -->
            <tr>
                <td style="background-color: #0c1e35; padding: 32px 24px; text-align: center;">
                    <h1 style="color: #38bdf8; font-family: 'Playfair Display', Georgia, serif; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Nutra Blue <span style="font-size: 20px;">🌿</span></h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px; text-transform: uppercase; tracking-wider: 0.1em; font-weight: 600;">Nutrición Científica & Longevidad</p>
                </td>
            </tr>
            <!-- Content -->
            <tr>
                <td style="padding: 32px 24px;">
                    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">¡Gracias por tu compra, {order.get('customer_name', 'Cliente')}!</h2>
                    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-size: 15px;">Tu pedido ha sido registrado correctamente y se encuentra en proceso de validación. A continuación encontrarás el resumen de tu compra:</p>
                    
                    <!-- Order Info Badge -->
                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <table width="100%">
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600;">ID PEDIDO:</td>
                                <td style="color: #0f172a; font-size: 13px; font-weight: 700; font-family: monospace; text-align: right;">{str(order.get('id', '')).upper()[:8]}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-top: 4px;">ESTADO DE PAGO:</td>
                                <td style="color: #d97706; font-size: 13px; font-weight: 700; text-align: right; padding-top: 4px; text-transform: uppercase;">PENDIENTE DE PAGO</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">
                        <thead>
                            <tr style="background-color: #f8fafc;">
                                <th style="padding: 12px; text-align: left; color: #475569; font-size: 12px; font-weight: 700; border-bottom: 2px solid #e2e8f0; text-transform: uppercase;">Producto</th>
                                <th style="padding: 12px; text-align: center; color: #475569; font-size: 12px; font-weight: 700; border-bottom: 2px solid #e2e8f0; text-transform: uppercase;">Cant.</th>
                                <th style="padding: 12px; text-align: right; color: #475569; font-size: 12px; font-weight: 700; border-bottom: 2px solid #e2e8f0; text-transform: uppercase;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_rows}
                        </tbody>
                    </table>

                    <!-- Totals -->
                    <table width="100%" style="margin-bottom: 32px;">
                        <tr>
                            <td style="color: #64748b; font-size: 14px;">Subtotal</td>
                            <td style="text-align: right; color: #334155; font-size: 14px; font-weight: 600;">{format_clp(order.get('subtotal', 0))} CLP</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; font-size: 14px; padding-top: 6px;">IVA (19%)</td>
                            <td style="text-align: right; color: #334155; font-size: 14px; font-weight: 600; padding-top: 6px;">{format_clp(order.get('tax', 0))} CLP</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; font-size: 14px; padding-top: 6px;">Costo de Envío</td>
                            <td style="text-align: right; color: #334155; font-size: 14px; font-weight: 600; padding-top: 6px;">{format_clp(order.get('shipping_cost', 0))} CLP</td>
                        </tr>
                        <tr>
                            <td style="color: #0f172a; font-size: 16px; font-weight: 700; padding-top: 12px; border-t: 1px solid #e2e8f0;">Total General</td>
                            <td style="text-align: right; color: #0284c7; font-size: 18px; font-weight: 800; padding-top: 12px; border-t: 1px solid #e2e8f0;">{format_clp(order.get('total', 0))} CLP</td>
                        </tr>
                    </table>

                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">Si tienes dudas sobre tu pedido, por favor contáctanos respondiendo directamente a este correo.</p>
                </td>
            </tr>
            <!-- Footer -->
            <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
                    <p style="margin: 0 0 8px 0;">Nutra Blue SpA. Sencillez, Ciencia y Transparencia.</p>
                    <p style="margin: 0;">© 2026 Nutra Blue. Todos los derechos reservados.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return await send_email(
        order["email"],
        f"Confirmación de orden #{str(order.get('id',''))[:8].upper()} - Nutra Blue",
        html,
    )


async def send_payment_confirmation(order: dict) -> bool:
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Confirmado</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <!-- Header -->
            <tr>
                <td style="background-color: #0c1e35; padding: 32px 24px; text-align: center;">
                    <h1 style="color: #38bdf8; font-family: 'Playfair Display', Georgia, serif; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Nutra Blue <span style="font-size: 20px;">🌿</span></h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px; text-transform: uppercase; tracking-wider: 0.1em; font-weight: 600;">Nutrición Científica & Longevidad</p>
                </td>
            </tr>
            <!-- Content -->
            <tr>
                <td style="padding: 32px 24px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 48px;">✅</span>
                        <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">¡Pago Confirmado!</h2>
                        <p style="color: #64748b; margin: 0; font-size: 14px;">Hemos recibido exitosamente el pago de tu orden</p>
                    </div>

                    <p style="color: #475569; line-height: 1.6; margin: 0 0 24px 0; font-size: 15px;">Hola <strong>{order.get('customer_name', 'Cliente')}</strong>, queremos informarte que tu pago ha sido validado correctamente. Ya estamos preparando tu envío.</p>
                    
                    <!-- Order Info Badge -->
                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <table width="100%">
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600;">ID PEDIDO:</td>
                                <td style="color: #0f172a; font-size: 13px; font-weight: 700; font-family: monospace; text-align: right;">{str(order.get('id', '')).upper()[:8]}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-top: 4px;">TOTAL PAGADO:</td>
                                <td style="color: #0284c7; font-size: 13px; font-weight: 700; text-align: right; padding-top: 4px;">{format_clp(order.get('total', 0))} CLP</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-top: 4px;">DIRECCIÓN DE ENVÍO:</td>
                                <td style="color: #0f172a; font-size: 13px; font-weight: 600; text-align: right; padding-top: 4px;">{order.get('address', '')}, {order.get('city', '')}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Recibirás un nuevo correo con el código de seguimiento una vez que el courier retire tu paquete.</p>
                </td>
            </tr>
            <!-- Footer -->
            <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
                    <p style="margin: 0 0 8px 0;">Nutra Blue SpA. Sencillez, Ciencia y Transparencia.</p>
                    <p style="margin: 0;">© 2026 Nutra Blue. Todos los derechos reservados.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return await send_email(
        order["email"],
        f"Pago confirmado - Orden #{str(order.get('id',''))[:8].upper()} - Nutra Blue",
        html,
    )
