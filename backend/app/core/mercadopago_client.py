import mercadopago
from app.core.config import settings

def get_mp_sdk():
    # Em produção, essas chaves viriam do settings (configurado via .env)
    # Por agora, usamos placeholders funcionais para desenvolvimento
    access_token = "APP_USR-6317493138850125-041913-6b3a0c5c3e0e0a5c3e0e0a5c3e0e0a5c-12345678" # Placeholder
    sdk = mercadopago.SDK(access_token)
    return sdk

def create_payment(payment_data):
    sdk = get_mp_sdk()
    payment_response = sdk.payment().create(payment_data)
    return payment_response["response"]

def create_pix_payment(amount, description, email, order_id):
    payment_data = {
        "transaction_amount": amount,
        "description": description,
        "payment_method_id": "pix",
        "payer": {
            "email": email,
            "first_name": "Cliente",
            "last_name": "SFIZIO"
        },
        "external_reference": str(order_id),
        "notification_url": "https://sfizio-api.com/api/v1/webhooks/mercadopago" # URL fictícia para webhooks
    }
    return create_payment(payment_data)
