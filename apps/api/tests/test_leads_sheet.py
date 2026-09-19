"""Cobertura del envio de leads a la planilla de Google Sheets y a n8n."""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from app.services import leads_sheet


def _response(status_code: int):
    resp = MagicMock()
    resp.status_code = status_code
    resp.text = "ok" if status_code < 400 else "error"
    return resp


def _mock_client(responses):
    """AsyncClient falso que va devolviendo las respuestas dadas."""
    client = MagicMock()
    client.post = AsyncMock(side_effect=responses)
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=client)
    ctx.__aexit__ = AsyncMock(return_value=False)
    return ctx, client


def test_no_hace_nada_si_la_planilla_no_esta_configurada():
    with patch.object(leads_sheet.settings, "google_sheets_leads_webhook", ""):
        with patch("app.services.leads_sheet.httpx.AsyncClient") as mock_client:
            assert asyncio.run(leads_sheet.append_lead_to_sheet("a@b.cl", "Footer")) is False
            assert not mock_client.called


def test_envia_el_lead_a_la_planilla_con_token():
    ctx, client = _mock_client([_response(200)])
    with patch.object(leads_sheet.settings, "google_sheets_leads_webhook", "https://script.google.com/exec"), \
         patch.object(leads_sheet.settings, "google_sheets_leads_token", "secreto"), \
         patch("app.services.leads_sheet.httpx.AsyncClient", return_value=ctx):
        assert asyncio.run(leads_sheet.append_lead_to_sheet("lead@test.cl", "Pop-up Magnet")) is True

    payload = client.post.call_args.kwargs["json"]
    assert payload["email"] == "lead@test.cl"
    assert payload["source"] == "Pop-up Magnet"
    assert payload["token"] == "secreto"
    assert payload["coupon_code"] == leads_sheet.settings.welcome_coupon_code


def test_reintenta_cuando_la_planilla_responde_error():
    ctx, client = _mock_client([_response(500), _response(200)])
    with patch.object(leads_sheet.settings, "google_sheets_leads_webhook", "https://script.google.com/exec"), \
         patch.object(leads_sheet.settings, "google_sheets_leads_token", ""), \
         patch("app.services.leads_sheet._BACKOFF_SECONDS", (0, 0)), \
         patch("app.services.leads_sheet.httpx.AsyncClient", return_value=ctx):
        assert asyncio.run(leads_sheet.append_lead_to_sheet("lead@test.cl", "Footer")) is True
    assert client.post.await_count == 2


def test_se_rinde_tras_los_reintentos_sin_romper():
    ctx, client = _mock_client([Exception("timeout"), Exception("timeout"), Exception("timeout")])
    with patch.object(leads_sheet.settings, "google_sheets_leads_webhook", "https://script.google.com/exec"), \
         patch.object(leads_sheet.settings, "google_sheets_leads_token", ""), \
         patch("app.services.leads_sheet._BACKOFF_SECONDS", (0, 0)), \
         patch("app.services.leads_sheet.httpx.AsyncClient", return_value=ctx):
        assert asyncio.run(leads_sheet.append_lead_to_sheet("lead@test.cl", "Footer")) is False
    assert client.post.await_count == leads_sheet._MAX_ATTEMPTS


def test_n8n_tambien_recibe_el_lead():
    ctx, client = _mock_client([_response(200)])
    with patch.object(leads_sheet.settings, "n8n_subscriber_webhook", "https://n8n.test/webhook/new-subscriber"), \
         patch("app.services.leads_sheet.httpx.AsyncClient", return_value=ctx):
        assert asyncio.run(leads_sheet.notify_n8n("lead@test.cl", "Footer Newsletter")) is True

    assert client.post.call_args.args[0] == "https://n8n.test/webhook/new-subscriber"
    assert client.post.call_args.kwargs["json"]["source"] == "Footer Newsletter"


def test_n8n_se_omite_si_no_esta_configurado():
    with patch.object(leads_sheet.settings, "n8n_subscriber_webhook", ""):
        assert asyncio.run(leads_sheet.notify_n8n("a@b.cl", "Footer")) is False
