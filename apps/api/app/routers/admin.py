from typing import List, Optional
import os
from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from app.database.supabase import supabase_client
from app.core.security import verify_admin_user, verify_admin_or_internal_key
from app.core.mock_store import MOCK_ORDERS
from app.core.mock_data import MOCK_PRODUCTS
from app.models.products import Product, ProductCreate, ProductUpdate
from app.models.orders import OrderUpdateStatus
from app.core.config import settings
from app.services.storage_service import upload_image
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


@router.post("/orders/release-expired")
async def release_expired_orders(
    minutes: int = Query(60, ge=1, description="Antigüedad mínima, en minutos, de las órdenes pendientes a expirar"),
    _: dict = Depends(verify_admin_or_internal_key),
):
    """
    Devuelve al inventario el stock de las órdenes que quedaron en 'pending' y nunca
    se pagaron. El stock se descuenta al crear la orden, no al pagarla, así que sin
    esto un checkout abandonado se queda con las unidades reservadas para siempre.
    Lo llama n8n cada hora.
    """
    if supabase_client is None:
        import datetime
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=minutes)
        expired, restocked = 0, 0
        for order in MOCK_ORDERS.values():
            if order.get("status") != "pending":
                continue
            created_at = order.get("created_at")
            if created_at:
                try:
                    created = datetime.datetime.fromisoformat(str(created_at).replace("Z", "+00:00"))
                    if created.tzinfo is None:
                        created = created.replace(tzinfo=datetime.timezone.utc)
                    if created > cutoff:
                        continue
                except ValueError:
                    pass
            for item in order.get("items", []):
                for p in MOCK_PRODUCTS:
                    if p.get("id") == item.get("product_id"):
                        p["stock"] = int(p.get("stock", 0)) + int(item.get("quantity", 0))
                        restocked += int(item.get("quantity", 0))
                        break
            order["status"] = "expired"
            expired += 1
        return {"expired_orders": expired, "restocked_units": restocked}

    try:
        response = supabase_client.rpc("expire_pending_orders", {"p_minutes": minutes}).execute()
        return response.data or {"expired_orders": 0, "restocked_units": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to release expired orders: {str(e)}")


@router.patch("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str,
    status_data: OrderUpdateStatus,
    _: dict = Depends(verify_admin_user),
):
    allowed = {"pending", "paid", "expired", "cancelled", "shipped"}
    if status_data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed}")

    # Cancelar una orden que todavia estaba 'pending' devuelve su stock al inventario:
    # esas unidades se descontaron al crearla y nadie las va a pagar.
    restock = status_data.status == "cancelled"

    if supabase_client is None:
        if order_id not in MOCK_ORDERS:
            raise HTTPException(status_code=404, detail="Order not found")
        order = MOCK_ORDERS[order_id]
        if restock and order.get("status") == "pending":
            for item in order.get("items", []):
                for p in MOCK_PRODUCTS:
                    if p.get("id") == item.get("product_id"):
                        p["stock"] = int(p.get("stock", 0)) + int(item.get("quantity", 0))
                        break
        order["status"] = status_data.status
        return order

    if restock:
        try:
            supabase_client.rpc("cancel_order_and_restock", {"p_order_id": order_id}).execute()
            result = supabase_client.from_("orders").select("*").eq("id", order_id).limit(1).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Order not found")
            return result.data[0]
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to cancel order")

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
    # __SYSTEM_SYNC_LOG__ es una fila interna donde el sync guarda su timestamp,
    # no un producto: se oculta igual que en el catalogo publico.
    #
    # El orden replica el de la planilla (sort_order lo escribe el sync). Los productos
    # creados a mano desde el admin no lo tienen y quedan al final, alfabeticos.
    def en_orden_de_planilla(productos: list) -> list:
        return sorted(
            productos,
            key=lambda p: (p.get("sort_order") is None, p.get("sort_order") or 0, p.get("name") or ""),
        )

    if supabase_client is None:
        return en_orden_de_planilla(
            [p for p in MOCK_PRODUCTS if p.get("name") != "__SYSTEM_SYNC_LOG__"]
        )

    try:
        response = supabase_client.from_("products").select("*").neq(
            "name", "__SYSTEM_SYNC_LOG__"
        ).execute()
        return en_orden_de_planilla(response.data or [])
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch products")


@router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, _: dict = Depends(verify_admin_user)):
    if product.images:
        product.image_url = product.images[0]

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
    if product.images:
        product.image_url = product.images[0]

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


