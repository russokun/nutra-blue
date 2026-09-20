from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_subscriber_success():
    """El endpoint /subscribers registra el lead y responde 201."""
    with patch("app.routers.subscribers.send_welcome_email"), \
         patch("app.routers.subscribers.append_lead_to_sheet"), \
         patch("app.routers.subscribers.notify_n8n"):
        response = client.post(
            "/subscribers",
            json={"email": "TestLead@NutraBlue.cl", "source": "Pop-up Magnet"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "Suscripcion registrada" in data["message"]
        # La respuesta le dice al front que cupon quedo asignado al lead.
        assert data["coupon_code"]
        assert data["discount"] > 0


def test_create_subscriber_persists_to_supabase():
    """Si supabase_client esta configurado, se hace upsert en la tabla leads."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.from_.return_value = mock_table
    mock_table.upsert.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[{"id": "123"}])

    with patch("app.routers.subscribers.supabase_client", mock_supabase), \
         patch("app.routers.subscribers.send_welcome_email"), \
         patch("app.routers.subscribers.append_lead_to_sheet"), \
         patch("app.routers.subscribers.notify_n8n"):
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


def test_create_subscriber_dispara_planilla_y_n8n():
    """El lead se manda tanto a la planilla como a n8n, con el correo normalizado."""
    with patch("app.routers.subscribers.send_welcome_email") as mock_email, \
         patch("app.routers.subscribers.append_lead_to_sheet") as mock_sheet, \
         patch("app.routers.subscribers.notify_n8n") as mock_n8n:
        response = client.post(
            "/subscribers",
            json={"email": "  Lead.Nuevo@Test.COM ", "source": "Pop-up Magnet"}
        )
        assert response.status_code == 201
        mock_email.assert_called_once_with("lead.nuevo@test.com")
        mock_sheet.assert_called_once_with("lead.nuevo@test.com", "Pop-up Magnet")
        mock_n8n.assert_called_once_with("lead.nuevo@test.com", "Pop-up Magnet")


def test_create_subscriber_no_falla_si_supabase_se_cae():
    """Un error de Supabase no puede romper la suscripcion del visitante."""
    mock_supabase = MagicMock()
    mock_supabase.from_.side_effect = Exception("supabase caido")

    with patch("app.routers.subscribers.supabase_client", mock_supabase), \
         patch("app.routers.subscribers.send_welcome_email") as mock_email, \
         patch("app.routers.subscribers.append_lead_to_sheet") as mock_sheet, \
         patch("app.routers.subscribers.notify_n8n"):
        response = client.post(
            "/subscribers",
            json={"email": "resiliente@test.com", "source": "Footer Newsletter"}
        )
        assert response.status_code == 201
        # El lead igual sale a la planilla y al email aunque la BD falle.
        assert mock_sheet.called
        assert mock_email.called


def test_create_subscriber_source_vacio_usa_website():
    with patch("app.routers.subscribers.send_welcome_email"), \
         patch("app.routers.subscribers.append_lead_to_sheet") as mock_sheet, \
         patch("app.routers.subscribers.notify_n8n"):
        response = client.post("/subscribers", json={"email": "sin@origen.cl", "source": "  "})
        assert response.status_code == 201
        mock_sheet.assert_called_once_with("sin@origen.cl", "website")


def test_create_subscriber_invalid_email():
    """Valida el formato del correo electronico."""
    response = client.post(
        "/subscribers",
        json={"email": "correo-invalido-sin-arroba", "source": "Web"}
    )
    assert response.status_code == 422
