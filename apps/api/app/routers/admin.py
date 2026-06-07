from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database.supabase import supabase_client
from app.core.security import verify_admin_user
from app.core.mock_store import MOCK_ORDERS
from app.core.mock_data import MOCK_PRODUCTS
from app.models.products import Product, ProductCreate, ProductUpdate
from app.models.orders import OrderUpdateStatus
import uuid

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/orders")
async def list_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(verify_admin_user),
):
    if supabase_client is None:
        orders = list(MOCK_ORDERS.values())
        if status:
            orders = [o for o in orders if o.get("status") == status]
        return sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:limit]

    try:
        query = supabase_client.from_("orders").select("*").order("created_at", desc=True).limit(limit)
        if status:
            query = query.eq("status", status)
        response = query.execute()
        return response.data or []
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch orders")


@router.patch("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str,
    status_data: OrderUpdateStatus,
    _: dict = Depends(verify_admin_user),
):
    allowed = {"pending", "paid", "expired", "cancelled", "shipped"}
    if status_data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed}")

    if supabase_client is None:
        if order_id not in MOCK_ORDERS:
            raise HTTPException(status_code=404, detail="Order not found")
        MOCK_ORDERS[order_id]["status"] = status_data.status
        return MOCK_ORDERS[order_id]

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
        raise HTTPException(status_code=500, detail="Failed to update order")


@router.get("/products", response_model=List[Product])
async def list_products(_: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        return MOCK_PRODUCTS

    try:
        response = supabase_client.from_("products").select("*").order("name").execute()
        return response.data or []
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch products")


@router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, _: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        new_product = {
            "id": str(uuid.uuid4()),
            **product.model_dump(),
        }
        MOCK_PRODUCTS.append(new_product)
        return new_product

    try:
        response = supabase_client.from_("products").insert(product.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create product")
        return response.data[0]
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Product name already exists")
        raise HTTPException(status_code=500, detail="Failed to create product")


@router.patch("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    _: dict = Depends(verify_admin_user),
):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}

    if supabase_client is None:
        for p in MOCK_PRODUCTS:
            if p["id"] == product_id:
                p.update(update_data)
                return p
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        response = supabase_client.from_("products").update(update_data).eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return response.data[0]
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update product")


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        for i, p in enumerate(MOCK_PRODUCTS):
            if p["id"] == product_id:
                MOCK_PRODUCTS.pop(i)
                return {"success": True}
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        response = supabase_client.from_("products").delete().eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete product")
