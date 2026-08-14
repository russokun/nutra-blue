from typing import Optional
from fastapi import HTTPException
from app.models.orders import OrderCreate
from app.core.pricing import calculate_order_totals, CHILEAN_REGIONS, DELIVERY_METHODS, COURIERS
from app.core.mock_data import MOCK_PRODUCTS
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

    delivery_method = order_data.delivery_method or "domicilio"
    if delivery_method not in DELIVERY_METHODS:
        raise OrderValidationError(f"Invalid delivery method: {delivery_method}")

    courier = order_data.courier or None
    if delivery_method == "retiro_courier":
        if courier not in COURIERS:
            raise OrderValidationError("Debes elegir un courier para el retiro en sucursal")
    else:
        # El courier solo tiene sentido con retiro en sucursal: si viene de otro modo,
        # se descarta para que la orden no quede con datos contradictorios.
        courier = None

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

    # Validate and apply coupon discount
    discount_percent = 0
    if order_data.coupon_code:
        code_upper = order_data.coupon_code.upper().strip()
        if supabase_client is None:
            from app.core.mock_store import MOCK_COUPONS
            coupon = next((c for c in MOCK_COUPONS if c["code"] == code_upper), None)
            if coupon:
                discount_percent = coupon["discount"]
        else:
            try:
                res = supabase_client.from_("coupons").select("*").eq("code", code_upper).execute()
                if res.data:
                    coupon = res.data[0]
                    # Check expiry date
                    import datetime
                    expiry_str = coupon.get("expiry")
                    valid = True
                    if expiry_str:
                        # Parse date string
                        expiry_date = datetime.date.fromisoformat(expiry_str.split("T")[0])
                        if expiry_date < datetime.date.today():
                            valid = False
                    if valid:
                        discount_percent = coupon["discount"]
            except Exception:
                # Fallback to local memory if Supabase has issues or table doesn't exist
                from app.core.mock_store import MOCK_COUPONS
                coupon = next((c for c in MOCK_COUPONS if c["code"] == code_upper), None)
                if coupon:
                    discount_percent = coupon["discount"]

    if discount_percent > 0:
        discount_amount = int(cart_total * (discount_percent / 100))
        cart_total = cart_total - discount_amount

    totals = calculate_order_totals(cart_total, order_data.region)

    return {
        "customer_name": order_data.customer_name,
        "email": order_data.email,
        "phone": order_data.phone,
        "address": order_data.address,
        "city": order_data.city,
        "region": order_data.region,
        "items": validated_items,
        "delivery_method": delivery_method,
        "courier": courier,
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


def enrich_order_items(order: dict) -> dict:
    """
    Completa cada linea del pedido con el nombre, precio e imagen del producto.

    En la base los items se guardan solo como [{product_id, quantity}]: el RPC
    create_order_with_stock_check descarta el nombre y el precio unitario que arma
    validate_and_build_order. Sin esto quien mire el pedido ve identificadores pelados y
    los totales por linea salen NaN, porque no hay precio con el que multiplicar.

    Lo usan tanto el panel admin como "Mis pedidos" del cliente.
    """
    items = order.get("items") or []
    if not items:
        return order

    ids = [i.get("product_id") for i in items if i.get("product_id")]
    catalogo = {}
    if ids:
        if supabase_client is None:
            catalogo = {p["id"]: p for p in MOCK_PRODUCTS if p.get("id") in ids}
        else:
            try:
                res = supabase_client.from_("products").select(
                    "id, name, price, image_url"
                ).in_("id", ids).execute()
                catalogo = {p["id"]: p for p in (res.data or [])}
            except Exception:
                # Un producto borrado del catalogo no puede romper la vista del pedido.
                catalogo = {}

    enriquecidos = []
    for item in items:
        producto = catalogo.get(item.get("product_id")) or {}
        cantidad = int(item.get("quantity", 0) or 0)
        precio = int(producto.get("price", 0) or 0)
        enriquecidos.append({
            **item,
            "name": producto.get("name") or "Producto ya no disponible",
            "price": precio,
            "unit_price": precio,
            "image_url": producto.get("image_url"),
            "line_total": precio * cantidad,
        })

    return {**order, "items": enriquecidos}


def verify_order_access(order: dict, email: Optional[str], require_email: bool) -> None:
    if require_email and not email:
        raise HTTPException(status_code=403, detail="Email is required to access this order")

    if email and order.get("email", "").lower() != email.lower():
        raise HTTPException(status_code=403, detail="Email does not match order records")
