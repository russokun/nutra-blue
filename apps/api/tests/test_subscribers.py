import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_create_subscriber_success():
    """Verifica que el endpoint /subscribers registra el lead y responde 201."""
    with patch("app.routers.subscribers.send_welcome_email") as mock_email, \
         patch("app.routers.subscribers._notify_n8n") as mock_n8n:
        response = client.post(
            "/subscribers",
            json={"email": "TestLead@NutraBlue.cl", "source": "Pop-up Magnet"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "Suscripcion registrada" in data["message"]


def test_create_subscriber_persists_to_supabase():
    """Verifica que si supabase_client esta configurado, se llama a upsert en la tabla leads."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.from_.return_value = mock_table
    mock_table.upsert.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[{"id": "123"}])

    with patch("app.routers.subscribers.supabase_client", mock_supabase), \
         patch("app.routers.subscribers.send_welcome_email"), \
         patch("app.routers.subscribers._notify_n8n"):
        response = client.post(
            "/subscribers",
            json={"email": "nuevo@cliente.cl", "source": "Footer"}
        )
        assert response.status_code == 201
        mock_supabase.from_.assert_called_with("leads")
        mock_table.upsert.assert_called_once_with(
            {"email": "nuevo@cliente.cl", "source": "Footer"},
            on_conflict="email"
        )


def test_create_subscriber_invalid_email():
    """Verifica validacion de formato de correo electronico."""
    response = client.post(
        "/subscribers",
        json={"email": "correo-invalido-sin-arroba", "source": "Web"}
    )
    assert response.status_code == 422
