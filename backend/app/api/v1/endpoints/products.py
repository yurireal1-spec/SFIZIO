from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=schemas.product.PaginatedProductList)
def read_products(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    in_stock: bool = False,
    include_inactive: bool = False,
    current_user: Optional[models.user.User] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    Retorna a lista de produtos com filtros opcionais, paginada.
    """
    query = db.query(models.product.Product)
    
    if include_inactive and (
        not current_user
        or (not current_user.is_superuser and current_user.role != models.user.UserRole.ADMIN)
    ):
        raise HTTPException(status_code=403, detail="Autenticação administrativa necessária")
    if not include_inactive:
        query = query.filter(models.product.Product.is_active == True)
        
    if category_id:
        query = query.filter(models.product.Product.category_id == category_id)
        
    if q:
        query = query.filter(models.product.Product.name.ilike(f"%{q}%"))
    if min_price is not None:
        query = query.filter(models.product.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.product.Product.price <= max_price)
    if in_stock:
        query = query.filter(models.product.Product.stock > 0)
    
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return {
        "items": products,
        "total": total,
        "page": page,
        "size": limit
    }

@router.get("/categories/", response_model=List[schemas.product.Category])
def read_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retorna as categorias disponíveis."""
    return db.query(models.product.Category).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.product.Product)
def create_product(
    *,
    db: Session = Depends(deps.get_db),
    product_in: schemas.product.ProductCreate,
    current_user: models.user.User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Cria um novo produto. Apenas para administradores.
    """
    product = db.query(models.product.Product).filter(models.product.Product.slug == product_in.slug).first()
    if product:
        raise HTTPException(status_code=400, detail="Já existe um produto com este slug.")
    
    db_obj = models.product.Product(
        name=product_in.name,
        slug=product_in.slug,
        description=product_in.description,
        price=product_in.price,
        discount_price=product_in.discount_price,
        stock=product_in.stock,
        category_id=product_in.category_id,
        is_active=product_in.is_active
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Add images if provided
    for img_in in product_in.images:
        db_img = models.product.ProductImage(
            product_id=db_obj.id,
            url=img_in.url,
            alt_text=img_in.alt_text,
            is_primary=img_in.is_primary
        )
        db.add(db_img)

    # Add options if provided
    for opt_in in product_in.options:
        db_opt = models.product.ProductOption(
            product_id=db_obj.id,
            name=opt_in.name
        )
        db.add(db_opt)
        db.flush()
        for val_in in opt_in.values:
            db_val = models.product.ProductOptionValue(
                option_id=db_opt.id,
                name=val_in.name,
                price_modifier=val_in.price_modifier,
                meta=val_in.meta,
                image_url=val_in.image_url
            )
            db.add(db_val)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=schemas.product.Product)
def update_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    product_in: schemas.product.ProductUpdate,
    current_user: models.user.User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Atualiza um produto existente. Apenas para administradores.
    """
    product = db.query(models.product.Product).filter(models.product.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    update_data = product_in.model_dump(exclude_unset=True)
    for field in update_data:
        if field not in ['images', 'options']:
            setattr(product, field, update_data[field])

    if 'images' in update_data and product_in.images is not None:
        db.query(models.product.ProductImage).filter(models.product.ProductImage.product_id == id).delete()
        for img_in in product_in.images:
            db_img = models.product.ProductImage(
                product_id=id,
                url=img_in.url,
                alt_text=img_in.alt_text,
                is_primary=img_in.is_primary
            )
            db.add(db_img)
            
    if 'options' in update_data and product_in.options is not None:
        db.query(models.product.ProductOption).filter(models.product.ProductOption.product_id == id).delete()
        for opt_in in product_in.options:
            db_opt = models.product.ProductOption(
                product_id=id,
                name=opt_in.name
            )
            db.add(db_opt)
            db.flush()
            for val_in in opt_in.values:
                db_val = models.product.ProductOptionValue(
                    option_id=db_opt.id,
                    name=val_in.name,
                    price_modifier=val_in.price_modifier,
                    meta=val_in.meta,
                    image_url=val_in.image_url
                )
                db.add(db_val)
    
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{id}", response_model=schemas.product.Product)
def delete_product(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.user.User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Exclui um produto (soft delete - define is_active como False).
    """
    product = db.query(models.product.Product).filter(models.product.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    product.is_active = False
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/{slug}", response_model=schemas.product.Product)
def read_product_by_slug(
    slug: str,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Retorna um produto específico pelo slug.
    """
    product = db.query(models.product.Product).filter(
        models.product.Product.slug == slug,
        models.product.Product.is_active.is_(True),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product

