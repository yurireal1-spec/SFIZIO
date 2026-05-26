from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Category(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)

    products = relationship("Product", back_populates="category")

class Product(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    discount_price = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    category_id = Column(Integer, ForeignKey("category.id"))
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    options = relationship("ProductOption", back_populates="product", cascade="all, delete-orphan")

class ProductOption(Base):
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.id"))
    name = Column(String(100), nullable=False) # e.g., "Cor", "Tecido", "Material"
    
    product = relationship("Product", back_populates="options")
    values = relationship("ProductOptionValue", back_populates="option", cascade="all, delete-orphan")

class ProductOptionValue(Base):
    __tablename__ = "productoptionvalue"

    id = Column(Integer, primary_key=True, index=True)
    option_id = Column(Integer, ForeignKey("productoption.id", ondelete="CASCADE"))
    name = Column(String, index=True)
    price_modifier = Column(Float, default=0.0)
    meta = Column(String, nullable=True) # Pode ser HEX color code ou pequena thumb
    image_url = Column(String, nullable=True) # Foto completa vinculada a esta variação
    
    option = relationship("ProductOption", back_populates="values")

class ProductImage(Base):
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.id"))
    url = Column(String(255), nullable=False)
    alt_text = Column(String(255), nullable=True)
    is_primary = Column(Boolean, default=False)

    product = relationship("Product", back_populates="images")
