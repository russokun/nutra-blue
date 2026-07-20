from fastapi.testclient import TestClient
from main import app
from app.core.security import verify_admin_or_internal_key
from unittest.mock import patch, MagicMock

client = TestClient(app)

async def override_verify_admin_or_internal_key():
    return {"id": "test-admin-id", "email": "admin@nutrablue.cl"}

def test_sync_products_sheets_success():
    # Override authentication dependency for this test
    app.dependency_overrides[verify_admin_or_internal_key] = override_verify_admin_or_internal_key
    
    mock_csv = "Categoría / Objetivo,Suplemento / Alimento,Precio Costo,Precio Venta,Link Doc\n" \
               ",,Inventario,Inventario,,\n" \
               "Proteínas,Super Beetle Protein,15000,19990,https://docs.google.com/document/123\n"

    with patch("requests.get") as mock_get, patch("app.routers.admin.supabase_client", None):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_csv
        mock_get.return_value = mock_response

        response = client.post("/admin/products/sync-sheets", json={"csv_url": "http://fake-sheet.csv"})
        
        # Verify status code
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["summary"]["created"] + data["summary"]["updated"] == 1
        assert len(data["summary"]["errors"]) == 0

    # Clean overrides
    app.dependency_overrides.clear()

def test_sync_products_sheets_validation_error():
    app.dependency_overrides[verify_admin_or_internal_key] = override_verify_admin_or_internal_key
    
    # Bad stock (non-numeric string)
    mock_csv = "Categoría / Objetivo,Suplemento / Alimento,Precio Costo,Precio Venta,Link Doc\n" \
               ",,Inventario,Inventario,,\n" \
               "Proteínas,Bad Stock Product,15000,19990,https://docs.google.com/document/123\n"

    # En este test modificaremos la fila de datos para enviar un stock inválido
    # Sin embargo, como el parser ahora busca stock en la subcabecera "Inventario", 
    # modificaremos la subcabecera para inyectar "not-a-number" o en los datos
    # de stock el valor "not-a-number".
    # Fila 0: Categoría / Objetivo,Suplemento / Alimento,Precio Costo,Precio Venta,Link Doc
    # Fila 1: ,,Inventario,Inventario,,
    # Fila 2: Proteínas,Bad Stock Product,15000,19990,https://docs.google.com/document/123
    # Espera, si la subcabecera es "Inventario", el índice se calcula y se saca de la fila de datos en esa columna.
    # En la fila de datos, la columna de inventario (columna 2 o 3, que tiene "Inventario" en la fila 1) tiene el valor.
    # Mapeo: 
    # Col 0: Categoría / Objetivo ("Proteínas")
    # Col 1: Suplemento / Alimento ("Bad Stock Product")
    # Col 2: Precio Costo ("15000")
    # Col 3: Precio Venta ("19990")
    # Col 4: Link Doc ("https://docs.google.com/document/123")
    # En Fila 1 (subcabecera), la columna de stock es la Columna 2 o 3 (donde dice "Inventario").
    # En la fila de datos, pongamos "not-a-number" en esa misma columna para disparar el ValueError.
    mock_csv = "Categoría / Objetivo,Suplemento / Alimento,Precio Costo,Precio Venta,Link Doc\n" \
               ",,Inventario,Inventario,,\n" \
               "Proteínas,Bad Stock Product,15000,not-a-number,https://docs.google.com/document/123\n"

    with patch("requests.get") as mock_get, patch("app.routers.admin.supabase_client", None):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_csv
        mock_get.return_value = mock_response

        response = client.post("/admin/products/sync-sheets", json={"csv_url": "http://fake-sheet.csv"})
        
        assert response.status_code == 200
        data = response.json()
        # Even if one product fails, it returns success=True if at least some succeed, but here it's 0/1 success.
        assert len(data["summary"]["errors"]) == 1
        assert data["summary"]["errors"][0]["product"] == "Bad Stock Product"

    app.dependency_overrides.clear()

    app.dependency_overrides.clear()
