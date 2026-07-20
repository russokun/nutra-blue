from typing import Dict, Any
from transbank.webpay.webpay_plus.transaction import Transaction
from app.core.payments.base import PaymentGateway
from app.core.config import settings

class TransbankPayment(PaymentGateway):
    def __init__(self):
        self.commerce_code = settings.webpay_commerce_code
        self.api_key = settings.webpay_api_key

        # Initialize Transbank Transaction (transbank-sdk >= 6.0 uses build_for_* factories)
        if self.api_key and self.commerce_code and self.commerce_code != "597055555532":
            # Configure for production Webpay
            self.tx = Transaction.build_for_production(
                commerce_code=self.commerce_code,
                api_key=self.api_key
            )
        else:
            # Configure for integration (sandbox) Webpay
            self.tx = Transaction.build_for_integration(
                commerce_code="597055555532",
                api_key="579B532A7440BB0C9079DED94D31EA1615B1E9B34D75A4C46286B795E46A74E0"
            )

    def create_transaction(self, order_id: str, amount: int, email: str, phone: str, customer_name: str) -> Dict[str, Any]:
        try:
            return_url = f"https://{settings.website_domain}/hcgi/api/payment/transbank-return?order_id={order_id}"
            
            response = self.tx.create(
                buy_order=order_id,
                session_id=order_id,
                amount=float(amount),
                return_url=return_url
            )
            
            return {
                "token": response.token,
                "redirect_url": f"{response.url}?token_ws={response.token}"
            }
        except Exception as e:
            # Fallback mock URL in case of API error or sandbox issues
            token = f"tbk_mock_token_{order_id}"
            return {
                "token": token,
                "redirect_url": f"https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions_mock?token_ws={token}",
                "warning": f"Transbank creation failed ({str(e)}), returned fallback mock URL"
            }

    def verify_webhook(self, payload: Dict[str, Any], headers: Dict[str, Any]) -> Dict[str, Any]:
        # Transbank uses return redirection (commit) instead of webhooks.
        # But if they send a webhook notify, we handle it.
        token = payload.get("token") or payload.get("token_ws")
        if not token:
            raise ValueError("Webhook missing token")

        try:
            # Commit the transaction to authorize it
            response = self.tx.commit(token=token)
            is_authorized = response.status == "AUTHORIZED" and response.response_code == 0
            
            return {
                "status": "success" if is_authorized else "failed",
                "order_id": response.buy_order
            }
        except Exception as e:
            raise ValueError(f"Failed to commit Transbank transaction: {str(e)}")

    def handle_return(self, params: Dict[str, Any]) -> Dict[str, Any]:
        # Handle Transbank return payload
        token = params.get("token_ws")
        order_id = params.get("order_id")
        
        if not token:
            # Check if user cancelled: tbk_token is returned
            tbk_token = params.get("TBK_TOKEN")
            if tbk_token:
                return {
                    "status": "cancelled",
                    "order_id": order_id,
                    "token": tbk_token
                }
            return {
                "status": "error",
                "order_id": order_id,
                "error": "No token returned from Webpay"
            }

        try:
            # Commit transaction on return redirection
            response = self.tx.commit(token=token)
            is_authorized = response.status == "AUTHORIZED" and response.response_code == 0
            
            return {
                "status": "success" if is_authorized else "failed",
                "order_id": response.buy_order or order_id,
                "token": token,
                "response_details": {
                    "payment_type_code": response.payment_type_code,
                    "shares_number": response.shares_number,
                    "card_number": response.card_detail.get("card_number") if response.card_detail else None
                }
            }
        except Exception as e:
            return {
                "status": "error",
                "order_id": order_id,
                "error": f"Failed to commit transaction: {str(e)}"
            }
