from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    selected_options: Optional[str] = None

class OrderItem(OrderItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    shipping_address: str
    total_price: float

class OrderCreate(OrderBase):
    items: List[OrderItemBase]

class Order(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    created_at: datetime
    items: List[OrderItem]
    model_config = ConfigDict(from_attributes=True)

class OrderUpdateStatus(BaseModel):
    status: OrderStatus
