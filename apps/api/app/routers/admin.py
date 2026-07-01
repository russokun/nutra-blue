from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.database.supabase import supabase_client
from app.core.security import verify_admin_user, verify_admin_or_internal_key
from app.core.mock_store import MOCK_ORDERS
from app.core.mock_data import MOCK_PRODUCTS
from app.models.products import Product, ProductCreate, ProductUpdate
from app.models.orders import OrderUpdateStatus
from app.core.config import settings
import uuid
import requests
import csv
import io

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/orders")
async def list_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(verify_admin_user),
):
    if supabase_client is None:
        orders = list(MOCK_ORDERS.values())
        if status:
            orders = [o for o in orders if o.get("status") == status]
        return sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:limit]

    try:
        query = supabase_client.from_("orders").select("*").order("created_at", desc=True).limit(limit)
        if status:
            query = query.eq("status", status)
        response = query.execute()
        return response.data or []
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch orders")


@router.patch("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str,
    status_data: OrderUpdateStatus,
    _: dict = Depends(verify_admin_user),
):
    allowed = {"pending", "paid", "expired", "cancelled", "shipped"}
    if status_data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed}")

    if supabase_client is None:
        if order_id not in MOCK_ORDERS:
            raise HTTPException(status_code=404, detail="Order not found")
        MOCK_ORDERS[order_id]["status"] = status_data.status
        return MOCK_ORDERS[order_id]

    try:
        response = supabase_client.from_("orders").update(
            {"status": status_data.status}
        ).eq("id", order_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update order")


@router.get("/products", response_model=List[Product])
async def list_products(_: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        return MOCK_PRODUCTS

    try:
        response = supabase_client.from_("products").select("*").order("name").execute()
        return response.data or []
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch products")


@router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, _: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        new_product = {
            "id": str(uuid.uuid4()),
            **product.model_dump(),
        }
        MOCK_PRODUCTS.append(new_product)
        return new_product

    try:
        response = supabase_client.from_("products").insert(product.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create product")
        return response.data[0]
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Product name already exists")
        raise HTTPException(status_code=500, detail="Failed to create product")


@router.patch("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    _: dict = Depends(verify_admin_user),
):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}

    if supabase_client is None:
        for p in MOCK_PRODUCTS:
            if p["id"] == product_id:
                p.update(update_data)
                return p
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        response = supabase_client.from_("products").update(update_data).eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return response.data[0]
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update product")


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        for i, p in enumerate(MOCK_PRODUCTS):
            if p["id"] == product_id:
                MOCK_PRODUCTS.pop(i)
                return {"success": True}
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        response = supabase_client.from_("products").delete().eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete product")


@router.get("/dashboard/metrics")
async def get_dashboard_metrics(_: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        orders = list(MOCK_ORDERS.values())
        revenue = sum(o.get("total", 0) for o in orders if o.get("status") in ["paid", "shipped"])
        pending_orders = sum(1 for o in orders if o.get("status") == "pending")
        return {
            "revenue": revenue,
            "pending_orders": pending_orders,
            "visits": 1420,
            "conversion_rate": 2.8
        }
    try:
        res_orders = supabase_client.from_("orders").select("total, status").execute()
        orders_data = res_orders.data or []
        revenue = sum(o.get("total", 0) or o.get("total_amount", 0) for o in orders_data if o.get("status") in ["paid", "shipped"])
        pending_orders = sum(1 for o in orders_data if o.get("status") == "pending")
        return {
            "revenue": revenue,
            "pending_orders": pending_orders,
            "visits": 1420,
            "conversion_rate": 2.8
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard metrics: {str(e)}")


@router.get("/orders/recent")
async def get_recent_orders(limit: int = 10, _: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        orders = list(MOCK_ORDERS.values())
        return sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:limit]
    try:
        response = supabase_client.from_("orders").select("*").order("created_at", desc=True).limit(limit).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent orders: {str(e)}")


@router.get("/inventory/alerts")
async def get_inventory_alerts(_: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        low_stock = [p for p in MOCK_PRODUCTS if p.get("stock", 0) <= 40]
        # Return mock expiration alerts
        expiration_alerts = [
            {"id": "matcha-ritual", "name": "Matcha Ritual", "stock": 35, "alert_type": "vencimiento", "details": "Vence en 15 días"}
        ]
        return {
            "low_stock": low_stock[:5],
            "expiration": expiration_alerts
        }
    try:
        res_low = supabase_client.from_("products").select("*").lte("stock", 10).execute()
        # Handle expiration alerts gracefully (return empty list if column doesn't exist yet)
        try:
            res_exp = supabase_client.from_("products").select("*").execute()
            expiration = []
            for p in (res_exp.data or []):
                exp_date = p.get("expiration_date")
                if exp_date:
                    expiration.append(p)
        except Exception:
            expiration = []
        return {
            "low_stock": res_low.data or [],
            "expiration": expiration
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inventory alerts: {str(e)}")


@router.post("/products/quick-add", response_model=Product)
async def quick_add_product(product: ProductCreate, _: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        new_product = {
            "id": str(uuid.uuid4()),
            **product.model_dump(),
        }
        MOCK_PRODUCTS.append(new_product)
        return new_product

    try:
        response = supabase_client.from_("products").insert(product.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create product")
        return response.data[0]
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Product name already exists")
        raise HTTPException(status_code=500, detail="Failed to create product")
@router.post("/products/upsert", response_model=Product)
async def upsert_product(product: ProductCreate, _: dict = Depends(verify_admin_or_internal_key)):
    if supabase_client is None:
        for idx, p in enumerate(MOCK_PRODUCTS):
            if p["name"].lower() == product.name.lower():
                MOCK_PRODUCTS[idx].update(product.model_dump())
                return MOCK_PRODUCTS[idx]
        new_product = {
            "id": str(uuid.uuid4()),
            **product.model_dump(),
        }
        MOCK_PRODUCTS.append(new_product)
        return new_product

    try:
        response = supabase_client.from_("products").upsert(
            product.model_dump(),
            on_conflict="name"
        ).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to upsert product")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upsert product: {str(e)}")



from pydantic import BaseModel

class SyncSheetsRequest(BaseModel):
    csv_url: Optional[str] = None


@router.post("/products/sync-sheets")
async def sync_products_from_sheets(
    request_data: Optional[SyncSheetsRequest] = None,
    _: dict = Depends(verify_admin_or_internal_key),
):
    """
    Sincroniza el catálogo de productos desde un Google Sheet publicado en la web como CSV.
    Si no se envía csv_url, utiliza el configurado en la variable de entorno GOOGLE_SHEET_CSV_URL.
    """
    url = (request_data.csv_url if request_data else None) or settings.google_sheet_csv_url
    if not url:
        raise HTTPException(
            status_code=400,
            detail="Se requiere un CSV URL en el cuerpo o configurado en la variable GOOGLE_SHEET_CSV_URL"
        )

    try:
        # Descargar el CSV
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        csv_text = res.text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al descargar el CSV: {str(e)}")

    # Parsear y mapear columnas de forma flexible
    def normalize_key(key: str) -> str:
        k = key.lower().strip()
        if k in ("name", "nombre"): return "name"
        if k in ("price", "precio"): return "price"
        if k in ("stock", "inventario"): return "stock"
        if k in ("category", "categoria", "categoría"): return "category"
        if k in ("image_url", "image", "imagen", "imagen_url", "url imagen", "url_imagen"): return "image_url"
        if k in ("benefits", "beneficios"): return "benefits"
        if k in ("certifications", "certificaciones"): return "certifications"
        if k in ("google_doc_url", "ficha_url", "ficha", "documento", "google doc url"): return "google_doc_url"
        return k

    report = {"created": 0, "updated": 0, "errors": []}

    try:
        reader = csv.DictReader(io.StringIO(csv_text))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al estructurar el CSV: {str(e)}")

    for index, raw_row in enumerate(rows):
        # Mapear llaves normalizadas
        row = {normalize_key(k): v for k, v in raw_row.items() if k}
        
        # Validar campos obligatorios básicos
        name = row.get("name")
        if not name:
            report["errors"].append({
                "row": index + 1,
                "product": "Desconocido",
                "error": "El nombre del producto es obligatorio y no puede estar vacío"
            })
            continue

        try:
            # Limpiar precio: quitar $, puntos, espacios y convertir a int
            raw_price = str(row.get("price") or "").replace("$", "").replace(".", "").replace(",", "").strip()
            if raw_price and not raw_price.isdigit():
                raise ValueError("El precio debe ser un número entero válido")
            price = int(raw_price) if raw_price else 0
            
            # Limpiar stock
            raw_stock = str(row.get("stock") or "").strip()
            if raw_stock and not raw_stock.isdigit():
                raise ValueError("El stock debe ser un número entero válido")
            stock = int(raw_stock) if raw_stock else 0

            # Procesar arreglos separados por punto y coma (o coma si no hay punto y coma)
            def parse_list(val: Optional[str]) -> List[str]:
                if not val:
                    return []
                delimiter = ";" if ";" in val else ","
                return [item.strip() for item in val.split(delimiter) if item.strip()]

            benefits = parse_list(row.get("benefits"))
            certifications = parse_list(row.get("certifications"))
            
            category = row.get("category", "Otros").strip()
            image_url = row.get("image_url", "").strip() or None
            google_doc_url = row.get("google_doc_url", "").strip() or None

            # Validar con Pydantic
            product_to_validate = ProductCreate(
                name=name,
                price=price,
                stock=stock,
                category=category,
                image_url=image_url,
                benefits=benefits,
                certifications=certifications,
                google_doc_url=google_doc_url
            )

        except Exception as e:
            report["errors"].append({
                "row": index + 1,
                "product": name,
                "error": f"Error de validación de datos: {str(e)}"
            })
            continue

        # Guardar en base de datos o mock
        if supabase_client is None:
            # Modo mock en memoria
            product_dict = {
                "id": name.lower().replace(" ", "-"),
                **product_to_validate.model_dump()
            }
            # Buscar si ya existe por nombre
            found = False
            for idx, p in enumerate(MOCK_PRODUCTS):
                if p["name"].lower() == name.lower():
                    MOCK_PRODUCTS[idx] = product_dict
                    report["updated"] += 1
                    found = True
                    break
            if not found:
                MOCK_PRODUCTS.append(product_dict)
                report["created"] += 1
        else:
            # Modo producción/local con Supabase
            try:
                # Obtenemos los campos a guardar
                db_data = product_to_validate.model_dump()
                # Realizar upsert basándonos en la restricción UNIQUE de 'name'
                res_upsert = supabase_client.from_("products").upsert(
                    db_data,
                    on_conflict="name"
                ).execute()
                
                if res_upsert.data:
                    # En Supabase no sabemos directamente si fue INSERT o UPDATE a menos que comparemos
                    # o contemos. Asumimos éxito e incrementamos actualizados por defecto.
                    report["updated"] += 1
                else:
                    report["errors"].append({
                        "row": index + 1,
                        "product": name,
                        "error": "No se retornaron datos tras el guardado"
                    })
            except Exception as e:
                report["errors"].append({
                    "row": index + 1,
                    "product": name,
                    "error": f"Error al guardar en Supabase: {str(e)}"
                })

    return {
        "success": len(report["errors"]) < len(rows),
        "summary": report,
        "message": f"Sincronización finalizada. Creados/Actualizados con éxito: {report['created'] + report['updated']}. Errores: {len(report['errors'])}"
    }


class SuggestionUpdateStatus(BaseModel):
    status: str


class CouponCreate(BaseModel):
    code: str
    discount: int
    expiry: str


@router.get("/leads")
async def list_leads(_: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        from app.core.mock_store import MOCK_LEADS
        return MOCK_LEADS
    try:
        res = supabase_client.from_("leads").select("*").order("created_at", desc=True).execute()
        return res.data or []
    except Exception:
        from app.core.mock_store import MOCK_LEADS
        return MOCK_LEADS


@router.get("/suggestions")
async def list_suggestions(_: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        from app.core.mock_store import MOCK_SUGGESTIONS
        return MOCK_SUGGESTIONS
    try:
        res = supabase_client.from_("product_suggestions").select("*").order("created_at", desc=True).execute()
        return res.data or []
    except Exception:
        from app.core.mock_store import MOCK_SUGGESTIONS
        return MOCK_SUGGESTIONS


@router.patch("/suggestions/{suggestion_id}/status")
async def update_suggestion_status(
    suggestion_id: str,
    status_data: SuggestionUpdateStatus,
    _: dict = Depends(verify_admin_user),
):
    if supabase_client is None:
        from app.core.mock_store import MOCK_SUGGESTIONS
        for s in MOCK_SUGGESTIONS:
            if str(s.get("id")) == str(suggestion_id):
                s["status"] = status_data.status
                return s
        raise HTTPException(status_code=404, detail="Suggestion not found")
    try:
        res = supabase_client.from_("product_suggestions").update(
            {"status": status_data.status}
        ).eq("id", suggestion_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/coupons")
async def list_coupons(_: dict = Depends(verify_admin_user)):
    if supabase_client is None:
        from app.core.mock_store import MOCK_COUPONS
        return MOCK_COUPONS
    try:
        res = supabase_client.from_("coupons").select("*").order("created_at", desc=True).execute()
        return res.data or []
    except Exception:
        from app.core.mock_store import MOCK_COUPONS
        return MOCK_COUPONS


@router.post("/coupons")
async def create_coupon(
    coupon: CouponCreate,
    _: dict = Depends(verify_admin_user),
):
    if supabase_client is None:
        from app.core.mock_store import MOCK_COUPONS
        import datetime
        new_coupon = {
            "id": str(uuid.uuid4()),
            "code": coupon.code.upper(),
            "discount": coupon.discount,
            "expiry": coupon.expiry,
            "created_at": datetime.datetime.now().isoformat()
        }
        MOCK_COUPONS.append(new_coupon)
        return new_coupon
    try:
        check = supabase_client.from_("coupons").select("id").eq("code", coupon.code.upper()).execute()
        if check.data:
            raise HTTPException(status_code=400, detail="Coupon code already exists")
        
        res = supabase_client.from_("coupons").insert({
            "code": coupon.code.upper(),
            "discount": coupon.discount,
            "expiry": coupon.expiry
        }).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create coupon")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


