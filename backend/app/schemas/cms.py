from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class SiteSettingsBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SiteSettingsCreate(SiteSettingsBase):
    pass

class SiteSettingsUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None

class SiteSettings(SiteSettingsBase):
    id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Specialized schemas for common settings
class HeroSection(BaseModel):
    title: str
    subtitle: str
    description: str
    button_text: str
    image_url: str
