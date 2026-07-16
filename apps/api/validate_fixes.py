import urllib.request
import urllib.error
import json
import time

url = "http://127.0.0.1:3001"

def api_call(path, method="GET", data=None):
    req = urllib.request.Request(f"{url}{path}")
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode() if data else None
    req.method = method
    try:
        with urllib.request.urlopen(req, data=body, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as ex:
        return 0, str(ex)

# Esperar a que el API este lista
for i in range(5):
    s, _ = api_call("/health")
    if s == 200:
        break
    print(f"  API no disponible, reintento {i+1}/5...")
    time.sleep(2)

# 1. Verificar que el catálogo NO tenga __SYSTEM_SYNC_LOG__
print("=" * 60)
print("TEST 1: Catálogo sin __SYSTEM_SYNC_LOG__")
status, products = api_call("/products")
names = [p["name"] for p in products] if isinstance(products, list) else []
has_sync_log = "__SYSTEM_SYNC_LOG__" in names
print(f"  Status: {status}")
print(f"  Contiene __SYSTEM_SYNC_LOG__: {has_sync_log}")
print(f"  Total productos: {len(names)}")
print(f"  PASS: {status == 200 and not has_sync_log}")

# 2. Verificar imágenes - contar los que tienen fallback /logo.png
print()
print("TEST 2: Imágenes de productos")
none_images = [p["name"] for p in products if isinstance(products, list) and p.get("image_url") is None]
logo_fallbacks = [p["name"] for p in products if isinstance(products, list) and p.get("image_url") == "/logo.png"]
real_images = [p["name"] for p in products if isinstance(products, list) and p.get("image_url") and p.get("image_url") != "/logo.png"]
print(f"  Con imágenes reales: {len(real_images)}")
print(f"  Con fallback /logo.png: {len(logo_fallbacks)}")
print(f"  Con NULL (ninguno debería tener): {len(none_images)}")
print(f"  PASS (no hay NULL): {len(none_images) == 0}")

# 3. Simular checkout completo
print()
print("TEST 3: Flujo de checkout (RPC create_order_with_stock_check)")
# Obtener un producto real de la DB para el test
test_product = None
if isinstance(products, list):
    for p in products:
        if p.get("stock", 0) > 0 and p.get("image_url") != "/logo.png":
            test_product = p
            break

if not test_product:
    for p in products if isinstance(products, list) else []:
        if p.get("stock", 0) > 0:
            test_product = p
            break

if not test_product:
    print("  ERROR: No hay productos disponibles para testear")
else:
    print(f"  Producto de prueba: {test_product['name']} (ID: {test_product['id']})")
    checkout_data = {
        "customer_name": "Juan Perez",
        "email": "juan.test@example.com",
        "phone": "+56912345678",
        "address": "Providencia 1234",
        "city": "Santiago",
        "region": "Metropolitana",
        "items": [{"product_id": test_product["id"], "quantity": 1}],
        "subtotal": test_product["price"],
        "tax": 0,
        "shipping_cost": 0,
        "total": test_product["price"],
        "payment_method": "mock"
    }
    status_order, resp_order = api_call("/orders", method="POST", data=checkout_data)
    print(f"  Status respuesta: {status_order}")
    print(f"  Respuesta: {json.dumps(resp_order, indent=2, ensure_ascii=False)}")
    print(f"  PASS (status 2xx): {200 <= status_order < 300}")

print()
print("=" * 60)
print("RESUMEN FINAL:")
print(f"  [1] Catalogo filtrado: {'PASS' if not has_sync_log else 'FAIL'}")
print(f"  [2] Sin imagenes NULL: {'PASS' if not none_images else 'FAIL'}")
if test_product:
    print(f"  [3] Checkout funcional: {'PASS' if 200 <= status_order < 300 else 'FAIL - Error: ' + str(status_order)}")
