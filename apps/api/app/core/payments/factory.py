from typing import Dict, Any
from app.core.payments.base import PaymentGateway
from app.core.config import settings

class MockPayment(PaymentGateway):
    def create_transaction(self, order_id: str, amount: int, email: str, phone: str, customer_name: str) -> Dict[str, Any]:
        token = f"mock_token_{order_id}_{amount}"
        return {
            "token": token,
            "redirect_url": f"http://localhost:3000/order-confirmation/{order_id}?token={token}"
        }

    def verify_webhook(self, payload: Dict[str, Any], headers: Dict[str, Any]) -> Dict[str, Any]:
        order_id = payload.get("order_id")
        status = payload.get("status", "success")
        return {
            "status": "success" if status == "success" else "failed",
            "order_id": order_id
        }

    def handle_return(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "success",
            "order_id": params.get("order_id"),
            "token": params.get("token")
        }

class PaymentGatewayFactory:
    @staticmethod
    def get_gateway() -> PaymentGateway:
        provider = settings.payment_provider.lower()
        
        if provider == "flow":
            from app.core.payments.flow import FlowPayment
            return FlowPayment()
        elif provider == "mercadopago":
            from app.core.payments.mercadopago import MercadoPagoPayment
            return MercadoPagoPayment()
        elif provider == "transbank":
            from app.core.payments.transbank import TransbankPayment
            return TransbankPayment()
        else:
            return MockPayment()
