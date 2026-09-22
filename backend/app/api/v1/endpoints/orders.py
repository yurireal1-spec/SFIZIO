import json
import hashlib
import hmac
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.api import deps
from app.api.deps import get_db, get_current_active_superuser
from app.core.config import settings
from app.core.mercadopago_client import (
    create_pix_payment,
    create_payment,
    create_preference,
    get_mp_sdk,
    get_notification_url,
)

router = APIRouter()

@router.post("/", response_model=schemas.order.Order)
def create_order(
    *,
    db: Session = Depends(get_db),
    order_in: schemas.order.OrderCreate,
    current_user: Optional[models.user.User] = Depends(deps.get_current_user_optional)
) -> Any:
    """
    Cria um novo pedido.
    """
    if not order_in.items:
        raise HTTPException(status_code=400, detail="O pedido precisa ter ao menos um item")

    products: Dict[int, models.product.Product] = {}
    quantities: Dict[int, int] = {}
    calculated_items = []
    calculated_total = Decimal("0.00")

    for item in order_in.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="A quantidade deve ser maior que zero")

        product = products.get(item.product_id)
        if product is None:
            product = db.query(models.product.Product).filter(
                models.product.Product.id == item.product_id,
                models.product.Product.is_active.is_(True),
            ).with_for_update().first()
            if not product:
                raise HTTPException(status_code=400, detail="Produto indisponível")
            products[item.product_id] = product

        try:
            selected_options = json.loads(item.selected_options) if item.selected_options else {}
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Opções do produto inválidas")

        if not isinstance(selected_options, dict):
            raise HTTPException(status_code=400, detail="Opções do produto inválidas")

        modifiers = Decimal("0.00")
        for option_id, value_id in selected_options.items():
            option = next((option for option in product.options if option.id == int(option_id)), None)
            value = next((value for value in option.values if value.id == int(value_id)), None) if option else None
            if not value:
                raise HTTPException(status_code=400, detail="Opção de produto inválida")
            modifiers += value.price_modifier or 0.0

        quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity
        unit_price = (product.discount_price if product.discount_price is not None else product.price) + modifiers
        calculated_total += unit_price * item.quantity
        calculated_items.append((item, unit_price))

    for product_id, quantity in quantities.items():
        product = products[product_id]
        if product.stock < quantity:
            raise HTTPException(status_code=409, detail=f"Estoque insuficiente para {product.name}")

    user_id = current_user.id if current_user else None
    db_order = models.order.Order(
        user_id=user_id,
        total_price=calculated_total,
        shipping_address=order_in.shipping_address,
        client_name=order_in.client_name,
        client_email=order_in.client_email,
        client_phone=order_in.client_phone,
        status=models.order.OrderStatus.PENDING
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    for item, unit_price in calculated_items:
        db_item = models.order.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=unit_price,
            selected_options=item.selected_options,
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    
    # Futuro: Aqui dispararíamos o processamento do Mercado Pago via SDK
    # se o pagamento fosse por cartão via token enviado do frontend.
    
    return db_order

@router.post("/{id}/checkout")
def create_order_checkout(
    *,
    db: Session = Depends(get_db),
    id: int,
    checkout_in: Dict[str, Any],
) -> Dict[str, Any]:
    """Cria uma preferência do Checkout Pro para o pedido."""
    order = db.query(models.order.Order).filter(models.order.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if order.status != models.order.OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail="Este pedido não está aguardando pagamento")
    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=503, detail="Pagamento ainda não configurado")

    first_name = checkout_in.get("first_name") or (order.client_name or "Cliente").split(" ", 1)[0]
    last_name = checkout_in.get("last_name") or "SFIZIO"
    cpf = "".join(char for char in str(checkout_in.get("cpf", "")) if char.isdigit())
    payer = {
        "email": order.client_email,
        "name": first_name,
        "surname": last_name,
    }
    if cpf:
        payer["identification"] = {"type": "CPF", "number": cpf}

    preference_data = {
        "items": [
            {
                "id": str(item.product_id),
                "title": f"Pedido SFIZIO #{order.id}",
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "currency_id": "BRL",
            }
            for item in order.items
        ],
        "payer": payer,
        "external_reference": str(order.id),
        "back_urls": {
            "success": "http://localhost:3000/checkout?status=success",
            "failure": "http://localhost:3000/checkout?status=failure",
            "pending": "http://localhost:3000/checkout?status=pending",
        },
        "auto_return": "approved",
    }
    address = checkout_in.get("address") or {}
    receiver_address = {
        "street_name": address.get("street"),
        "street_number": address.get("number"),
        "zip_code": address.get("cep"),
        "city_name": address.get("city"),
        "state_name": address.get("state"),
    }
    receiver_address = {
        key: value for key, value in receiver_address.items() if value
    }
    if receiver_address:
        preference_data["shipments"] = {"receiver_address": receiver_address}
    notification_url = get_notification_url()
    if notification_url:
        preference_data["notification_url"] = notification_url
    try:
        preference = create_preference(preference_data)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Não foi possível criar o checkout") from exc

    return {
        "preference_id": preference.get("id"),
        "init_point": preference.get("init_point"),
        "sandbox_init_point": preference.get("sandbox_init_point"),
    }

