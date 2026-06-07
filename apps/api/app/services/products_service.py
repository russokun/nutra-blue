from typing import Optional
from app.database.supabase import supabase_client
from app.core.mock_data import MOCK_PRODUCTS


def get_product_by_id(product_id: str) -> Optional[dict]:
    if supabase_client is None:
        return next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)

    try:
        response = supabase_client.from_("products").select("*").eq("id", product_id).execute()
        if response.data:
            return response.data[0]
    except Exception:
        pass

    return next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
