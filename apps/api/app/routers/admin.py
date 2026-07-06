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
        
        # Local last sync
        last_sync = None
        for p in MOCK_PRODUCTS:
            if p.get("name") == "__SYSTEM_SYNC_LOG__":
                last_sync = p.get("description")
                break
                
        return {
            "revenue": revenue,
            "pending_orders": pending_orders,
            "visits": 1420,
            "conversion_rate": 2.8,
            "last_sync": last_sync
        }
    try:
        res_orders = supabase_client.from_("orders").select("total, status").execute()
        orders_data = res_orders.data or []
        revenue = sum(o.get("total", 0) or o.get("total_amount", 0) for o in orders_data if o.get("status") in ["paid", "shipped"])
        pending_orders = sum(1 for o in orders_data if o.get("status") == "pending")
        
        # Consultar última sincronización en Supabase
        last_sync = None
        try:
            res_sync = supabase_client.from_("products").select("description").eq("name", "__SYSTEM_SYNC_LOG__").execute()
            if res_sync.data:
                last_sync = res_sync.data[0].get("description")
        except Exception:
            pass

        return {
            "revenue": revenue,
            "pending_orders": pending_orders,
            "visits": 1420,
            "conversion_rate": 2.8,
            "last_sync": last_sync
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
        # Eliminar caracteres especiales para comparación flexible
        k_clean = k.replace("$", "").replace(".", "").replace(",", "").strip()
        if k in ("name", "nombre", "suplemento / alimento", "suplemento/alimento", "suplemento", "alimento"): return "name"
        if k in ("price", "precio", "$ venta", "venta", "$venta", "precio venta", "precio de venta") or k_clean in ("precio venta", "precio de venta", "venta"): return "price"
        if k in ("cost", "costo", "$ costo", "precio costo", "precio de costo") or k_clean in ("precio costo", "precio de costo", "costo"): return "cost"  # Ignorar columna de costo
        if k in ("stock", "inventario", "stock disponible"): return "stock"
        if k in ("category", "categoria", "categoría", "categoría / objetivo", "categoria/objetivo", "objetivo"): return "category"
        if k in ("image_url", "image", "imagen", "imagen_url", "url imagen", "url_imagen"): return "image_url"
        if k in ("benefits", "beneficios"): return "benefits"
        if k in ("certifications", "certificaciones"): return "certifications"
        if k in ("google_doc_url", "ficha_url", "ficha", "documento", "google doc url", "link doc", "link_doc", "linkdoc"): return "google_doc_url"
        return k

    report = {"created": 0, "updated": 0, "errors": [], "warnings": []}

    try:
        raw_reader = csv.reader(io.StringIO(csv_text))
        rows_list = list(raw_reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al parsear el CSV: {str(e)}")

    # Encontrar la fila de cabecera principal y secundaria
    header_row_idx = -1
    for idx, row in enumerate(rows_list[:5]):
        row_lower = [cell.strip().lower() for cell in row]
        if "suplemento / alimento" in row_lower:
            header_row_idx = idx
            break

    if header_row_idx == -1:
        # Fallback si no encuentra la estructura exacta
        header_row_idx = 0

    # Construir mapa de indices
    headers_main = [cell.strip().lower() for cell in rows_list[header_row_idx]]
    headers_sub = [cell.strip().lower() for cell in rows_list[header_row_idx + 1]] if (header_row_idx + 1) < len(rows_list) else []

    # Asignar indices fijos o detectados
    idx_name = -1
    idx_price = -1
    idx_stock = -1
    idx_category = -1
    idx_doc = -1
    idx_cost = -1  # Columna de precio de costo — ignorar al sincronizar

    for i, h in enumerate(headers_main):
        h_lower = h.lower().strip()
        if "suplemento / alimento" in h_lower or h_lower == "suplemento" or h_lower == "alimento":
            idx_name = i
        elif "categor" in h_lower or h_lower == "categoria" or h_lower == "objetivo":
            idx_category = i
        elif "costo" in h_lower or "$ costo" in h_lower or "precio costo" in h_lower:
            # Marcar columna de costo para NO usarla como precio de venta
            idx_cost = i
        elif "venta" in h_lower or h_lower == "$ venta":
            idx_price = i
        elif "link" in h_lower or "doc" in h_lower:
            idx_doc = i

    # Si no encontramos "venta" en cabecera, usar fallback posicional
    # pero excluir la columna de costo si ya fue identificada
    if idx_price == -1:
        # Buscar cualquier columna de precio que no sea la de costo
        for i, h in enumerate(headers_main):
            h_lower = h.lower().strip()
            if any(w in h_lower for w in ("precio", "price")) and i != idx_cost:
                idx_price = i
                break

    # Buscar "inventario" en la subcabecera
    for i, h in enumerate(headers_sub):
        if "inventario" in h or "stock" in h:
            idx_stock = i

    # Fallbacks de indices
    if idx_name == -1: idx_name = 1
    if idx_category == -1: idx_category = 0
    if idx_price == -1: idx_price = 5  # Col 5 = precio de venta por default del sheet
    if idx_stock == -1: idx_stock = 7
    if idx_doc == -1: idx_doc = 8

    # Procesar filas de productos a partir de la fila de productos (despues de subcabeceras)
    start_row = header_row_idx + 2 if header_row_idx + 1 < len(rows_list) else header_row_idx + 1

    for index, raw_row in enumerate(rows_list[start_row:]):
        if len(raw_row) <= idx_name:
            continue
            
        name = raw_row[idx_name].strip()
        if not name or name.lower() == "suplemento / alimento":
            continue

        category = raw_row[idx_category].strip() if idx_category < len(raw_row) else "Otros"
        price_val = raw_row[idx_price].strip() if idx_price < len(raw_row) else "0"
        stock_val = raw_row[idx_stock].strip() if idx_stock < len(raw_row) else "20"
        doc_val = raw_row[idx_doc].strip() if idx_doc < len(raw_row) else ""

        # Mapear llaves normalizadas
        row = {
            "name": name,
            "category": category,
            "price": price_val,
            "stock": stock_val,
            "google_doc_url": doc_val,
            "benefits": "",
            "certifications": "",
            "image_url": ""
        }
        if not name:
            report["errors"].append({
                "row": index + 1,
                "product": "Desconocido",
                "error": "El nombre del producto (Suplemento / Alimento) es obligatorio y no puede estar vacío"
            })
            continue

        try:
            # Limpiar precio: quitar $, puntos, espacios y convertir a int
            raw_price = str(row.get("price") or "").replace("$", "").replace(".", "").replace(",", "").strip()
            if raw_price and not raw_price.isdigit():
                raise ValueError("El precio de venta debe ser un número entero válido")
            price = int(raw_price) if raw_price else 0
            
            # Limpiar stock (si no viene en la planilla, por defecto usamos 100 para evitar errores)
            raw_stock = str(row.get("stock") or "").strip()
            if not raw_stock:
                stock = 100
            else:
                if not raw_stock.isdigit():
                    raise ValueError("El stock debe ser un número entero válido")
                stock = int(raw_stock)
 
            # Procesar arreglos separados por punto y coma (o coma si no hay punto y coma)
            def parse_list(val: Optional[str]) -> List[str]:
                if not val:
                    return []
                delimiter = ";" if ";" in val else ","
                return [item.strip() for item in val.split(delimiter) if item.strip()]

            benefits = parse_list(row.get("benefits"))
            certifications = parse_list(row.get("certifications"))
            
            category = row.get("category", "Otros").strip()
            image_url = row.get("image_url", "").strip() or "/logo.png"
            google_doc_url = row.get("google_doc_url", "").strip() or None

            # Si hay google_doc_url, intentar descargar y parsear el documento Word
            doc_details = {}
            if google_doc_url:
                try:
                    from app.services.doc_parser import parse_google_doc
                    doc_details = parse_google_doc(google_doc_url)
                except Exception as doc_err:
                    # Registramos el error como advertencia pero permitimos continuar con la validación del producto
                    if "warnings" not in report:
                        report["warnings"] = []
                    report["warnings"].append({
                        "row": index + 1,
                        "product": name,
                        "error": f"Advertencia al parsear Google Doc: {str(doc_err)}"
                    })

            # Combinar los beneficios del Excel con los extraidos del Google Doc
            all_benefits = benefits.copy()
            if doc_details.get("extracted_benefits"):
                # Agregar solo los que no existan para evitar duplicados
                for b in doc_details["extracted_benefits"]:
                    if b not in all_benefits:
                        all_benefits.append(b)

            # Validar con Pydantic
            product_to_validate = ProductCreate(
                name=name,
                price=price,
                stock=stock,
                category=category,
                image_url=image_url,
                benefits=all_benefits,
                certifications=certifications,
                google_doc_url=google_doc_url,
                description=doc_details.get("description") or row.get("description", "").strip() or None,
                origin=doc_details.get("origin") or None,
                ingredients=doc_details.get("ingredients") or None,
                usage=doc_details.get("usage") or None,
                precautions=doc_details.get("precautions") or None
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

    # Guardar timestamp de última sincronización exitosa
    if len(report["errors"]) < len(rows_list):
        import datetime
        sync_time_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if supabase_client is not None:
            try:
                supabase_client.from_("products").upsert({
                    "name": "__SYSTEM_SYNC_LOG__",
                    "price": 1,
                    "stock": 1,
                    "category": "System",
                    "description": sync_time_str
                }, on_conflict="name").execute()
            except Exception:
                pass
        else:
            for idx, p in enumerate(MOCK_PRODUCTS):
                if p.get("name") == "__SYSTEM_SYNC_LOG__":
                    MOCK_PRODUCTS[idx]["description"] = sync_time_str
                    break
            else:
                MOCK_PRODUCTS.append({
                    "id": "system-sync-log",
                    "name": "__SYSTEM_SYNC_LOG__",
                    "price": 1,
                    "stock": 1,
                    "category": "System",
                    "description": sync_time_str
                })

    return {
        "success": len(report["errors"]) < len(rows_list),
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


