from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
from sqlalchemy import func

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///inventory.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "change-this-secret-key"

db = SQLAlchemy(app)
CORS(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="staff")


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)


class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    gstin = db.Column(db.String(30))
    address = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"))
    brand = db.Column(db.String(100))
    model = db.Column(db.String(100))
    purchase_price = db.Column(db.Float, default=0.0)
    selling_price = db.Column(db.Float, default=0.0)
    tax_percent = db.Column(db.Float, default=0.0)
    warranty_months = db.Column(db.Integer, default=0)
    min_stock = db.Column(db.Integer, default=0)
    current_stock = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    category = db.relationship("Category", backref="products")


class StockMovement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    movement_type = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    reference_type = db.Column(db.String(20))
    reference_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", backref="movements")


class SaleInvoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(150))
    customer_phone = db.Column(db.String(20))
    total_amount = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    payment_mode = db.Column(db.String(20))  # Cash / UPI / Card / Other
    is_active = db.Column(db.Boolean, default=True)

    created_by = db.relationship("User")


class SaleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("sale_invoice.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)

    invoice = db.relationship("SaleInvoice", backref="items")
    product = db.relationship("Product")


def create_default_users():
    if User.query.count() == 0:
        admin = User(username="admin", password_hash=generate_password_hash("admin123"), role="admin")
        staff = User(username="staff", password_hash=generate_password_hash("staff123"), role="staff")
        db.session.add(admin)
        db.session.add(staff)
        db.session.commit()


with app.app_context():
    db.create_all()
    create_default_users()


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        if not token:
            return jsonify({"message": "Token missing"}), 401
        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            request.current_user = User.query.get(data["user_id"])
        except Exception:
            return jsonify({"message": "Invalid or expired token"}), 401
        return f(*args, **kwargs)
    return decorated


def roles_required(*roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = getattr(request, "current_user", None)
            if not user:
                return jsonify({"message": "Not authenticated"}), 401
            if user.role not in roles:
                return jsonify({"message": "Forbidden (insufficient role)"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(username=data["username"]).first()
    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401
    token = jwt.encode(
        {
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(hours=8),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )
    return jsonify({"token": token, "user": {"id": user.id, "username": user.username, "role": user.role}})


@app.route("/categories", methods=["POST"])
@token_required
@roles_required("admin")
def create_category():
    data = request.json
    c = Category(name=data["name"], description=data.get("description", ""))
    db.session.add(c)
    db.session.commit()
    return jsonify({"id": c.id, "name": c.name}), 201


@app.route("/categories", methods=["GET"])
@token_required
def list_categories():
    categories = Category.query.filter_by(is_active=True).all()
    return jsonify([{"id": c.id, "name": c.name, "description": c.description} for c in categories])


@app.route("/categories/<int:cat_id>", methods=["DELETE"])
@token_required
@roles_required("admin")
def delete_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    cat.is_active = False
    db.session.commit()
    return jsonify({"success": True})


@app.route("/suppliers", methods=["POST"])
@token_required
@roles_required("admin")
def create_supplier():
    data = request.json
    s = Supplier(
        name=data["name"],
        phone=data.get("phone"),
        email=data.get("email"),
        gstin=data.get("gstin"),
        address=data.get("address"),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify({"id": s.id}), 201


@app.route("/suppliers", methods=["GET"])
@token_required
def list_suppliers():
    suppliers = Supplier.query.filter_by(is_active=True).all()
    return jsonify(
        [
            {"id": s.id, "name": s.name, "phone": s.phone, "email": s.email, "gstin": s.gstin, "address": s.address}
            for s in suppliers
        ]
    )


@app.route("/suppliers/<int:supp_id>", methods=["DELETE"])
@token_required
@roles_required("admin")
def delete_supplier(supp_id):
    s = Supplier.query.get_or_404(supp_id)
    s.is_active = False
    db.session.commit()
    return jsonify({"success": True})


@app.route("/products", methods=["POST"])
@token_required
@roles_required("admin")
def create_product():
    data = request.json
    p = Product(
        name=data["name"],
        sku=data["sku"],
        category_id=data.get("category_id"),
        brand=data.get("brand"),
        model=data.get("model"),
        purchase_price=data.get("purchase_price", 0.0),
        selling_price=data.get("selling_price", 0.0),
        tax_percent=data.get("tax_percent", 0.0),
        warranty_months=data.get("warranty_months", 0),
        min_stock=data.get("min_stock", 0),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({"id": p.id}), 201


@app.route("/products", methods=["GET"])
@token_required
def list_products():
    products = Product.query.filter_by(is_active=True).all()
    return jsonify(
        [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "brand": p.brand,
                "category": p.category.name if p.category else None,
                "category_id": p.category_id,
                "current_stock": p.current_stock,
                "min_stock": p.min_stock,
            }
            for p in products
        ]
    )


@app.route("/products/<int:prod_id>", methods=["DELETE"])
@token_required
@roles_required("admin")
def delete_product(prod_id):
    p = Product.query.get_or_404(prod_id)
    p.is_active = False
    db.session.commit()
    return jsonify({"success": True})


def adjust_stock(product_id, quantity, movement_type, ref_type=None, ref_id=None):
    product = Product.query.filter_by(id=product_id, is_active=True).first()
    if not product:
        return False, "Product not found or inactive"
    if movement_type == "IN":
        product.current_stock += quantity
    else:
        if product.current_stock < quantity:
            return False, "Insufficient stock"
        product.current_stock -= quantity
    m = StockMovement(
        product_id=product_id,
        quantity=quantity,
        movement_type=movement_type,
        reference_type=ref_type,
        reference_id=ref_id,
    )
    db.session.add(m)
    db.session.commit()
    return True, "OK"


@app.route("/stock/in", methods=["POST"])
@token_required
@roles_required("admin")
def stock_in():
    d = request.json
    ok, msg = adjust_stock(d["product_id"], d["quantity"], "IN")
    return jsonify({"success": ok, "message": msg}), (200 if ok else 400)


@app.route("/stock/out", methods=["POST"])
@token_required
@roles_required("admin")
def stock_out():
    d = request.json
    ok, msg = adjust_stock(d["product_id"], d["quantity"], "OUT")
    return jsonify({"success": ok, "message": msg}), (200 if ok else 400)


@app.route("/stock/low", methods=["GET"])
@token_required
def low_stock():
    items = Product.query.filter(Product.is_active == True, Product.current_stock <= Product.min_stock).all()
    return jsonify(
        [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "current_stock": p.current_stock,
                "min_stock": p.min_stock,
                "category_id": p.category_id,
                "category": p.category.name if p.category else None,
            }
            for p in items
        ]
    )


@app.route("/sales/invoices", methods=["POST"])
@token_required
def create_invoice():
    data = request.json
    items = data.get("items", [])
    if not items:
        return jsonify({"message": "No items added"}), 400
    invoice = SaleInvoice(
        customer_name=data.get("customer_name"),
        customer_phone=data.get("customer_phone"),
        payment_mode=data.get("payment_mode"),
        created_by_user_id=request.current_user.id,
        total_amount=0.0,
    )
    db.session.add(invoice)
    db.session.commit()
    total = 0.0
    for it in items:
        product = Product.query.filter_by(id=it["product_id"], is_active=True).first()
        qty = it["quantity"]
        if not product:
            return jsonify({"message": "Invalid or inactive product"}), 400
        if product.current_stock < qty:
            return jsonify({"message": f"Insufficient stock for {product.name}"}), 400
        adjust_stock(product.id, qty, "OUT", ref_type="SALE", ref_id=invoice.id)
        line_total = product.selling_price * qty
        item = SaleItem(
            invoice_id=invoice.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.selling_price,
            total_amount=line_total,
        )
        db.session.add(item)
        total += line_total
    invoice.total_amount = total
    db.session.commit()
    return jsonify({"success": True, "invoice_id": invoice.id}), 201


@app.route("/sales/invoices", methods=["GET"])
@token_required
def list_invoices():
    invoices = SaleInvoice.query.filter_by(is_active=True).order_by(SaleInvoice.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": inv.id,
                "customer_name": inv.customer_name,
                "total_amount": inv.total_amount,
                "created_at": inv.created_at.strftime("%Y-%m-%d %H:%M"),
                "payment_mode": inv.payment_mode,
            }
            for inv in invoices
        ]
    )


@app.route("/sales/invoices/<int:inv_id>", methods=["GET"])
@token_required
def get_invoice(inv_id):
    inv = SaleInvoice.query.get_or_404(inv_id)
    if not inv.is_active:
        return jsonify({"message": "Invoice archived"}), 404
    return jsonify(
        {
            "id": inv.id,
            "customer_name": inv.customer_name,
            "customer_phone": inv.customer_phone,
            "created_at": inv.created_at.isoformat(),
            "total_amount": inv.total_amount,
            "payment_mode": inv.payment_mode,
            "items": [
                {
                    "product_name": it.product.name,
                    "product_sku": it.product.sku,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total": it.total_amount,
                }
                for it in inv.items
            ],
        }
    )


@app.route("/sales/invoices/<int:inv_id>", methods=["DELETE"])
@token_required
@roles_required("admin")
def delete_invoice(inv_id):
    inv = SaleInvoice.query.get_or_404(inv_id)
    inv.is_active = False
    db.session.commit()
    return jsonify({"success": True})


@app.route("/reports/sales/daily", methods=["GET"])
@token_required
def sales_daily():
    days = int(request.args.get("days", 30))
    start = date.today() - timedelta(days=days - 1)
    rows = (
        db.session.query(
            func.date(SaleInvoice.created_at).label("day"),
            func.sum(SaleInvoice.total_amount),
        )
        .filter(SaleInvoice.is_active == True, SaleInvoice.created_at >= start)
        .group_by(func.date(SaleInvoice.created_at))
        .order_by(func.date(SaleInvoice.created_at))
        .all()
    )
    return jsonify([{"date": d.strftime("%Y-%m-%d"), "total_amount": float(t or 0)} for d, t in rows])


@app.route("/reports/sales/monthly", methods=["GET"])
@token_required
def sales_monthly():
    rows = (
        db.session.query(
            func.strftime("%Y-%m", SaleInvoice.created_at),
            func.sum(SaleInvoice.total_amount),
        )
        .filter(SaleInvoice.is_active == True)
        .group_by(func.strftime("%Y-%m", SaleInvoice.created_at))
        .all()
    )
    return jsonify([{"month": m, "total_amount": float(t or 0)} for m, t in rows])


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
