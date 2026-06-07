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
        shipping_cost=5000,
        total=6100,
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
    assert result["total"] == 18990 + 5000
    assert result["items"][0]["unit_price"] == 18990
