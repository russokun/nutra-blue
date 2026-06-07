from typing import Optional
from fastapi import HTTPException
from app.models.orders import OrderCreate
from app.core.pricing import calculate_order_totals, CHILEAN_REGIONS
from app.core.mock_store import MOCK_ORDERS
from app.database.supabase import supabase_client
from app.services.products_service import get_product_by_id


class OrderValidationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def validate_and_build_order(order_data: OrderCreate) -> dict:
    """
    Validates order items against the product catalog and recalculates
    all monetary fields server-side. Client-provided totals are ignored.
    """
    if not order_data.items:
        raise OrderValidationError("Order must contain at least one item")

    if order_data.region not in CHILEAN_REGIONS:
        raise OrderValidationError(f"Invalid region: {order_data.region}")

    cart_total = 0
    validated_items = []

    for item in order_data.items:
        if item.quantity <= 0:
            raise OrderValidationError("Item quantity must be greater than zero")

        product = get_product_by_id(item.product_id)
        if not product:
            raise OrderValidationError(f"Product not found: {item.product_id}")

        if product.get("stock", 0) < item.quantity:
            raise OrderValidationError(
                f"Insufficient stock for {product['name']} "
                f"(available: {product['stock']}, requested: {item.quantity})"
            )

        cart_total += product["price"] * item.quantity
        validated_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "name": product["name"],
            "unit_price": product["price"],
        })

    totals = calculate_order_totals(cart_total, order_data.region)

    return {
        "customer_name": order_data.customer_name,
        "email": order_data.email,
        "phone": order_data.phone,
        "address": order_data.address,
        "city": order_data.city,
        "region": order_data.region,
        "items": validated_items,
        **totals,
    }


def get_order_by_id(order_id: str) -> Optional[dict]:
    if supabase_client is None:
        return MOCK_ORDERS.get(order_id)

    try:
        response = supabase_client.from_("orders").select("*").eq("id", order_id).execute()
        if response.data:
            return response.data[0]
    except Exception:
        pass
    return None


def verify_order_access(order: dict, email: Optional[str], require_email: bool) -> None:
    if require_email and not email:
        raise HTTPException(status_code=403, detail="Email is required to access this order")

    if email and order.get("email", "").lower() != email.lower():
        raise HTTPException(status_code=403, detail="Email does not match order records")
