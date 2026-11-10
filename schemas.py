from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ProductCreate(BaseModel):
    sku: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=160)
    category: str = "General"
    price: float = Field(ge=0)
    cost: float = Field(ge=0)
    stock: int = Field(ge=0)
    reorder_level: int = Field(ge=0, default=10)

class ProductOut(ProductCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class StockAdjustment(BaseModel):
    quantity: int = Field(gt=0)
    direction: str
    reason: str = "Manual adjustment"
