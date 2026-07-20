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

class OrderUpdateStatus(BaseModel):
    status: str

class Order(OrderCreate):
    id: str
    status: str
    created_at: str

    model_config = {"from_attributes": True}

