from fastapi import APIRouter, HTTPException
from typing import List
from app.database.supabase import supabase_client
from app.models.products import Product
from app.core.mock_data import MOCK_PRODUCTS

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
