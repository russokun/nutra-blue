from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import re
from app.database.supabase import supabase_client
from app.models.products import Product
from app.core.mock_data import MOCK_PRODUCTS

class HeroProductResponse(BaseModel):
    id: str
    name: str
    price: int
    image_url: Optional[str] = None
    benefit_tag: str

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[Product])
async def get_products():
    if supabase_client is None:
        return MOCK_PRODUCTS
        
    try:
        response = supabase_client.from_("products").select("*").order("name").execute()
        return response.data
    except Exception as e:
        # Fallback to mock data if supabase fails
        print(f"Supabase error: {str(e)}. Falling back to mock data.")
        return MOCK_PRODUCTS

@router.get("/hero-carousel", response_model=List[HeroProductResponse])
async def get_hero_carousel():
    products_list = []
    if supabase_client is None:
        products_list = MOCK_PRODUCTS
    else:
        try:
            response = supabase_client.from_("products").select("*").execute()
            products_list = response.data or []
        except Exception as e:
            print(f"Supabase error fetching hero products: {str(e)}")
            products_list = MOCK_PRODUCTS

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
        benefit_tag = "Optimización Biológica"
        benefits = p.get("benefits") or []
        if isinstance(benefits, list) and len(benefits) > 0 and benefits[0]:
            benefit_tag = benefits[0]
        else:
            category = p.get("category", "").lower()
            if "energ" in category:
                benefit_tag = "Energía Celular"
            elif "cognit" in category:
                benefit_tag = "Claridad Mental"
            elif "estrés" in category or "estres" in category:
                benefit_tag = "Relajación Nerviosa"
            elif "longev" in category:
                benefit_tag = "Longevidad Activa"

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
            "benefit_tag": benefit_tag
        })
        
    return output

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    if supabase_client is None:
        product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    try:
        response = supabase_client.from_("products").select("*").eq("id", product_id).execute()
        if not response.data:
            # Fallback check in mock data in case DB has different IDs or is empty
            product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id or p["name"].lower() in product_id.lower()), None)
            if product:
                return product
            raise HTTPException(status_code=404, detail="Product not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
        if product:
            return product
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")

@router.get("/category/{category}", response_model=List[Product])
async def get_products_by_category(category: str):
    if supabase_client is None:
        return [p for p in MOCK_PRODUCTS if p["category"] == category]

    try:
        response = supabase_client.from_("products").select("*").eq("category", category).order("name").execute()
        return response.data
    except Exception as e:
        print(f"Supabase error: {str(e)}. Falling back to mock data.")
        return [p for p in MOCK_PRODUCTS if p["category"] == category]