@router.post("/{id}/payment")
def create_order_payment(
    *,
    db: Session = Depends(get_db),
    id: int,
    payment_in: Dict[str, Any],
) -> Dict[str, Any]:
    """Cria um pagamento no Mercado Pago sem receber dados brutos do cartão."""
    order = db.query(models.order.Order).filter(models.order.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if order.status != models.order.OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail="Este pedido não está aguardando pagamento")
    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=503, detail="Pagamento ainda não configurado")

    method = payment_in.get("method")
    email = order.client_email or payment_in.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="E-mail do pagador obrigatório")

    try:
        if method == "pix":
            first_name = str(payment_in.get("first_name") or "Cliente")
            last_name = str(payment_in.get("last_name") or "SFIZIO")
            cpf = "".join(
                char for char in str(payment_in.get("cpf", "")) if char.isdigit()
            )
            payment = create_pix_payment(
                float(order.total_price),
                f"Pedido SFIZIO #{order.id}",
                email,
                order.id,
                first_name,
                last_name,
                cpf or None,
            )
        elif method == "card":
            token = payment_in.get("token")
            payment_method_id = payment_in.get("payment_method_id")
            if not token or not payment_method_id:
                raise HTTPException(status_code=400, detail="Token do cartão obrigatório")
            payment = create_payment({
                "transaction_amount": float(order.total_price),
                "description": f"Pedido SFIZIO #{order.id}",
                "token": token,
                "payment_method_id": payment_method_id,
                "installments": int(payment_in.get("installments", 1)),
                "payer": {"email": email},
                "external_reference": str(order.id),
                "notification_url": settings.MERCADOPAGO_NOTIFICATION_URL,
            })
        else:
            raise HTTPException(status_code=400, detail="Método de pagamento inválido")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Não foi possível criar o pagamento") from exc

    transaction_data = payment.get("point_of_interaction", {}).get(
        "transaction_data", {}
    )
    return {
        "payment_id": payment.get("id"),
        "status": payment.get("status"),
        "qr_code": transaction_data.get("qr_code"),
        "qr_code_base64": transaction_data.get("qr_code_base64"),
    }

