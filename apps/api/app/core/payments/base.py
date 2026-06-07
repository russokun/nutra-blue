from abc import ABC, abstractmethod
from typing import Dict, Any

class PaymentGateway(ABC):
    @abstractmethod
    def create_transaction(self, order_id: str, amount: int, email: str, phone: str, customer_name: str) -> Dict[str, Any]:
        """
        Starts a transaction and returns the redirect URL and the gateway transaction token.
        """
        pass

    @abstractmethod
    def verify_webhook(self, payload: Dict[str, Any], headers: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates the authenticity of the webhook call and returns payment status and order ID.
        Returns:
            Dict containing {"status": "success" | "failed", "order_id": str}
        """
        pass
    
    @abstractmethod
    def handle_return(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handles the return redirection from the gateway back to the webapp.
        """
        pass
