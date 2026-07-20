import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from app.core.config import settings

_SUPABASE_CLIENT_MODULES = [
    "app.core.security",
    "app.routers.admin",
    "app.routers.chat",
    "app.routers.health",
    "app.routers.orders",
    "app.routers.payments",
    "app.routers.products",
    "app.routers.public",
    "app.services.orders_service",
    "app.services.products_service",
    "app.services.storage_service",
]


@pytest.fixture(autouse=True)
def hermetic_test_environment(monkeypatch):
    """
    El .env local de desarrollo puede tener credenciales reales (Supabase, Resend,
    pasarelas de pago). Esta fixture fuerza, para TODO el suite de tests, el modo
    mock/sandbox por defecto para que nunca se escriba en la base de datos real,
    se envien emails reales, ni se llame a las APIs reales de las pasarelas.
    Los tests que necesiten simular credenciales configuradas las sobreescriben
    puntualmente con su propio monkeypatch.
    """
    for module_path in _SUPABASE_CLIENT_MODULES:
        monkeypatch.setattr(f"{module_path}.supabase_client", None, raising=False)

    monkeypatch.setattr(settings, "allow_mock_auth_raw", True)
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "email_enabled", False)
    monkeypatch.setattr(settings, "resend_api_key", "")
    monkeypatch.setattr(settings, "mercadopago_access_token", "")
    monkeypatch.setattr(settings, "flow_api_key", "")
    monkeypatch.setattr(settings, "flow_secret_key", "")
    monkeypatch.setattr(settings, "webpay_api_key", "")
    monkeypatch.setattr(settings, "webpay_commerce_code", "597055555532")
    monkeypatch.setattr(settings, "r2_account_id", "")
    monkeypatch.setattr(settings, "r2_access_key_id", "")
    monkeypatch.setattr(settings, "r2_secret_access_key", "")

    yield
