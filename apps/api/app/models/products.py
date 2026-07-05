from pydantic import BaseModel, field_validator
from typing import List, Optional, Union
import re

class ProductBase(BaseModel):
    name: str
    price: Union[int, str]
    stock: Union[int, str]
    category: str
    image_url: Optional[str] = None
    benefits: List[str] = []
    certifications: List[str] = []
    google_doc_url: Optional[str] = None

    @field_validator("price", "stock", mode="before")
    @classmethod
    def clean_numeric_fields(cls, v):
        if v is None:
            return 0
        if isinstance(v, (int, float)):
            return int(v)
        if isinstance(v, str):
            # Limpiar caracteres no numericos (excepto numeros)
            cleaned = re.sub(r"[^\d]", "", v)
            if not cleaned:
                return 0
            return int(cleaned)
        return 0

class ProductCreate(ProductBase):
    @field_validator("price", "stock")
    @classmethod
    def ensure_int(cls, v):
        return int(v)

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    benefits: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    google_doc_url: Optional[str] = None

class Product(ProductBase):
    id: str

    class Config:
        from_attributes = True
