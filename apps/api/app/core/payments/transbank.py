from typing import Dict, Any, Optional
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_api_keys import IntegrationApiKeys
from app.core.payments.base import PaymentGateway
from app.core.config import settings


class TransbankConfigError(RuntimeError):
    """Falta configuración obligatoria de Transbank / Webpay Plus."""


class TransbankPayment(PaymentGateway):
    def __init__(self):
        self.commerce_code = settings.webpay_commerce_code
        self.api_key = settings.webpay_api_key

        if settings.is_production:
            if not self.api_key or not self.commerce_code or self.commerce_code == "597055555532":
                raise TransbankConfigError(
                    "WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY no están configurados para producción"
                )
            self.tx = Transaction.build_for_production(
                commerce_code=self.commerce_code,
                api_key=self.api_key,
            )
        else:
            if self.api_key and self.commerce_code and self.commerce_code != "597055555532":
                self.tx = Transaction.build_for_production(
                    commerce_code=self.commerce_code,
                    api_key=self.api_key,
                )
            else:
                self.tx = Transaction.build_for_integration(
                    IntegrationCommerceCodes.WEBPAY_PLUS,
                    IntegrationApiKeys.WEBPAY,
                )

    def create_transaction(
        self, order_id: str, amount: int, email: str, phone: str, customer_name: str
    ) -> Dict[str, Any]:
        return_url = f"{settings.public_api_url}/payment/transbank-return?order_id={order_id}"

        # Transbank Webpay Plus exige buy_order <= 26 caracteres y session_id <= 61 caracteres
        tbk_buy_order = order_id.replace("-", "")[:26] if len(order_id) > 26 else order_id
        tbk_session_id = order_id[:61]

        response = self.tx.create(
            buy_order=tbk_buy_order,
            session_id=tbk_session_id,
            amount=float(amount),
            return_url=return_url,
        )

        token = response.get("token") if isinstance(response, dict) else getattr(response, "token", None)
        url = response.get("url") if isinstance(response, dict) else getattr(response, "url", None)

        if not token or not url:
            raise RuntimeError(f"Transbank no retornó token o URL válidos: {response}")

        return {
            "token": token,
            "url": url,
            "redirect_url": url,
            "payment_method": "POST",
        }

    def verify_webhook(self, payload: Dict[str, Any], headers: Dict[str, Any]) -> Dict[str, Any]:
        token = payload.get("token") or payload.get("token_ws")
        if not token:
            raise ValueError("Webhook missing token")

        try:
            response = self.tx.commit(token=token)
            status = response.get("status") if isinstance(response, dict) else getattr(response, "status", None)
            response_code = (
                response.get("response_code") if isinstance(response, dict) else getattr(response, "response_code", None)
            )
            buy_order = (
                response.get("buy_order") if isinstance(response, dict) else getattr(response, "buy_order", None)
            )
            amount = response.get("amount") if isinstance(response, dict) else getattr(response, "amount", None)

            is_authorized = status == "AUTHORIZED" and response_code == 0

            return {
                "status": "success" if is_authorized else "failed",
                "order_id": buy_order,
                "amount": amount,
                "payment_id": token,
                "provider": "transbank",
                "is_test": self.commerce_code == "597055555532" or not self.commerce_code,
            }
        except Exception as e:
            raise ValueError(f"Failed to commit Transbank transaction: {str(e)}")

    def handle_return(self, params: Dict[str, Any]) -> Dict[str, Any]:
        token = params.get("token_ws")
        order_id = params.get("order_id")

        if not token:
            tbk_token = params.get("TBK_TOKEN")
            if tbk_token:
                return {
                    "status": "cancelled",
                    "order_id": order_id,
                    "token": tbk_token,
                }
            return {
                "status": "error",
                "order_id": order_id,
                "error": "No token returned from Webpay",
            }

        try:
            response = self.tx.commit(token=token)
            status = response.get("status") if isinstance(response, dict) else getattr(response, "status", None)
            response_code = (
                response.get("response_code") if isinstance(response, dict) else getattr(response, "response_code", None)
            )
            buy_order = (
                response.get("buy_order") if isinstance(response, dict) else getattr(response, "buy_order", None)
            )
            amount = response.get("amount") if isinstance(response, dict) else getattr(response, "amount", None)
            authorization_code = (
                response.get("authorization_code")
                if isinstance(response, dict)
                else getattr(response, "authorization_code", None)
            )
            payment_type_code = (
                response.get("payment_type_code")
                if isinstance(response, dict)
                else getattr(response, "payment_type_code", None)
            )
            shares_number = (
                response.get("shares_number")
                if isinstance(response, dict)
                else getattr(response, "shares_number", None)
            )
            card_detail = (
                response.get("card_detail")
                if isinstance(response, dict)
                else getattr(response, "card_detail", None)
            )
            card_number = (
                card_detail.get("card_number")
                if isinstance(card_detail, dict)
                else getattr(card_detail, "card_number", None)
                if card_detail
                else None
            )

            is_authorized = status == "AUTHORIZED" and response_code == 0

            return {
                "status": "success" if is_authorized else ("rejected" if response_code != 0 else "failed"),
                "order_id": order_id or buy_order,
                "token": token,
                "amount": amount,
                "payment_id": authorization_code or token,
                "is_test": self.commerce_code == "597055555532" or not self.commerce_code,
                "response_details": {
                    "payment_type_code": payment_type_code,
                    "shares_number": shares_number,
                    "card_number": card_number,
                    "authorization_code": authorization_code,
                    "response_code": response_code,
                },
            }
        except Exception as e:
            return {
                "status": "error",
                "order_id": order_id,
                "error": f"Failed to commit transaction: {str(e)}",
            }

