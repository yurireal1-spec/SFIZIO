from datetime import datetime, time, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_active_superuser, get_db

router = APIRouter()
CONFIRMED_STATUSES = (
    models.order.OrderStatus.PAID,
    models.order.OrderStatus.SHIPPED,
    models.order.OrderStatus.DELIVERED,
)


@router.get("/", response_model=Dict[str, Any])
def read_dashboard(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.user.User = Depends(get_current_active_superuser),
) -> Dict[str, Any]:
    start_date = datetime.combine(
        (datetime.utcnow() - timedelta(days=days - 1)).date(), time.min
    )
    confirmed_filter = models.order.Order.status.in_(CONFIRMED_STATUSES)

    revenue = db.query(func.coalesce(func.sum(models.order.Order.total_price), 0)).filter(
        confirmed_filter,
        models.order.Order.created_at >= start_date,
    ).scalar()
    order_count = db.query(func.count(models.order.Order.id)).filter(
        models.order.Order.created_at >= start_date,
    ).scalar()
    confirmed_count = db.query(func.count(models.order.Order.id)).filter(
        confirmed_filter,
        models.order.Order.created_at >= start_date,
    ).scalar()
    pending_count = db.query(func.count(models.order.Order.id)).filter(
        models.order.Order.status == models.order.OrderStatus.PENDING,
        models.order.Order.created_at >= start_date,
    ).scalar()

    sales_rows = db.query(
        func.date(models.order.Order.created_at).label("day"),
        func.coalesce(func.sum(models.order.Order.total_price), 0).label("total"),
    ).filter(
        confirmed_filter,
        models.order.Order.created_at >= start_date,
    ).group_by(func.date(models.order.Order.created_at)).order_by(
        func.date(models.order.Order.created_at)
    ).all()
    sales_by_day = {str(row.day): float(row.total) for row in sales_rows}
    sales = [
        {
            "date": (start_date.date() + timedelta(days=offset)).isoformat(),
            "total": sales_by_day.get(
                (start_date.date() + timedelta(days=offset)).isoformat(), 0
            ),
        }
        for offset in range(days)
    ]

    recent_orders = db.query(models.order.Order).order_by(
        models.order.Order.created_at.desc()
    ).limit(5).all()
    low_stock = db.query(models.product.Product).filter(
        models.product.Product.is_active.is_(True),
        models.product.Product.stock <= 2,
    ).order_by(models.product.Product.stock.asc()).limit(8).all()
    active_products = db.query(func.count(models.product.Product.id)).filter(
        models.product.Product.is_active.is_(True),
    ).scalar()
    average_ticket = float(revenue or 0) / confirmed_count if confirmed_count else 0

    return {
        "period_days": days,
        "revenue": float(revenue or 0),
        "orders": int(order_count or 0),
        "confirmed_orders": int(confirmed_count or 0),
        "pending_orders": int(pending_count or 0),
        "average_ticket": average_ticket,
        "active_products": int(active_products or 0),
        "sales": sales,
        "recent_orders": [
            {
                "id": order.id,
                "created_at": order.created_at,
                "status": order.status.value,
                "total_price": order.total_price,
                "client_name": order.client_name,
                "client_email": order.client_email,
            }
            for order in recent_orders
        ],
        "low_stock": [
            {"id": product.id, "name": product.name, "stock": product.stock}
            for product in low_stock
        ],
    }
