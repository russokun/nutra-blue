from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import re
from app.database.supabase import supabase_client
from app.models.products import Product, ProductPublic
from app.core.mock_data import MOCK_PRODUCTS
from app.core.taxonomy import apply_taxonomy


def _visible(p: dict) -> bool:
    """Fuera del catálogo: la fila interna del sync y los productos ocultos."""
    return p.get("name") != "__SYSTEM_SYNC_LOG__" and not p.get("is_hidden")

class HeroProductResponse(BaseModel):
    id: str
    name: str
    price: int
    image_url: Optional[str] = None
    # Alias historico de `benefit`: lo consume el carrusel del home. Se mantiene para
    # no romper el front, pero ahora sale de la misma taxonomia que el catalogo.
    benefit_tag: str
    category: Optional[str] = None
    benefit: Optional[str] = None
    product_type: Optional[str] = None

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductPublic])
async def get_products():
    if supabase_client is None:
        return [apply_taxonomy(dict(p)) for p in MOCK_PRODUCTS if _visible(p)]

    try:
        response = supabase_client.from_("products").select("*").neq("name", "__SYSTEM_SYNC_LOG__").order("name").execute()
        products = []
        for p in response.data or []:
            if not _visible(p):
                continue
            p["image_url"] = p.get("image_url") or "/logo.png"
            products.append(apply_taxonomy(p))
        return products
    except Exception as e:
        # Fallback to mock data if supabase fails
        print(f"Supabase error: {str(e)}. Falling back to mock data.")
        return [apply_taxonomy(dict(p)) for p in MOCK_PRODUCTS if _visible(p)]

@router.get("/hero-carousel", response_model=List[HeroProductResponse])
async def get_hero_carousel():
    products_list = []
    if supabase_client is None:
        products_list = [p for p in MOCK_PRODUCTS if _visible(p)]
    else:
        try:
            response = supabase_client.from_("products").select("*").neq("name", "__SYSTEM_SYNC_LOG__").execute()
            products_list = [p for p in (response.data or []) if _visible(p)]
        except Exception as e:
            print(f"Supabase error fetching hero products: {str(e)}")
            products_list = [p for p in MOCK_PRODUCTS if _visible(p)]

    curated_keys = ["melena", "cordyceps", "ajo negro", "matcha", "calm", "cacao", "spirulina"]
    featured = []
    
    # Primera pasada: filtrar por claves seleccionadas de productos estrella
    for p in products_list:
        p_name_lower = p.get("name", "").lower()
        if any(key in p_name_lower for key in curated_keys):
            featured.append(p)
            
    # Si faltan elementos, completar hasta tener un set de 6
    if len(featured) < 4:
        for p in products_list:
            if p not in featured:
                featured.append(p)
            if len(featured) >= 6:
                break
                
    featured = featured[:6]

    output = []
    for p in featured:
        # Antes esto derivaba la etiqueta con su propia lista de palabras clave
        # ('cognit', 'estres', 'longev'), que correspondia a categorias viejas y no
        # matcheaba ninguna de las reales: casi todo caia al default literal
        # "Optimización Biológica", o sea la misma etiqueta en todas las tarjetas.
        # Ahora sale de la misma taxonomia que usa el catalogo.
        p = apply_taxonomy(dict(p))

        # Limpiar precio de forma segura
        price_val = p.get("price") or 0
        if isinstance(price_val, str):
            cleaned = re.sub(r"[^\d]", "", price_val)
            price = int(cleaned) if cleaned else 0
        else:
            price = int(price_val)

        image_url = p.get("image_url") or "/logo.png"

        output.append({
            "id": p.get("id"),
            "name": p.get("name"),
            "price": price,
            "image_url": image_url,
            "benefit_tag": p["benefit"],
            "benefit": p["benefit"],
            "category": p.get("category"),
            "product_type": p["product_type"],
        })
        
    return output

@router.get("/{product_id}", response_model=ProductPublic)
async def get_product(product_id: str):
    if supabase_client is None:
        product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return apply_taxonomy(dict(product))

    try:
        response = supabase_client.from_("products").select("*").eq("id", product_id).execute()
        if not response.data:
            # Fallback check in mock data in case DB has different IDs or is empty
            product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id or p["name"].lower() in product_id.lower()), None)
            if product:
                return apply_taxonomy(dict(product))
            raise HTTPException(status_code=404, detail="Product not found")
        p = response.data[0]
        p["image_url"] = p.get("image_url") or "/logo.png"
        return apply_taxonomy(p)
    except HTTPException:
        raise
    except Exception as e:
        product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
        if product:
            return apply_taxonomy(dict(product))
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")

@router.get("/category/{category}", response_model=List[ProductPublic])
async def get_products_by_category(category: str):
    if supabase_client is None:
        return [apply_taxonomy(dict(p)) for p in MOCK_PRODUCTS if p["category"] == category and _visible(p)]

    try:
        response = supabase_client.from_("products").select("*").eq("category", category).neq("name", "__SYSTEM_SYNC_LOG__").order("name").execute()
        products = []
        for p in response.data or []:
            if not _visible(p):
                continue
            p["image_url"] = p.get("image_url") or "/logo.png"
            products.append(apply_taxonomy(p))
        return products
    except Exception as e:
        print(f"Supabase error: {str(e)}. Falling back to mock data.")
        return [apply_taxonomy(dict(p)) for p in MOCK_PRODUCTS if p["category"] == category and _visible(p)]
