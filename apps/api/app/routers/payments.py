from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from app.core.payments.factory import PaymentGatewayFactory
from app.database.supabase import supabase_client
from app.core.config import settings
from app.core.mock_store import MOCK_ORDERS
from app.services.orders_service import get_order_by_id

router = APIRouter(prefix="/payment", tags=["Payment"])


def validate_payment_request(order_id: str, amount: int, allow_already_paid: bool = False) -> dict:
    order = get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("status") == "paid":
        if allow_already_paid:
            return order
        raise HTTPException(status_code=400, detail="Order is already paid")

    expected_total = int(order.get("total", 0))
    if int(amount) != expected_total:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount mismatch. Expected {expected_total}, received {amount}",
        )

    return order


async def mark_order_as_paid(order_id: str):
    from app.services.email_service import send_payment_confirmation
    import asyncio

    if supabase_client is None:
        if order_id in MOCK_ORDERS:
            MOCK_ORDERS[order_id]["status"] = "paid"
            paid_order = MOCK_ORDERS[order_id]
            asyncio.create_task(send_payment_confirmation(paid_order))
            return paid_order
        raise Exception(f"Order {order_id} not found to mark as paid")

    response = supabase_client.from_("orders").update({"status": "paid"}).eq("id", order_id).execute()
    if not response.data:
        raise Exception(f"Order {order_id} not found to mark as paid")
    paid_order = response.data[0]
    asyncio.create_task(send_payment_confirmation(paid_order))
    return paid_order


@router.post("/init")
@router.post("/flow-init")
async def initialize_payment(request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    order_id = payload.get("order_id")
    amount = payload.get("amount")
    email = payload.get("email")
    phone = payload.get("phone", "")
    customer_name = payload.get("customer_name", "")

    if not order_id or amount is None or not email:
        raise HTTPException(status_code=400, detail="Missing required fields: order_id, amount, email")

    order = validate_payment_request(order_id, int(float(amount)))

    if order.get("email", "").lower() != email.lower():
        raise HTTPException(status_code=403, detail="Email does not match order")

    gateway_name = payload.get("gateway")
    gateway = PaymentGatewayFactory.get_gateway(gateway_name)

    try:
        result = gateway.create_transaction(
            order_id=order_id,
            amount=int(order["total"]),
            email=email,
            phone=phone,
            customer_name=customer_name,
        )
        # Asegurar compatibilidad con el blueprint (devolver payment_url)
        if "redirect_url" in result and "payment_url" not in result:
            result["payment_url"] = result["redirect_url"]
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to initialize payment")


@router.post("/flow-callback")
@router.post("/mercadopago-callback")
async def payment_webhook(request: Request):
    content_type = request.headers.get("Content-Type", "")
    payload = {}

    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        payload = dict(form_data)
    else:
        try:
            payload = await request.json()
        except Exception:
            pass

    headers = dict(request.headers)
    gateway = PaymentGatewayFactory.get_gateway()

    try:
        verification = gateway.verify_webhook(payload, headers)

        status = verification.get("status")
        order_id = verification.get("order_id")

        if status == "success" and order_id:
            order = get_order_by_id(order_id)
            if order and order.get("status") != "paid":
                validate_payment_request(order_id, order["total"])
                await mark_order_as_paid(order_id)
            return {"success": True, "message": "Order paid successfully"}

        return {"success": True, "message": f"Webhook processed: {status}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Webhook verification failed")


@router.get("/transbank-return")
@router.post("/transbank-return")
async def transbank_return(request: Request):
    params = dict(request.query_params)

    if request.method == "POST":
        form_data = await request.form()
        params.update(dict(form_data))

    order_id = params.get("order_id")
    gateway = PaymentGatewayFactory.get_gateway()

    try:
        result = gateway.handle_return(params)
        status = result.get("status")
        final_order_id = result.get("order_id") or order_id

        if status == "success" and final_order_id:
            order = get_order_by_id(final_order_id)
            if order:
                validate_payment_request(final_order_id, order["total"])
            await mark_order_as_paid(final_order_id)
            return RedirectResponse(
                url=f"https://{settings.website_domain}/order-confirmation/{final_order_id}",
                status_code=303,
            )

        return RedirectResponse(
            url=f"https://{settings.website_domain}/checkout?error={status}",
            status_code=303,
        )
    except HTTPException:
        return RedirectResponse(
            url=f"https://{settings.website_domain}/checkout?error=payment_validation",
            status_code=303,
        )
    except Exception:
        return RedirectResponse(
            url=f"https://{settings.website_domain}/checkout?error=exception",
            status_code=303,
        )