@router.post("/webhooks/mercadopago")
def mercadopago_webhook(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    x_signature: Optional[str] = Header(default=None),
    x_request_id: Optional[str] = Header(default=None),
) -> Dict[str, bool]:
    """Recebe atualizações de pagamento e mantém o pedido idempotente."""
    payment_id = str(payload.get("data", {}).get("id", ""))
    if payload.get("type") != "payment" or not payment_id:
        return {"received": True}

    secret = settings.MERCADOPAGO_WEBHOOK_SECRET
    if secret:
        if not x_signature or not x_request_id:
            raise HTTPException(status_code=401, detail="Assinatura ausente")
        signature_parts = dict(
            part.split("=", 1) for part in x_signature.split(",") if "=" in part
        )
        timestamp = signature_parts.get("ts")
        received_hash = signature_parts.get("v1")
        manifest = f"id:{payment_id};request-id:{x_request_id};ts:{timestamp};"
        expected_hash = hmac.new(
            secret.encode(), manifest.encode(), hashlib.sha256
        ).hexdigest()
        if not timestamp or not received_hash or not hmac.compare_digest(
            expected_hash, received_hash
        ):
            raise HTTPException(status_code=401, detail="Assinatura inválida")
    elif settings.ENVIRONMENT != "development":
        raise HTTPException(status_code=503, detail="Webhook não configurado")

    payment = get_mp_sdk().payment().get(payment_id).get("response", {})
    reference = payment.get("external_reference")
    if not reference or not str(reference).isdigit():
        return {"received": True}

    order = db.query(models.order.Order).filter(
        models.order.Order.id == int(reference)
    ).first()
    if not order:
        return {"received": True}

    amount = Decimal(str(payment.get("transaction_amount") or 0))
    if abs(amount - order.total_price) > Decimal("0.01"):
        raise HTTPException(status_code=400, detail="Valor do pagamento divergente")

    status_map = {
        "approved": models.order.OrderStatus.PAID,
        "rejected": models.order.OrderStatus.CANCELLED,
        "cancelled": models.order.OrderStatus.CANCELLED,
    }
    new_status = status_map.get(payment.get("status"))
    if new_status and order.status == models.order.OrderStatus.PENDING:
        if new_status == models.order.OrderStatus.PAID:
            for item in order.items:
                product = db.query(models.product.Product).filter(
                    models.product.Product.id == item.product_id
                ).with_for_update().first()
                if not product or product.stock < item.quantity:
                    raise HTTPException(status_code=409, detail="Estoque insuficiente")
                product.stock -= item.quantity
        order.status = new_status
        db.commit()

    return {"received": True}

@router.get("/me", response_model=List[schemas.order.Order])
def read_orders_me(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.user.User = Depends(deps.get_current_user)
) -> Any:
    """
    Retorna o histórico de pedidos do usuário logado.
    """
    orders = db.query(models.order.Order).filter(models.order.Order.user_id == current_user.id).offset(skip).limit(limit).all()
    return orders

@router.get("/", response_model=List[schemas.order.Order])
def read_orders_all(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.order.OrderStatus] = None,
    q: Optional[str] = None,
    current_user: models.user.User = Depends(get_current_active_superuser)
) -> Any:
    """
    Lista todos os pedidos. Apenas para administradores.
    Pedidos mais recentes primeiro.
    """
    query = db.query(models.order.Order)
    if status:
        query = query.filter(models.order.Order.status == status)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            (models.order.Order.client_name.ilike(search))
            | (models.order.Order.client_email.ilike(search))
        )
        if q.isdigit():
            query = db.query(models.order.Order).filter(
                models.order.Order.id == int(q)
            )
            if status:
                query = query.filter(models.order.Order.status == status)
    orders = query.order_by(models.order.Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders

@router.get("/{id}", response_model=schemas.order.Order)
def read_order(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.user.User = Depends(get_current_active_superuser),
) -> Any:
    order = db.query(models.order.Order).filter(models.order.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return order

@router.patch("/{id}/status", response_model=schemas.order.Order)
def update_order_status(
    *,
    db: Session = Depends(get_db),
    id: int,
    status_update: schemas.order.OrderUpdateStatus,
    current_user: models.user.User = Depends(get_current_active_superuser)
) -> Any:
    """
    Atualiza o status de um pedido. Apenas para administradores.
    """
    order = db.query(models.order.Order).filter(models.order.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    allowed_transitions = {
        models.order.OrderStatus.PENDING: {
            models.order.OrderStatus.PAID,
            models.order.OrderStatus.CANCELLED,
        },
        models.order.OrderStatus.PAID: {
            models.order.OrderStatus.SHIPPED,
            models.order.OrderStatus.CANCELLED,
        },
        models.order.OrderStatus.SHIPPED: {models.order.OrderStatus.DELIVERED},
        models.order.OrderStatus.DELIVERED: set(),
        models.order.OrderStatus.CANCELLED: set(),
    }
    if status_update.status == order.status:
        return order
    if status_update.status not in allowed_transitions.get(order.status, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Transição inválida: {order.status.value} -> {status_update.status.value}",
        )

    order.status = status_update.status
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.post("/{id}/simulate-payment", response_model=schemas.order.Order)
def simulate_payment(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: models.user.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Simula a confirmação de pagamento para um pedido (sem autenticação, para desenvolvimento).
    """
    if settings.ENVIRONMENT != "development":
        raise HTTPException(status_code=404, detail="Rota indisponível")

    order = db.query(models.order.Order).filter(models.order.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    order.status = models.order.OrderStatus.PAID
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
