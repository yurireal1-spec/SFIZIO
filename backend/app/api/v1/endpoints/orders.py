from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.api.deps import get_db, get_current_active_superuser

router = APIRouter()

@router.post("/", response_model=schemas.order.Order)
def create_order(
    *,
    db: Session = Depends(get_db),
    order_in: schemas.order.OrderCreate,
    # current_user: models.user.User = Depends(get_current_user) # In future logic
) -> Any:
    """
    Cria um novo pedido.
    """
    # 1. Mock de usuário para desenvolvimento inicial (ID 1)
    # Em produção, usaríamos o ID do usuário autenticado via token.
    user_id = 1 
    
    # 2. Criar a ordem principal
    db_order = models.order.Order(
        user_id=user_id,
        total_price=order_in.total_price,
        shipping_address=order_in.shipping_address,
        status=models.order.OrderStatus.PENDING
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # 3. Criar os itens da ordem
    for item in order_in.items:
        db_item = models.order.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            selected_options=item.selected_options # Novo campo
        )
        db.add(db_item)
        
        # Opcional: Baixar estoque
        product = db.query(models.product.Product).filter(models.product.Product.id == item.product_id).first()
        if product:
            product.stock -= item.quantity
            
    db.commit()
    db.refresh(db_order)
    
    # Futuro: Aqui dispararíamos o processamento do Mercado Pago via SDK
    # se o pagamento fosse por cartão via token enviado do frontend.
    
    return db_order

@router.get("/me", response_model=List[schemas.order.Order])
def read_orders_me(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retorna o histórico de pedidos do usuário logado.
    """
    user_id = 1 # Mock
    orders = db.query(models.order.Order).filter(models.order.Order.user_id == user_id).offset(skip).limit(limit).all()
    return orders

@router.get("/", response_model=List[schemas.order.Order])
def read_orders_all(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.user.User = Depends(get_current_active_superuser)
) -> Any:
    """
    Lista todos os pedidos. Apenas para administradores.
    Pedidos mais recentes primeiro.
    """
    orders = db.query(models.order.Order).order_by(models.order.Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders

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
    
    order.status = status_update.status
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
