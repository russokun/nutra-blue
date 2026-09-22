import logging
import httpx
from app.core.config import settings
from app.core.pricing import has_free_shipping

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

    # El total de la orden es solo el de los productos (nunca se cobra flete), asi que
    # sirve directo para decidir si el despacho lo asume NutraBlue o va por pagar.
    envio_gratis = has_free_shipping(order.get("total", 0))

    billing_html = ""
    if order.get("is_company"):
        billing_html = f"""
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #0f172a; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">Datos de Facturación Registrados</p>
            <table width="100%" style="font-size: 13px; color: #475569;">
                <tr><td style="color: #64748b; padding-bottom: 4px;">Razón Social:</td><td style="text-align: right; font-weight: 600; color: #0f172a;">{order.get('business_name', '')}</td></tr>
                <tr><td style="color: #64748b; padding-bottom: 4px;">RUT Empresa:</td><td style="text-align: right; font-family: monospace; font-weight: 600; color: #0f172a;">{order.get('tax_id', '')}</td></tr>
                <tr><td style="color: #64748b; padding-bottom: 4px;">Giro Comercial:</td><td style="text-align: right; color: #0f172a;">{order.get('business_activity', '')}</td></tr>
                <tr><td style="color: #64748b; padding-bottom: 4px;">Domicilio Comercial:</td><td style="text-align: right; color: #0f172a;">{order.get('billing_address', '')}</td></tr>
                <tr><td style="color: #64748b;">Correo Facturación:</td><td style="text-align: right; color: #0f172a;">{order.get('billing_email') or order.get('email', '')}</td></tr>
            </table>
            <p style="color: #64748b; font-size: 11px; margin: 10px 0 0 0; line-height: 1.4;">Emitiremos la factura electrónica con estos datos y te la enviaremos por correo una vez procesada. No viaja en el paquete de despacho.</p>
        </div>
        """

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
                    <h1 style="color: #38bdf8; font-family: 'Playfair Display', Georgia, serif; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Nutra Blue</h1>
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

                    {billing_html}

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
                            <td style="color: #64748b; font-size: 14px; padding-top: 6px;">Envío</td>
                            <td style="text-align: right; color: {'#16a34a' if envio_gratis else '#b45309'}; font-size: 14px; font-weight: 600; padding-top: 6px;">{'Gratis' if envio_gratis else 'Por pagar'}</td>
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
    res = await send_email(
        order["email"],
        f"Confirmación de orden #{str(order.get('id',''))[:8].upper()} - Nutra Blue",
        html,
    )
    billing_email = order.get("billing_email")
    if billing_email and str(billing_email).lower().strip() != str(order.get("email", "")).lower().strip():
        await send_email(
            billing_email,
            f"Confirmación de orden #{str(order.get('id',''))[:8].upper()} (Facturación) - Nutra Blue",
            html,
        )
    return res


async def send_payment_confirmation(order: dict) -> bool:
    billing_html = ""
    if order.get("is_company"):
        billing_html = f"""
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #0f172a; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">Datos de Facturación Registrados</p>
            <table width="100%" style="font-size: 13px; color: #475569;">
                <tr><td style="color: #64748b; padding-bottom: 4px;">Razón Social:</td><td style="text-align: right; font-weight: 600; color: #0f172a;">{order.get('business_name', '')}</td></tr>
                <tr><td style="color: #64748b; padding-bottom: 4px;">RUT Empresa:</td><td style="text-align: right; font-family: monospace; font-weight: 600; color: #0f172a;">{order.get('tax_id', '')}</td></tr>
                <tr><td style="color: #64748b; padding-bottom: 4px;">Giro Comercial:</td><td style="text-align: right; color: #0f172a;">{order.get('business_activity', '')}</td></tr>
                <tr><td style="color: #64748b; padding-bottom: 4px;">Domicilio Comercial:</td><td style="text-align: right; color: #0f172a;">{order.get('billing_address', '')}</td></tr>
                <tr><td style="color: #64748b;">Correo Facturación:</td><td style="text-align: right; color: #0f172a;">{order.get('billing_email') or order.get('email', '')}</td></tr>
            </table>
            <p style="color: #64748b; font-size: 11px; margin: 10px 0 0 0; line-height: 1.4;">Emitiremos la factura electrónica con estos datos y te la enviaremos por correo una vez procesada.</p>
        </div>
        """
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
                    <h1 style="color: #38bdf8; font-family: 'Playfair Display', Georgia, serif; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Nutra Blue</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px; text-transform: uppercase; tracking-wider: 0.1em; font-weight: 600;">Nutrición Científica & Longevidad</p>
                </td>
            </tr>
            <!-- Content -->
            <tr>
                <td style="padding: 32px 24px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #22c55e; color: #ffffff; font-size: 24px; font-weight: 700;">&#10003;</span>
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

                    {billing_html}

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
    res = await send_email(
        order["email"],
        f"Pago confirmado - Orden #{str(order.get('id',''))[:8].upper()} - Nutra Blue",
        html,
    )
    billing_email = order.get("billing_email")
    if billing_email and str(billing_email).lower().strip() != str(order.get("email", "")).lower().strip():
        await send_email(
            billing_email,
            f"Pago confirmado - Orden #{str(order.get('id',''))[:8].upper()} (Facturación) - Nutra Blue",
            html,
        )
    return res


