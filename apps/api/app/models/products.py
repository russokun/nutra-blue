from pydantic import BaseModel
from typing import List, Optional

class ProductBase(BaseModel):
    name: str
    price: int
    stock: int
    category: str
    image_url: Optional[str] = None
    benefits: List[str] = []
    certifications: List[str] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    benefits: Optional[List[str]] = None
    certifications: Optional[List[str]] = None

class Product(ProductBase):
    id: str

    class Config:
        from_attributes = True