@router.post("/products/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    _: dict = Depends(verify_admin_user),
):
    """
    Subir imagen de producto a Cloudflare R2 (o Supabase / local en fallback).
    Devuelve la URL pública para asociarla al producto.
    """
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de imagen no permitido ({ext}). Formatos aceptados: PNG, JPG, JPEG, WEBP, SVG, GIF"
        )

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo de imagen no debe superar los 10 MB")

    try:
        image_url = upload_image(file_bytes=file_bytes, filename=file.filename or "image.jpg", content_type=file.content_type)
        return {"success": True, "image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar y subir la imagen: {str(e)}")


@router.post("/products/quick-add", response_model=Product)
async def quick_add_product(product: ProductCreate, _: dict = Depends(verify_admin_user)):
    """Alias de /products (mismo comportamiento). Se mantiene por compatibilidad con el frontend."""
    return await create_product(product, _)
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


# Estado del sync lanzado en segundo plano desde el panel admin. El sync completo
# descarga una ficha de Google Docs por producto y tarda minutos: el proxy que hay
# delante del admin corta la conexion antes de que termine, asi que el boton dispara
# y despues consulta /products/sync-status.
SYNC_STATE = {"running": False, "started_at": None, "finished_at": None, "summary": None, "error": None}


@router.get("/products/sync-status")
async def get_sync_status(_: dict = Depends(verify_admin_or_internal_key)):
    return SYNC_STATE


