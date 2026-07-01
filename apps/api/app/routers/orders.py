import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database.supabase import supabase_client
from app.models.orders import OrderCreate, OrderUpdateStatus
from app.core.config import settings
from app.core.mock_store import MOCK_ORDERS
from app.core.security import verify_internal_api_key
from app.services.orders_service import (
    OrderValidationError,
    validate_and_build_order,
    get_order_by_id,
    verify_order_access,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("")
async def list_orders(
    email: str = Query(..., description="Customer email to filter orders"),
):
    if supabase_client is None:
        return [
            order for order in MOCK_ORDERS.values()
            if order.get("email", "").lower() == email.lower()
        ]
    try:
        response = supabase_client.from_("orders").select("*").eq("email", email.lower()).order("created_at", desc=True).execute()
        return response.data
    except Exception:
        return [
            order for order in MOCK_ORDERS.values()
            if order.get("email", "").lower() == email.lower()
        ]


@router.post("")
async def create_order(order_data: OrderCreate):
    try:
        validated_order = validate_and_build_order(order_data)
    except OrderValidationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    if supabase_client is None:
        order_id = str(uuid.uuid4())
        mock_order = {
            "id": order_id,
            **validated_order,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
        }
        MOCK_ORDERS[order_id] = mock_order

        from app.services.email_service import send_order_confirmation
        import asyncio
        asyncio.create_task(send_order_confirmation(mock_order))

        for item in validated_order["items"]:
            from app.services.products_service import get_product_by_id
            product = get_product_by_id(item["product_id"])
            if product:
                product["stock"] -= item["quantity"]

        return mock_order

    rpc_params = {
        "p_customer_name": validated_order["customer_name"],
        "p_email": validated_order["email"],
        "p_phone": validated_order["phone"],
        "p_address": validated_order["address"],
        "p_city": validated_order["city"],
        "p_region": validated_order["region"],
        "p_items": [
            {"product_id": i["product_id"], "quantity": i["quantity"]}
            for i in validated_order["items"]
        ],
        "p_subtotal": validated_order["subtotal"],
        "p_tax": validated_order["tax"],
        "p_shipping_cost": validated_order["shipping_cost"],
        "p_total": validated_order["total"],
    }

    try:
        response = supabase_client.rpc("create_order_with_stock_check", rpc_params).execute()

        if response.data:
            order_id = response.data.get("id")
            order_record = supabase_client.from_("orders").select("*").eq("id", order_id).execute()
            if order_record.data:
                created = order_record.data[0]
                from app.services.email_service import send_order_confirmation
                import asyncio
                asyncio.create_task(send_order_confirmation(created))
                return created
            return response.data

        raise Exception("Database failed to return order ID")
    except Exception as e:
        error_msg = str(e)
        if "Insufficient stock" in error_msg:
            raise HTTPException(status_code=400, detail=error_msg)
        raise HTTPException(status_code=500, detail="Failed to create order")


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    email: Optional[str] = Query(None, description="Customer email for order verification"),
):
    require_email = settings.is_production
    order = get_order_by_id(order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    verify_order_access(order, email, require_email)
    return order


@router.patch("/{order_id}")
async def update_order_status(
    order_id: str,
    status_data: OrderUpdateStatus,
    _: None = Depends(verify_internal_api_key),
):
    allowed_statuses = {"pending", "paid", "expired", "cancelled", "shipped"}
    if status_data.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed_statuses}")

    if supabase_client is None:
        if order_id in MOCK_ORDERS:
            MOCK_ORDERS[order_id]["status"] = status_data.status
            return MOCK_ORDERS[order_id]
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        response = supabase_client.from_("orders").update(
            {"status": status_data.status}
        ).eq("id", order_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update order status")
