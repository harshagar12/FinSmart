from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    wallet_balance = Column(Float, default=100000.0)
    created_at = Column(DateTime, default=func.now())

    transactions = relationship("Transaction", back_populates="user")
    holdings = relationship("Holding", back_populates="user")
    portfolio_snapshots = relationship("PortfolioSnapshot", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    asset_id = Column(String(100), nullable=False)
    symbol = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    
    qty = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    # For SELL transactions: stores the avg cost basis at the time of sale so profit = (price - avg_cost) * qty
    avg_cost_at_sale = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=False)
    transaction_type = Column(String(10), nullable=False) # 'buy' or 'sell'
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="transactions")

class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    asset_id = Column(String(100), nullable=False)
    symbol = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    
    quantity = Column(Float, default=0.0)
    avg_price = Column(Float, default=0.0)

    user = relationship("User", back_populates="holdings")

class PortfolioSnapshot(Base):
    """Stores periodic portfolio value snapshots for the performance chart."""
    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="portfolio_snapshots")