def _run_sync_in_background(csv_url: Optional[str]):
    import datetime

    SYNC_STATE.update({
        "running": True,
        "started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "finished_at": None,
        "summary": None,
        "error": None,
    })
    try:
        result = _sync_products_from_sheets_sync(csv_url)
        SYNC_STATE["summary"] = result.get("summary")
    except HTTPException as e:
        SYNC_STATE["error"] = str(e.detail)
    except Exception as e:
        SYNC_STATE["error"] = str(e)
    finally:
        SYNC_STATE["running"] = False
        SYNC_STATE["finished_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()


@router.post("/products/sync-sheets")
async def sync_products_from_sheets(
    request_data: Optional[SyncSheetsRequest] = None,
    background: bool = Query(False, description="Lanzar el sync en segundo plano y responder de inmediato"),
    _: dict = Depends(verify_admin_or_internal_key),
):
    """
    Modo por defecto (sincrono): devuelve el reporte completo. Lo usa n8n, que pega
    directo a la API sin proxy intermedio y puede esperar.

    Con ?background=true responde al instante y el avance se consulta en
    /admin/products/sync-status. Es el modo que usa el boton del panel admin.
    """
    if not background:
        # El sync es bloqueante (requests + supabase sincronos): fuera del event loop
        # para no congelar el resto de la API durante los minutos que tarda.
        from fastapi.concurrency import run_in_threadpool
        return await run_in_threadpool(
            _sync_products_from_sheets_sync, request_data.csv_url if request_data else None
        )

    if SYNC_STATE["running"]:
        raise HTTPException(status_code=409, detail="Ya hay una sincronización en curso")

    import threading
    csv_url = request_data.csv_url if request_data else None
    threading.Thread(target=_run_sync_in_background, args=(csv_url,), daemon=True).start()
    return {"status": "started"}


def _sync_products_from_sheets_sync(csv_url: Optional[str] = None):
    """
    Sincroniza el catálogo de productos desde un Google Sheet publicado en la web como CSV.
    Si no se envía csv_url, utiliza el configurado en la variable de entorno GOOGLE_SHEET_CSV_URL.
    """
    url = csv_url or settings.google_sheet_csv_url
    if not url:
        raise HTTPException(
            status_code=400,
            detail="Se requiere un CSV URL en el cuerpo o configurado en la variable GOOGLE_SHEET_CSV_URL"
        )

    try:
        # Descargar el CSV
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        # Google responde "text/csv" sin charset, y ante eso requests asume ISO-8859-1
        # (default de la RFC para text/*). El CSV es UTF-8, asi que sin esto cada
        # acento entra doble-codificado: "Energía" se guardaba como "EnergÃ­a".
        if "charset=" not in res.headers.get("content-type", "").lower():
            res.encoding = "utf-8"
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

    report = {"created": 0, "updated": 0, "deleted": [], "errors": [], "warnings": [], "stock_writeback": []}

    def reconcile_stock(sheet_stock: int, db_stock, stock_synced) -> int:
        """
        La planilla es la fuente de verdad del inventario declarado, pero las ventas y los
        ajustes hechos en el admin no se pueden perder. `stock_synced` guarda el valor con el
        que quedo el producto en el sync anterior, asi que la diferencia contra el stock
        actual es exactamente lo que se movio localmente desde entonces.

          - Producto nuevo (sin stock_synced): manda la planilla.
          - Planilla sin cambios: manda el stock local (ventas/reposiciones).
          - Planilla editada: manda el valor nuevo, descontando lo vendido desde el ultimo sync.
        """
        if db_stock is None or stock_synced is None:
            return max(0, sheet_stock)
        return max(0, sheet_stock + (int(db_stock) - int(stock_synced)))

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
        elif "inventario" in h_lower or "stock" in h_lower:
            # Tiene que ir ANTES que la de venta: "inVENTArio" contiene "venta", asi que
            # si se evalua despues, la columna de inventario se lleva el precio y todos
            # los productos terminan con precio = stock * 100.
            idx_stock = i
        elif "costo" in h_lower or "compra" in h_lower or "precio costo" in h_lower:
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

    # Si la etiqueta de inventario no estaba en la cabecera principal, buscarla en la
    # subcabecera. Se acepta en cualquiera de las dos filas porque el write-back de n8n
    # necesita la etiqueta en la misma fila que la columna clave (el nodo de Sheets lee
    # un solo headerRow), y el sync tiene que funcionar con ambas disposiciones.
    if idx_stock == -1:
        for i, h in enumerate(headers_sub):
            if "inventario" in h or "stock" in h:
                idx_stock = i
                break

    # Fallbacks de indices
    if idx_name == -1: idx_name = 1
    if idx_category == -1: idx_category = 0
    if idx_price == -1: idx_price = 5  # Col 5 = precio de venta por default del sheet
    if idx_stock == -1: idx_stock = 7
    if idx_doc == -1: idx_doc = 8

    # Procesar filas de productos a partir de la fila de productos (despues de subcabeceras)
    start_row = header_row_idx + 2 if header_row_idx + 1 < len(rows_list) else header_row_idx + 1

    # Posicion de cada producto en la planilla, para que el admin lo liste en el mismo
    # orden, y el conjunto de nombres vistos para saber que sobra en la base.
    sort_order = 0
    nombres_en_planilla = set()

    for index, raw_row in enumerate(rows_list[start_row:]):
        if len(raw_row) <= idx_name:
            continue

        name = raw_row[idx_name].strip()
        if not name or name.lower() == "suplemento / alimento":
            continue

        sort_order += 1
        nombres_en_planilla.add(name)

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
            
            # Limpiar stock (si no viene en la planilla, por defecto usamos 100 para evitar errores).
            # La planilla escribe el inventario como decimal ("30.00"), asi que se acepta y se trunca.
            raw_stock = str(row.get("stock") or "").strip().replace(",", ".")
            if not raw_stock:
                sheet_stock = 100
            else:
                try:
                    sheet_stock = int(float(raw_stock))
                except ValueError:
                    raise ValueError("El stock debe ser un número válido")
                if sheet_stock < 0:
                    raise ValueError("El stock no puede ser negativo")
 
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
                stock=sheet_stock,
                category=category,
                image_url=image_url,
                benefits=all_benefits,
                certifications=certifications,
                google_doc_url=google_doc_url,
                description=doc_details.get("description") or row.get("description", "").strip() or None,
                origin=doc_details.get("origin") or None,
                ingredients=doc_details.get("ingredients") or None,
                usage=doc_details.get("usage") or None,
                precautions=doc_details.get("precautions") or None,
                cross_selling=doc_details.get("cross_selling") or None,
                product_profile=doc_details.get("product_profile") or None
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
                **product_to_validate.model_dump(),
                "sort_order": sort_order,
            }
            # Buscar si ya existe por nombre
            found = False
            for idx, p in enumerate(MOCK_PRODUCTS):
                if p["name"].lower() == name.lower():
                    # El sync no trae imagenes reales: preservar la galeria curada a mano
                    # en vez de pisarla con el placeholder /logo.png
                    preserved_images = p.get("images")
                    preserved_image_url = p.get("image_url")
                    product_dict["stock"] = reconcile_stock(sheet_stock, p.get("stock"), p.get("stock_synced"))
                    product_dict["stock_synced"] = product_dict["stock"]
                    MOCK_PRODUCTS[idx] = product_dict
                    if preserved_images:
                        MOCK_PRODUCTS[idx]["images"] = preserved_images
                    if preserved_image_url:
                        MOCK_PRODUCTS[idx]["image_url"] = preserved_image_url
                    report["updated"] += 1
                    found = True
                    break
            if not found:
                product_dict["stock_synced"] = product_dict["stock"]
                MOCK_PRODUCTS.append(product_dict)
                report["created"] += 1
            report["stock_writeback"].append({"name": name, "stock": product_dict["stock"]})
        else:
            # Modo producción/local con Supabase
            try:
                # Obtenemos los campos a guardar
                db_data = product_to_validate.model_dump()

                # El sync no trae imagenes reales (doc_parser no las extrae, la columna
                # de la planilla se ignora). Si el producto ya existe, no pisar la
                # galeria curada a mano en el admin con el placeholder /logo.png.
                # La misma consulta trae el stock local para reconciliarlo con la planilla.
                try:
                    existing_res = supabase_client.from_("products").select(
                        "id, stock, stock_synced"
                    ).eq("name", name).limit(1).execute()
                    if existing_res.data:
                        existing = existing_res.data[0]
                        db_data.pop("image_url", None)
                        db_data.pop("images", None)
                        db_data["stock"] = reconcile_stock(
                            sheet_stock, existing.get("stock"), existing.get("stock_synced")
                        )
                except Exception:
                    pass

                db_data["stock_synced"] = db_data["stock"]
                db_data["sort_order"] = sort_order

                # Realizar upsert basándonos en la restricción UNIQUE de 'name'
                res_upsert = supabase_client.from_("products").upsert(
                    db_data,
                    on_conflict="name"
                ).execute()
                
                if res_upsert.data:
                    # En Supabase no sabemos directamente si fue INSERT o UPDATE a menos que comparemos
                    # o contemos. Asumimos éxito e incrementamos actualizados por defecto.
                    report["updated"] += 1
                    # Lo que n8n escribe de vuelta en la columna Inventario de la planilla
                    report["stock_writeback"].append({"name": name, "stock": db_data["stock"]})
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

    # Borrar lo que ya no esta en la planilla, que es la fuente de verdad del catalogo.
    #
    # Es la operacion destructiva del sync, asi que corre solo si la lectura fue
    # completamente limpia. El riesgo real no es que la planilla este vacia (eso se
    # detecta), sino que se lea a medias: por eso tambien se exige que traiga al menos
    # la mitad del catalogo actual antes de borrar nada.
    def eliminar_los_que_sobran(nombres_actuales: set, catalogo: list) -> None:
        vigentes = [p for p in catalogo if p.get("name") != "__SYSTEM_SYNC_LOG__"]
        sobran = [p for p in vigentes if p.get("name") not in nombres_actuales]
        if not sobran:
            return

        if len(nombres_actuales) * 2 < len(vigentes):
            report["warnings"].append({
                "row": 0,
                "product": "-",
                "error": (
                    f"No se borro nada: la planilla trajo {len(nombres_actuales)} productos "
                    f"y en el catalogo hay {len(vigentes)}. Parece una lectura incompleta."
                ),
            })
            return

        for p in sobran:
            report["deleted"].append(p.get("name"))

    if report["errors"] or not nombres_en_planilla:
        if nombres_en_planilla:
            report["warnings"].append({
                "row": 0,
                "product": "-",
                "error": "No se borro nada porque hubo errores de validacion en esta corrida.",
            })
    elif supabase_client is None:
        eliminar_los_que_sobran(nombres_en_planilla, MOCK_PRODUCTS)
        if report["deleted"]:
            MOCK_PRODUCTS[:] = [
                p for p in MOCK_PRODUCTS if p.get("name") not in set(report["deleted"])
            ]
    else:
        try:
            catalogo = supabase_client.from_("products").select("name").execute().data or []
            eliminar_los_que_sobran(nombres_en_planilla, catalogo)
            if report["deleted"]:
                supabase_client.from_("products").delete().in_(
                    "name", report["deleted"]
                ).execute()
        except Exception as e:
            report["deleted"] = []
            report["warnings"].append({
                "row": 0,
                "product": "-",
                "error": f"No se pudieron borrar los productos que ya no estan en la planilla: {str(e)}",
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


