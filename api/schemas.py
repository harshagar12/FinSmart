from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserAuth(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TradeRequest(BaseModel):
    asset_id: str
    symbol: str
    name: str
    type: str
    qty: float
    current_price: float

class HoldingOut(BaseModel):
    assetId: str
    symbol: str
    name: str
    type: str
    quantity: float
    avgPrice: float
    currentPrice: Optional[float] = None
    purchaseDate: Optional[str] = None

class TransactionOut(BaseModel):
    id: str
    assetId: str
    symbol: str
    name: str
    quantity: float
    salePrice: Optional[float] = None
    avgPurchasePrice: Optional[float] = None
    profit: Optional[float] = None
    profitPercent: Optional[float] = None
    date: str
    type: str # 'buy' or 'sell'