from app.core.couriers import get_courier_name, get_tracking_url

COURIER_LABELS = {
    "blue_express": "Blue Express",
    "starken": "Starken",
    "pullman": "Pullman Cargo",
    "chilexpress": "Chilexpress",
    "correos_chile": "Correos de Chile",
}


def courier_label(value: str) -> str:
    if not value:
        return "Courier"
    clean = str(value).lower().strip()
    return COURIER_LABELS.get(clean, get_courier_name(clean))


async def send_shipping_notification(order: dict) -> bool:
    """
    Avisa al cliente que su pedido salió, con el código de seguimiento y enlace directo.

    Es el correo que send_payment_confirmation promete y que acompaña el despacho
    con acceso directo al courier y a la página de seguimiento de NutraBlue.
    """
    company_id = order.get("shipping_company") or order.get("courier")
    empresa = courier_label(company_id)
    tracking = order.get("tracking_code") or "—"
    tracking_url = get_tracking_url(company_id, tracking) if tracking != "—" else ""
    order_id = str(order.get("id", ""))
    order_short = order_id.upper()[:8]
    store_tracking_url = f"https://nutrablue.cl/seguimiento?order_id={order_id}"

    destino = ", ".join(
        p for p in [order.get("address"), order.get("city"), order.get("region")] if p
    )
    flete = "Envío pagado por NutraBlue" if order.get("shipping_payment") == "pagado" else "Flete por pagar al recibir"

    tracking_button_html = ""
    if tracking_url:
        tracking_button_html = f"""
        <div style="text-align: center; margin: 28px 0 20px 0;">
            <a href="{tracking_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); letter-spacing: 0.01em;">
                Rastrear Envío en {empresa} &rarr;
            </a>
        </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu pedido va en camino</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <tr>
                <td style="background-color: #0c1e35; padding: 32px 24px; text-align: center;">
                    <h1 style="color: #38bdf8; font-family: 'Playfair Display', Georgia, serif; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Nutra Blue</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px; text-transform: uppercase; font-weight: 600;">Nutrición Científica &amp; Longevidad</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 32px 24px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #0f172a; margin: 0 0 4px 0; font-size: 22px; font-weight: 700;">¡Tu pedido va en camino!</h2>
                        <p style="color: #64748b; margin: 0; font-size: 14px;">Ya fue entregado a la empresa de transporte</p>
                    </div>

                    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">Hola <strong>{order.get('customer_name', 'Cliente')}</strong>, tu pedido salió de nuestras instalaciones y ya se encuentra en manos de <strong>{empresa}</strong> para su entrega.</p>

                    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                        <table width="100%">
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600;">N° DE PEDIDO:</td>
                                <td style="color: #0f172a; font-size: 13px; font-weight: 700; font-family: monospace; text-align: right;">#{order_short}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-top: 8px;">EMPRESA DE TRANSPORTE:</td>
                                <td style="color: #0f172a; font-size: 13px; font-weight: 700; text-align: right; padding-top: 8px;">{empresa}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-top: 8px;">CÓDIGO DE SEGUIMIENTO:</td>
                                <td style="color: #0284c7; font-size: 15px; font-weight: 800; font-family: monospace; text-align: right; padding-top: 8px;">{tracking}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-top: 8px;">DESTINO:</td>
                                <td style="color: #0f172a; font-size: 13px; font-weight: 600; text-align: right; padding-top: 8px;">{destino}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; font-weight: 600; padding-top: 8px;">MODALIDAD DE FLETE:</td>
                                <td style="color: #0f172a; font-size: 13px; font-weight: 600; text-align: right; padding-top: 8px;">{flete}</td>
                            </tr>
                        </table>
                    </div>

                    {tracking_button_html}

                    <!-- Anti-anxiety tip -->
                    <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; border-radius: 4px 8px 8px 4px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #475569; line-height: 1.5;">
                        <strong>Nota sobre la actualización:</strong> Las empresas de transporte pueden demorar entre <strong>1 y 3 horas</strong> en sincronizar el código en sus plataformas web una vez admitido el paquete. Si aún no registra movimientos, dale unas horas.
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                        También puedes consultar el estado en cualquier momento desde <a href="{store_tracking_url}" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: 600;">nuestra web de seguimiento</a>.
                    </p>
                </td>
            </tr>
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
        f"Tu pedido va en camino - #{order_short} - Nutra Blue",
        html,
    )



async def send_welcome_email(to: str) -> bool:
    """
    Envia el email de bienvenida con el cupon de descuento del suscriptor.
    El codigo y el porcentaje salen de la configuracion (WELCOME_COUPON_CODE /
    WELCOME_COUPON_DISCOUNT), asi NutraBlue puede cambiar la oferta sin tocar
    el HTML ni el resto del flujo.
    Se dispara al registrar un nuevo suscriptor desde el pop-up o el footer.
    """
    coupon = settings.welcome_coupon_code
    discount = settings.welcome_coupon_discount
    shop_url = f"{settings.public_web_url}/shop"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Nutra Blue</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0c1e35; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
            <!-- Header -->
            <tr>
                <td style="padding: 40px 32px 24px 32px; text-align: center;">
                    <h1 style="color: #38bdf8; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: -0.02em;">Nutra Blue</h1>
                    <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Nutricion Cientifica & Longevidad</p>
                </td>
            </tr>
            <!-- Hero Banner -->
            <tr>
                <td style="padding: 0 32px;">
                    <div style="background: linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%); border-radius: 16px; padding: 32px; text-align: center;">
                        <p style="color: #bae6fd; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Tu codigo exclusivo</p>
                        <div style="background: rgba(255,255,255,0.15); border: 2px dashed rgba(255,255,255,0.5); border-radius: 12px; padding: 16px 24px; display: inline-block; margin: 8px 0;">
                            <span style="color: #ffffff; font-size: 36px; font-weight: 900; letter-spacing: 0.1em; font-family: monospace;">{coupon}</span>
                        </div>
                        <p style="color: #bae6fd; font-size: 22px; font-weight: 700; margin: 12px 0 0 0;">{discount}% de descuento</p>
                        <p style="color: #93c5fd; font-size: 13px; margin: 4px 0 0 0;">en tu primera compra</p>
                    </div>
                </td>
            </tr>
            <!-- Content -->
            <tr>
                <td style="padding: 32px;">
                    <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 12px 0; font-weight: 700;">Bienvenido a la comunidad Nutra Blue</h2>
                    <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        Eres parte de +2.000 personas que ya optimizan su biologia con ciencia aplicada. Tu codigo <strong style="color: #38bdf8;">{coupon}</strong> te da {discount}% de descuento en tu primera compra.
                    </p>
                    <!-- Benefits -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #1e3a5f;">
                                <span style="color: #38bdf8; font-size: 16px;">&#10003;</span>
                                <span style="color: #cbd5e1; font-size: 14px; margin-left: 10px;">Formulas con adaptogenos de alta biodisponibilidad</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #1e3a5f;">
                                <span style="color: #38bdf8; font-size: 16px;">&#10003;</span>
                                <span style="color: #cbd5e1; font-size: 14px; margin-left: 10px;">Ingredientes testeados por laboratorios independientes</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0;">
                                <span style="color: #38bdf8; font-size: 16px;">&#10003;</span>
                                <span style="color: #cbd5e1; font-size: 14px; margin-left: 10px;">Envio gratis en compras sobre $50.000</span>
                            </td>
                        </tr>
                    </table>
                    <!-- CTA -->
                    <div style="text-align: center;">
                        <a href="{shop_url}" style="display: inline-block; background: linear-gradient(135deg, #0284c7, #38bdf8); color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 12px; text-decoration: none; letter-spacing: 0.02em;">
                            Explorar Productos &rarr;
                        </a>
                    </div>
                </td>
            </tr>
            <!-- Footer -->
            <tr>
                <td style="padding: 20px 32px; border-top: 1px solid #1e3a5f; text-align: center;">
                    <p style="color: #475569; font-size: 11px; margin: 0;">Nutra Blue &mdash; Nutricion Cientifica &amp; Longevidad &bull; Santiago, Chile</p>
                    <p style="color: #334155; font-size: 11px; margin: 6px 0 0 0;">Puedes darte de baja cuando quieras. Respetamos tu privacidad.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return await send_email(
        to=to,
        subject=f"Tu codigo {coupon} esta aqui — {discount}% de descuento en Nutra Blue",
        html=html,
    )

