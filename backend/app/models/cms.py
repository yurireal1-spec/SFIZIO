from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.models.base import Base

class SiteSettings(Base):
    """
    Model for storing site-wide configuration like hero content and banners.
    This acts as a simple CMS.
    """
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False) # e.g., 'hero_section', 'main_banner'
    value = Column(Text, nullable=False) # JSON string or plain text
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
