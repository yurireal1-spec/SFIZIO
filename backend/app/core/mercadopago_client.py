import mercadopago
from mercadopago.config import RequestOptions
from app.core.config import settings
import uuid


def get_notification_url():
    url = settings.MERCADOPAGO_NOTIFICATION_URL
    return url if url.startswith("https://") else None


def get_mp_sdk():
    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        raise RuntimeError("MERCADOPAGO_ACCESS_TOKEN não configurado")
    sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
    return sdk


def create_payment(payment_data):
    sdk = get_mp_sdk()
    request_options = RequestOptions()
    request_options.custom_headers = {
        "x-idempotency-key": str(uuid.uuid4())
    }
    result = sdk.payment().create(payment_data, request_options)
    if result.get("status", 500) >= 400:
        response = result.get("response", {})
        message = (
            response.get("message")
            or response.get("error")
            or "Mercado Pago rejeitou o pagamento"
        )
        raise RuntimeError(message)
    return result["response"]


def create_preference(preference_data):
    sdk = get_mp_sdk()
    request_options = RequestOptions()
    request_options.custom_headers = {
        "x-idempotency-key": str(uuid.uuid4())
    }
    result = sdk.preference().create(preference_data, request_options)
    if result.get("status", 500) >= 400:
        response = result.get("response", {})
        message = (
            response.get("message")
            or response.get("error")
            or "Mercado Pago rejeitou a preferência"
        )
        raise RuntimeError(message)
    return result["response"]


def create_pix_payment(
    amount,
    description,
    email,
    order_id,
    first_name="Cliente",
    last_name="SFIZIO",
    cpf=None,
):
    payment_data = {
        "transaction_amount": amount,
        "description": description,
        "payment_method_id": "pix",
        "payer": {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
        },
        "external_reference": str(order_id),
    }
    if cpf:
        payment_data["payer"]["identification"] = {
            "type": "CPF",
            "number": cpf,
        }
    notification_url = get_notification_url()
    if notification_url:
        payment_data["notification_url"] = notification_url
    return create_payment(payment_data)
