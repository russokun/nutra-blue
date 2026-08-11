import hashlib
import hmac
from typing import Dict, Any, List, Optional
import mercadopago
from app.core.payments.base import PaymentGateway
from app.core.config import settings


class MercadoPagoConfigError(RuntimeError):
    """Falta configuracion obligatoria de Mercado Pago."""


class MercadoPagoPayment(PaymentGateway):
    def __init__(self):
        self.access_token = settings.mercadopago_access_token
        if not self.access_token and settings.is_production:
            # En produccion nunca se cae al mock: marcar una orden como pagada sin
            # haber cobrado es peor que rechazar el checkout.
            raise MercadoPagoConfigError(
                "MERCADOPAGO_ACCESS_TOKEN no esta configurado en produccion"
            )
        self.sdk = mercadopago.SDK(self.access_token) if self.access_token else None

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def _header(headers: Dict[str, Any], name: str) -> str:
        """Los headers llegan como dict plano; buscar sin importar el case."""
        for key, value in headers.items():
            if key.lower() == name:
                return value or ""
        return ""

    def _build_items(self, order_id: str, amount: int) -> List[Dict[str, Any]]:
        """
        Detalla el carrito en la preferencia. El monto cobrado por Checkout Pro es la
        SUMA de los items, asi que si el desglose no cuadra exactamente con el total
        de la orden (por ejemplo con un cupon aplicado) se cobra una sola linea con
        el total. El invariante que importa es cobrar exactamente order["total"].
        """
        from app.services.orders_service import get_order_by_id

        single_item = [{
            "title": f"Compra Pedido #{order_id}",
            "quantity": 1,
            "unit_price": int(amount),
            "currency_id": "CLP",
        }]

        order = get_order_by_id(order_id)
        if not order:
            return single_item

        items = []
        breakdown = 0
        for item in order.get("items") or []:
            quantity = int(item.get("quantity", 0))
            unit_price = int(item.get("unit_price", 0))
            if quantity <= 0 or unit_price <= 0:
                return single_item
            items.append({
                "title": item.get("name") or f"Producto {item.get('product_id')}",
                "quantity": quantity,
                "unit_price": unit_price,
                "currency_id": "CLP",
            })
            breakdown += quantity * unit_price

        # Ya no se cobra despacho (pricing.calculate_shipping devuelve 0), pero esta rama
        # sigue haciendo falta: las ordenes creadas antes del cambio que quedaron pendientes
        # y se pagan despues si traen shipping_cost persistido. Sin ella el desglose no
        # cuadraria con el total y la preferencia caeria a la linea unica de mas abajo.
        shipping_cost = int(order.get("shipping_cost", 0) or 0)
        if shipping_cost > 0:
            items.append({
                "title": "Despacho",
                "quantity": 1,
                "unit_price": shipping_cost,
                "currency_id": "CLP",
            })
            breakdown += shipping_cost

        if not items or breakdown != int(amount):
            return single_item
        return items

    # ------------------------------------------------------------- create / init

    def create_transaction(self, order_id: str, amount: int, email: str, phone: str, customer_name: str) -> Dict[str, Any]:
        if not self.sdk:
            # Solo alcanzable fuera de produccion (ver __init__): permite correr el
            # checkout local y los tests sin credenciales.
            token = f"mp_mock_token_{order_id}_{int(amount)}"
            return {
                "token": token,
                "redirect_url": f"https://www.mercadopago.cl/checkout/v1/redirect?pref_id={token}"
            }

        web_url = settings.public_web_url

        preference_data = {
            "items": self._build_items(order_id, amount),
            "payer": {
                "email": email,
                "phone": {
                    "number": phone
                },
                "name": customer_name
            },
            "back_urls": {
                "success": f"{web_url}/order-confirmation/{order_id}",
                "failure": f"{web_url}/checkout",
                "pending": f"{web_url}/checkout"
            },
            "external_reference": order_id,
            "metadata": {"order_id": order_id},
            "notification_url": f"{settings.public_api_url}/payment/mercadopago-callback",
        }

        # auto_return exige back_urls alcanzables por https; con el front en
        # localhost Mercado Pago rechaza la preferencia entera.
        if web_url.startswith("https://"):
            preference_data["auto_return"] = "approved"

        # Sin fallback: si Mercado Pago falla, el checkout tiene que fallar tambien.
        # Devolver una URL inventada hacia que el cliente creyera que estaba pagando.
        preference_response = self.sdk.preference().create(preference_data)
        status = preference_response.get("status")
        preference = preference_response.get("response") or {}

        if status not in (200, 201) or not preference.get("init_point"):
            raise RuntimeError(
                f"Mercado Pago rechazo la preferencia (status {status}): {preference}"
            )

        # El entorno lo define el token: TEST-... devuelve un init_point de prueba y
        # APP_USR-... uno real. No hay que elegir entre init_point y sandbox_init_point.
        return {
            "token": preference["id"],
            "redirect_url": preference["init_point"]
        }

    # ------------------------------------------------------------------- webhook

    def _verify_signature(self, payload: Dict[str, Any], headers: Dict[str, Any]) -> None:
        """
        Valida el header x-signature de Mercado Pago: `ts=<timestamp>,v1=<hmac>`.
        El manifest firmado es `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`,
        omitiendo los segmentos cuyo valor no venga en la notificacion.
        """
        secret = settings.mercadopago_webhook_secret
        if not secret:
            # Sin secreto no hay forma de saber que la notificacion viene de Mercado
            # Pago. Fuera de produccion se deja pasar para poder probar con un tunel,
            # pero en produccion tiene que estar configurado si o si: el endpoint es
            # publico y marca ordenes como pagadas.
            if settings.is_production:
                raise ValueError(
                    "MERCADOPAGO_WEBHOOK_SECRET no esta configurado: el webhook no se "
                    "puede verificar en produccion"
                )
            return

        signature = self._header(headers, "x-signature")
        if not signature:
            raise ValueError("Webhook sin header x-signature")

        parts = {}
        for chunk in signature.split(","):
            if "=" in chunk:
                key, _, value = chunk.partition("=")
                parts[key.strip()] = value.strip()

        ts = parts.get("ts")
        received_hash = parts.get("v1")
        if not ts or not received_hash:
            raise ValueError("Header x-signature con formato invalido")

        data_id = str((payload.get("data") or {}).get("id") or "")
        if data_id.isalnum():
            data_id = data_id.lower()
        request_id = self._header(headers, "x-request-id")

        manifest = ""
        if data_id:
            manifest += f"id:{data_id};"
        if request_id:
            manifest += f"request-id:{request_id};"
        manifest += f"ts:{ts};"

        expected = hmac.new(
            secret.encode("utf-8"),
            manifest.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, received_hash):
            raise ValueError("Firma del webhook de Mercado Pago invalida")

    def verify_webhook(self, payload: Dict[str, Any], headers: Dict[str, Any]) -> Dict[str, Any]:
        if not self.sdk:
            # Solo fuera de produccion (ver __init__).
            if payload.get("status") == "approved" or payload.get("type") == "payment":
                return {
                    "status": "success",
                    "order_id": payload.get("order_id") or payload.get("data", {}).get("id"),
                    "provider": "mercadopago",
                    "payment_id": None,
                    "is_test": True,
                }
            raise ValueError("Mercado Pago SDK not configured")

        # Payload: { "action": "payment.created", "data": { "id": ... }, "type": "payment" }
        if payload.get("type") != "payment":
            return {"status": "ignored", "order_id": None}

        self._verify_signature(payload, headers)

        payment_id = payload.get("data", {}).get("id")
        if not payment_id:
            raise ValueError("Webhook missing payment ID in data")

        try:
            payment_info = self.sdk.payment().get(payment_id)
        except Exception as e:
            raise ValueError(f"Failed to verify payment with Mercado Pago API: {str(e)}")

        payment = payment_info.get("response") or {}
        if payment_info.get("status") not in (200, 201) or not payment:
            raise ValueError(f"Mercado Pago no devolvio el pago {payment_id}: {payment}")

        status = payment.get("status")

        return {
            "status": "success" if status == "approved" else "failed",
            "order_id": payment.get("external_reference"),
            "provider": "mercadopago",
            "payment_id": str(payment_id),
            "status_detail": payment.get("status_detail"),
            # Lo que Mercado Pago dice que se cobro realmente. El router lo compara
            # contra el total de la orden antes de marcarla como pagada.
            "amount": payment.get("transaction_amount"),
            # live_mode=False son los pagos hechos con credenciales de prueba.
            "is_test": payment.get("live_mode") is False,
        }

    def handle_return(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "payment_id": params.get("payment_id"),
            "status": params.get("status"),
            "external_reference": params.get("external_reference")
        }
