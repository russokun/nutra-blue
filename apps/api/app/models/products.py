from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Union
import re

class ProductBase(BaseModel):
    name: str
    price: Union[int, str]
    stock: Union[int, str]
    category: str
    image_url: Optional[str] = None
    images: List[str] = []
    benefits: List[str] = []
    certifications: List[str] = []
    google_doc_url: Optional[str] = None
    description: Optional[str] = None
    origin: Optional[str] = None
    ingredients: Optional[str] = None
    usage: Optional[str] = None
    precautions: Optional[str] = None
    cross_selling: Optional[str] = None
    product_profile: Optional[str] = None

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
    images: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    google_doc_url: Optional[str] = None
    description: Optional[str] = None
    origin: Optional[str] = None
    ingredients: Optional[str] = None
    usage: Optional[str] = None
    precautions: Optional[str] = None
    cross_selling: Optional[str] = None
    product_profile: Optional[str] = None

class Product(ProductBase):
    id: str
    # Posicion del producto en la planilla. La escribe el sync; los productos creados
    # a mano desde el admin quedan en None y se listan al final.
    sort_order: Optional[int] = None

    model_config = {"from_attributes": True}


class ProductPublic(Product):
    """
    Producto tal como se expone en el catalogo abierto.

    La ficha de Google Docs trae la estructura de costos, los margenes y los datos
    del proveedor, y los documentos estan compartidos por enlace: publicar su URL
    filtra todo eso a cualquiera que mire la respuesta. El storefront no la usa,
    solo el panel admin.
    """
    google_doc_url: Optional[str] = Field(default=None, exclude=True)
