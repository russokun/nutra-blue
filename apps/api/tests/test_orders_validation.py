import pytest
from app.models.orders import OrderCreate, OrderItem
from app.services.orders_service import validate_and_build_order, OrderValidationError


def test_rejects_empty_items():
    order = OrderCreate(
        customer_name="Test",
        email="test@example.com",
        phone="+56912345678",
        address="Calle 1",
        city="Santiago",
        region="Metropolitana",
        items=[],
        subtotal=0,
        tax=0,
        shipping_cost=0,
        total=0,
    )
    with pytest.raises(OrderValidationError):
        validate_and_build_order(order)


def test_rejects_invalid_region():
    order = OrderCreate(
        customer_name="Test",
        email="test@example.com",
        phone="+56912345678",
        address="Calle 1",
        city="Santiago",
        region="Invalid Region",
        items=[OrderItem(product_id="calm-and-focus", quantity=1)],
        subtotal=1000,
        tax=100,
        shipping_cost=0,
        total=1100,
    )
    with pytest.raises(OrderValidationError):
        validate_and_build_order(order)


def test_recalculates_totals_server_side():
    order = OrderCreate(
        customer_name="Test",
        email="test@example.com",
        phone="+56912345678",
        address="Calle 1",
        city="Santiago",
        region="Metropolitana",
        items=[OrderItem(product_id="calm-and-focus", quantity=1)],
        subtotal=1,
        tax=1,
        shipping_cost=1,
        total=1,
    )
    result = validate_and_build_order(order)
    assert result["total"] != 1
    assert result["total"] == 18990
    assert result["shipping_cost"] == 0
    assert result["items"][0]["unit_price"] == 18990


def build_order(**overrides):
    payload = {
        "customer_name": "Test",
        "email": "test@example.com",
        "phone": "+56912345678",
        "address": "Calle 1",
        "city": "Santiago",
        "region": "Metropolitana",
        "items": [OrderItem(product_id="calm-and-focus", quantity=1)],
        "subtotal": 1,
        "tax": 1,
        "shipping_cost": 1,
        "total": 1,
    }
    payload.update(overrides)
    return OrderCreate(**payload)


def test_delivery_method_defaults_to_domicilio():
    result = validate_and_build_order(build_order())
    assert result["delivery_method"] == "domicilio"
    assert result["courier"] is None


def test_rejects_unknown_delivery_method():
    with pytest.raises(OrderValidationError):
        validate_and_build_order(build_order(delivery_method="teletransporte"))


def test_courier_pickup_requires_a_courier():
    with pytest.raises(OrderValidationError):
        validate_and_build_order(build_order(delivery_method="retiro_courier"))

    with pytest.raises(OrderValidationError):
        validate_and_build_order(build_order(delivery_method="retiro_courier", courier="correos"))

    result = validate_and_build_order(
        build_order(delivery_method="retiro_courier", courier="starken")
    )
    assert result["courier"] == "starken"


def test_courier_is_discarded_when_not_picking_up():
    """Una orden a domicilio con courier quedaria con datos contradictorios."""
    result = validate_and_build_order(build_order(delivery_method="domicilio", courier="starken"))
    assert result["courier"] is None


def test_delivery_method_does_not_change_shipping_cost():
    """El metodo de entrega es solo un dato: no cobramos despacho en ningun caso."""
    domicilio = validate_and_build_order(build_order())
    retiro = validate_and_build_order(
        build_order(delivery_method="retiro_courier", courier="pullman")
    )
    assert domicilio["shipping_cost"] == retiro["shipping_cost"] == 0
    assert domicilio["total"] == retiro["total"]


def test_rejects_retiro_vendedor():
    """Se ofrecio al principio pero NutraBlue no tiene puntos fisicos de retiro."""
    with pytest.raises(OrderValidationError):
        validate_and_build_order(build_order(delivery_method="retiro_vendedor"))


# --- Facturacion a empresa -------------------------------------------------------

EMPRESA_OK = {
    "is_company": True,
    "tax_id": "12.345.678-5",  # DV calculado a mano, ver tests/test_rut.py
    "business_name": "Comercial Ejemplo SpA",
    "business_activity": "Venta al por menor de alimentos",
    "billing_address": "Av. Comercial 100, oficina 5",
}


def test_pedido_normal_no_guarda_datos_de_facturacion():
    # Un RUT colgado en un pedido que nadie va a facturar es un dato personal guardado
    # sin motivo.
    result = validate_and_build_order(build_order())
    assert result["is_company"] is False
    for campo in ("tax_id", "business_name", "business_activity", "billing_email", "billing_address"):
        assert result[campo] is None, campo


def test_pedido_de_empresa_guarda_los_datos_normalizados():
    result = validate_and_build_order(build_order(**EMPRESA_OK))
    assert result["is_company"] is True
    # Se guarda sin puntos y con guion, no como lo tipeo el cliente.
    assert result["tax_id"] == "12345678-5"
    assert result["business_name"] == "Comercial Ejemplo SpA"
    assert result["business_activity"] == "Venta al por menor de alimentos"
    assert result["billing_address"] == "Av. Comercial 100, oficina 5"


def test_el_domicilio_comercial_no_pisa_la_direccion_de_entrega():
    # Son dos cosas distintas: oficina contra donde se recibe el pedido.
    result = validate_and_build_order(build_order(**EMPRESA_OK))
    assert result["address"] == "Calle 1"
    assert result["billing_address"] == "Av. Comercial 100, oficina 5"


def test_sin_correo_de_facturacion_se_usa_el_del_pedido():
    # Dejarlo vacio obliga a perseguir al cliente despues para poder emitir.
    result = validate_and_build_order(build_order(**EMPRESA_OK))
    assert result["billing_email"] == "test@example.com"


def test_correo_de_facturacion_propio_se_respeta():
    result = validate_and_build_order(
        build_order(**{**EMPRESA_OK, "billing_email": "contabilidad@ejemplo.cl"})
    )
    assert result["billing_email"] == "contabilidad@ejemplo.cl"


def test_rechaza_rut_con_digito_verificador_equivocado():
    with pytest.raises(OrderValidationError, match="RUT"):
        validate_and_build_order(build_order(**{**EMPRESA_OK, "tax_id": "12.345.678-4"}))


def test_rechaza_empresa_sin_rut():
    with pytest.raises(OrderValidationError, match="RUT"):
        validate_and_build_order(build_order(**{**EMPRESA_OK, "tax_id": None}))


@pytest.mark.parametrize("campo", ["business_name", "business_activity", "billing_address"])
def test_rechaza_empresa_sin_los_datos_obligatorios(campo):
    with pytest.raises(OrderValidationError):
        validate_and_build_order(build_order(**{**EMPRESA_OK, campo: "   "}))
