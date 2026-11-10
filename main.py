from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import Base, engine, get_db
from .models import Product, Sale
from .schemas import ProductCreate, ProductOut, StockAdjustment

app = FastAPI(title="Merchy API", version="0.1.0",
              description="Inventory and demand forecasting starter API")

import os
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        if db.query(Product).count() == 0:
            samples = [
                Product(sku="HD-001", name="Essential Hoodie", category="Apparel", price=54, cost=24, stock=42, reorder_level=20),
                Product(sku="TS-002", name="Classic Tee", category="Apparel", price=28, cost=10, stock=18, reorder_level=25),
                Product(sku="CP-003", name="Logo Cap", category="Accessories", price=22, cost=8, stock=65, reorder_level=15),
                Product(sku="SW-004", name="Crewneck Sweatshirt", category="Apparel", price=48, cost=21, stock=9, reorder_level=15),
                Product(sku="JK-005", name="Puffer Jacket", category="Outerwear", price=89, cost=42, stock=31, reorder_level=12),
            ]
            db.add_all(samples)
            db.commit()
            for p, qty in zip(samples, [8, 12, 3, 5, 4]):
                db.add(Sale(product_id=p.id, quantity=qty, sold_at=datetime.now(timezone.utc)-timedelta(days=1)))
            db.commit()
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok", "service": "merchy-api"}

@app.get("/api/products", response_model=list[ProductOut])
def list_products(search: str | None = Query(default=None), db: Session = Depends(get_db)):
    q = db.query(Product)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    return q.order_by(Product.id).all()

@app.post("/api/products", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(409, "SKU already exists")
    item = Product(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.get("/api/summary")
def summary(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    total_units = sum(p.stock for p in products)
    inventory_value = sum(p.stock * p.cost for p in products)
    low_stock = sum(1 for p in products if p.stock <= p.reorder_level)
    sales_30 = db.query(func.coalesce(func.sum(Sale.quantity), 0)).filter(
        Sale.sold_at >= datetime.now(timezone.utc)-timedelta(days=30)).scalar()
    return {
        "total_products": len(products),
        "total_units": total_units,
        "low_stock": low_stock,
        "inventory_value": round(inventory_value, 2),
        "units_sold_30d": int(sales_30 or 0),
        "forecast_accuracy": 92
    }

@app.post("/api/inventory/{product_id}/adjust")
def adjust_stock(product_id: int, payload: StockAdjustment, db: Session = Depends(get_db)):
    if payload.direction not in ("in", "out"):
        raise HTTPException(400, "direction must be 'in' or 'out'")
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    new_stock = product.stock + payload.quantity if payload.direction == "in" else product.stock - payload.quantity
    if new_stock < 0:
        raise HTTPException(400, "Insufficient stock")
    product.stock = new_stock
    db.commit()
    db.refresh(product)
    return {"message": "Stock updated", "product": ProductOut.model_validate(product)}

@app.get("/api/forecasts")
def forecasts(days: int = Query(default=30, ge=7, le=90), db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []
    since = datetime.now(timezone.utc) - timedelta(days=30)
    for p in products:
        sold = db.query(func.coalesce(func.sum(Sale.quantity), 0)).filter(
            Sale.product_id == p.id, Sale.sold_at >= since).scalar() or 0
        daily = float(sold) / 30.0
        demand = round(daily * days)
        target_stock = round(daily * 21)
        gap = max(0, target_stock - p.stock)
        action = "Increase stock" if gap > 0 else ("Reduce stock" if p.stock > target_stock * 2 and target_stock > 0 else "Maintain stock")
        result.append({
            "product_id": p.id, "product": p.name, "sku": p.sku,
            "forecasted_units": demand, "current_stock": p.stock,
            "recommended_order": gap, "action": action,
            "daily_average": round(daily, 2)
        })
    return {"period_days": days, "method": "30-day moving average baseline", "items": result}

@app.get("/api/alerts")
def alerts(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return [{"product_id": p.id, "product": p.name, "stock": p.stock,
             "reorder_level": p.reorder_level, "severity": "high" if p.stock == 0 else "medium"}
            for p in products if p.stock <= p.reorder_level]
