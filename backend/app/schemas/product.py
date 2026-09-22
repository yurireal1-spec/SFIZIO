from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductImageBase(BaseModel):
    url: str
    alt_text: Optional[str] = None
    is_primary: bool = False

class ProductImage(ProductImageBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductOptionValueBase(BaseModel):
    name: str
    price_modifier: Decimal = Decimal("0.00")
    meta: Optional[str] = None
    image_url: Optional[str] = None

class ProductOptionValue(ProductOptionValueBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductOptionBase(BaseModel):
    name: str

class ProductOption(ProductOptionBase):
    id: int
    values: List[ProductOptionValue]
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    slug: str
    description: str
    price: Decimal
    discount_price: Optional[Decimal] = None
    stock: int = 0
    is_active: bool = True
    category_id: int

class ProductOptionValueCreate(ProductOptionValueBase):
    pass

class ProductOptionCreate(ProductOptionBase):
    values: List[ProductOptionValueCreate] = []

class ProductCreate(ProductBase):
    images: List[ProductImageBase] = []
    options: List[ProductOptionCreate] = []

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    images: Optional[List[ProductImageBase]] = None
    options: Optional[List[ProductOptionCreate]] = None

class Product(ProductBase):
    id: int
    created_at: datetime
    category: Category
    images: List[ProductImage]
    options: List[ProductOption]
    model_config = ConfigDict(from_attributes=True)

class PaginatedProductList(BaseModel):
    items: List[Product]
    total: int
    page: int
    size: int
