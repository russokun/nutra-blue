"""Script para verificar credenciales de producción de Transbank Webpay Plus
y asegurar la existencia del producto de prueba de $50 CLP.

Uso:
    python apps/api/scripts/verify_transbank_prod.py
"""

import sys
import os
import uuid
from dotenv import load_dotenv

# Cargar .env desde apps/api/.env o raíz
api_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(api_env)
load_dotenv()

from transbank.webpay.webpay_plus.transaction import Transaction

def test_transbank_production():
    print("=" * 70)
    print("VERIFICACIÓN DE CREDENCIALES DE PRODUCCIÓN - TRANSBANK WEBPAY PLUS")
    print("=" * 70)

    commerce_code = (
        os.getenv("WEBPAY_COMMERCE_CODE_PROD")
        or os.getenv("TBK_API_KEY_ID_PROD")
        or os.getenv("WEBPAY_COMMERCE_CODE")
        or os.getenv("TBK_API_KEY_ID")
        or "597053097527"
    )

    api_key = (
        os.getenv("WEBPAY_API_KEY_PROD")
        or os.getenv("TBK_API_KEY_SECRET_PROD")
        or os.getenv("WEBPAY_API_KEY")
        or os.getenv("TBK_API_KEY_SECRET")
        or ""
    )

    if not api_key:
        print("[ERROR] Falta configurar la API Key de producción en .env (WEBPAY_API_KEY_PROD o TBK_API_KEY_SECRET_PROD)", file=sys.stderr)
        return False

    print(f"• Código de Comercio (Tbk-Api-Key-Id):     {commerce_code}")
    print(f"• API Key Secreta    (Tbk-Api-Key-Secret): {api_key[:8]}...{api_key[-6:]}")
    print(f"• Servidor Transbank:                     Producción (webpay3g.transbank.cl)")

    try:
        tx = Transaction.build_for_production(
            commerce_code=commerce_code,
            api_key=api_key,
        )

        order_id = "test-" + uuid.uuid4().hex[:12]
        buy_order = order_id.replace("-", "")[:26]
        session_id = order_id[:61]
        amount = 50.0
        return_url = "https://api.nutrablue.cl/payment/transbank-return?order_id=" + order_id

        print(f"\nGenerando transacción de prueba de ${int(amount)} CLP...")
        response = tx.create(
            buy_order=buy_order,
            session_id=session_id,
            amount=amount,
            return_url=return_url,
        )

        token = response.get("token")
        url = response.get("url")

        print("\n[OK] ¡CONEXIÓN CON PRODUCCIÓN EXITOSA!")
        print(f" - Token Webpay:  {token}")
        print(f" - URL Formulario: {url}")
        print(" -> Transbank reconoció la llave de producción y autorizó iniciar el pago de $50.")
        return True

    except Exception as e:
        print(f"\n[ERROR] Falló la verificación con Transbank Producción: {e}", file=sys.stderr)
        return False

def seed_test_product_supabase():
    supabase_url = os.getenv("SUPABASE_URL_PROD") or os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY_PROD") or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key or "your-" in supabase_url:
        print("\n[INFO] Supabase no configurado en este entorno local. Se usará catálogo en memoria / mock data.")
        return

    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        res = client.from_("products").upsert({
            "name": "Producto de Prueba Transbank",
            "price": 50,
            "stock": 999,
            "category": "Alimentación Diaria",
            "image_url": "/logo.png",
            "benefits": ["Producto oculto para validación de cobro real Transbank ($50 CLP)"],
            "certifications": [],
            "is_hidden": True,
        }, on_conflict="name").execute()
        print(f"\n[OK] Producto de prueba de $50 insertado/actualizado en Supabase con éxito: {res.data}")
    except Exception as e:
        print(f"\n[AVISO] No se pudo insertar en Supabase automáticamente: {e}")
        print("Se puede ejecutar la sentencia SQL de schema_updates.sql en el panel de Supabase.")

if __name__ == "__main__":
    success = test_transbank_production()
    seed_test_product_supabase()
    if not success:
        sys.exit(1)
