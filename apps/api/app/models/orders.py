from pydantic import BaseModel, EmailStr
from typing import List, Optional

class OrderItem(BaseModel):
    product_id: str
    quantity: int

class OrderCreate(BaseModel):
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    region: str
    items: List[OrderItem]
    subtotal: int
    tax: int
    shipping_cost: int
    total: int
    coupon_code: Optional[str] = None
    delivery_method: str = "domicilio"
    courier: Optional[str] = None

class OrderUpdateStatus(BaseModel):
    status: str


class OrderShippingUpdate(BaseModel):
    """Datos con los que el admin despacha un pedido y avisa al cliente."""
    tracking_code: str
    shipping_company: str
    shipping_payment: str = "por_pagar"
    notify_customer: bool = True

class Order(OrderCreate):
    id: str
    status: str
    created_at: str

    model_config = {"from_attributes": True}

