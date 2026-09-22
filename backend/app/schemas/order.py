from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)
    unit_price: Decimal
    selected_options: Optional[str] = None

class OrderItem(OrderItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    shipping_address: str
    total_price: Decimal
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemBase]

class Order(OrderBase):
    id: int
    user_id: Optional[int] = None
    status: OrderStatus
    created_at: datetime
    items: List[OrderItem]
    model_config = ConfigDict(from_attributes=True)

class OrderUpdateStatus(BaseModel):
    status: OrderStatus
