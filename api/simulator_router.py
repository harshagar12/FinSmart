import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db, Base, engine, run_migrations
from models import User, Transaction, Holding, PortfolioSnapshot
from schemas import UserAuth, TokenResponse, TradeRequest, HoldingOut, TransactionOut
from auth import hash_password, verify_password, create_access_token, get_current_user

# Create new tables and safely migrate existing ones
Base.metadata.create_all(bind=engine)
run_migrations()

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

@router.post("/register", response_model=TokenResponse)
def register(data: UserAuth, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        wallet_balance=100000.0
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "wallet_balance": user.wallet_balance,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(data: UserAuth, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "wallet_balance": user.wallet_balance,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "wallet_balance": current_user.wallet_balance,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.post("/buy")
def buy_asset(req: TradeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_cost = req.qty * req.current_price
    if current_user.wallet_balance < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Deduct wallet
    current_user.wallet_balance -= total_cost

    # Update Holding
    holding = db.query(Holding).filter(Holding.user_id == current_user.id, Holding.asset_id == req.asset_id).first()
    if holding:
        new_qty = holding.quantity + req.qty
        holding.avg_price = ((holding.avg_price * holding.quantity) + total_cost) / new_qty
        holding.quantity = new_qty
    else:
        holding = Holding(
            user_id=current_user.id,
            asset_id=req.asset_id,
            symbol=req.symbol,
            name=req.name,
            type=req.type,
            quantity=req.qty,
            avg_price=req.current_price
        )
        db.add(holding)

    # Record Transaction
    tx = Transaction(
        user_id=current_user.id,
        asset_id=req.asset_id,
        symbol=req.symbol,
        name=req.name,
        type=req.type,
        qty=req.qty,
        price=req.current_price,
        avg_cost_at_sale=None,  # Not relevant for buy
        total_amount=total_cost,
        transaction_type="buy"
    )
    db.add(tx)
    db.commit()

    return {"message": f"Successfully bought {req.qty} {req.symbol}", "new_balance": current_user.wallet_balance}

@router.post("/sell")
def sell_asset(req: TradeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    holding = db.query(Holding).filter(Holding.user_id == current_user.id, Holding.asset_id == req.asset_id).first()
    if not holding or holding.quantity < req.qty:
        raise HTTPException(status_code=400, detail="Insufficient holdings to sell")

    # Capture the avg buy price BEFORE modifying holding — this is the cost basis for profit calculation
    avg_cost_basis = holding.avg_price

    total_proceeds = req.qty * req.current_price
    profit = (req.current_price - avg_cost_basis) * req.qty
    
    # Add to wallet
    current_user.wallet_balance += total_proceeds

    # Update Holding
    holding.quantity -= req.qty
    if holding.quantity <= 0.000001:
        db.delete(holding)

    # Record Transaction — store avg_cost_at_sale so the history endpoint can return real profit
    tx = Transaction(
        user_id=current_user.id,
        asset_id=req.asset_id,
        symbol=req.symbol,
        name=req.name,
        type=req.type,
        qty=req.qty,
        price=req.current_price,
        avg_cost_at_sale=avg_cost_basis,
        total_amount=total_proceeds,
        transaction_type="sell"
    )
    db.add(tx)
    db.commit()

    return {
        "message": f"Successfully sold {req.qty} {req.symbol}",
        "new_balance": current_user.wallet_balance,
        "profit": profit
    }

@router.get("/portfolio", response_model=List[HoldingOut])
def get_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    holdings = db.query(Holding).filter(Holding.user_id == current_user.id).all()
    return [
        HoldingOut(
            assetId=h.asset_id,
            symbol=h.symbol,
            name=h.name,
            type=h.type,
            quantity=h.quantity,
            avgPrice=h.avg_price,
            purchaseDate="Multiple"
        ) for h in holdings
    ]

@router.get("/history", response_model=List[TransactionOut])
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.created_at.desc()).all()
    out = []
    for t in txs:
        if t.transaction_type == "sell":
            avg_cost = t.avg_cost_at_sale or 0.0
            profit = (t.price - avg_cost) * t.qty
            profit_pct = ((t.price - avg_cost) / avg_cost * 100) if avg_cost > 0 else 0.0
            out.append(TransactionOut(
                id=str(t.id),
                assetId=t.asset_id,
                symbol=t.symbol,
                name=t.name,
                quantity=t.qty,
                salePrice=t.price,
                avgPurchasePrice=avg_cost,
                profit=profit,
                profitPercent=profit_pct,
                date=t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                type=t.transaction_type
            ))
        else:
            out.append(TransactionOut(
                id=str(t.id),
                assetId=t.asset_id,
                symbol=t.symbol,
                name=t.name,
                quantity=t.qty,
                salePrice=None,
                avgPurchasePrice=t.price,
                profit=None,
                profitPercent=None,
                date=t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                type=t.transaction_type
            ))
    return out

# ─── Portfolio Snapshot endpoints (persistent performance chart) ────────────

class SnapshotIn(BaseModel):
    value: float

class SnapshotOut(BaseModel):
    time: str
    value: float

@router.post("/snapshots", response_model=SnapshotOut)
def add_snapshot(body: SnapshotIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    snap = PortfolioSnapshot(user_id=current_user.id, value=body.value)
    db.add(snap)
    db.commit()
    db.refresh(snap)
    return SnapshotOut(
        time=snap.recorded_at.strftime("%H:%M"),
        value=snap.value
    )

@router.get("/snapshots", response_model=List[SnapshotOut])
def get_snapshots(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    snaps = (
        db.query(PortfolioSnapshot)
        .filter(PortfolioSnapshot.user_id == current_user.id)
        .order_by(PortfolioSnapshot.recorded_at.asc())
        .all()
    )
    if not snaps:
        # Seed the baseline
        return [SnapshotOut(time="Start", value=100000.0)]
    return [SnapshotOut(time=s.recorded_at.strftime("%H:%M"), value=s.value) for s in snaps]
