import os
import sqlite3
from flask import Flask, jsonify, request
from werkzeug.exceptions import BadRequest

app = Flask(__name__)
DB_PATH = os.environ.get("DB_PATH", "app.sqlite")

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, sku TEXT NOT NULL UNIQUE, category TEXT, price REAL NOT NULL, stock INTEGER NOT NULL DEFAULT 0, description TEXT
        )""")

def rows(sql, params=()):
    with connect() as db:
        return [dict(r) for r in db.execute(sql, params).fetchall()]

def row(sql, params=()):
    with connect() as db:
        r = db.execute(sql, params).fetchone()
        return dict(r) if r else None

def body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise BadRequest("Request body must be a JSON object")
    return data

@app.errorhandler(BadRequest)
def bad_request(err):
    return jsonify({"error": str(err.description)}), 400

@app.get("/api/products/health")
def health():
    return jsonify({"service": "Product Service", "status": "healthy"})

@app.get("/api/products")
def list_items():
    return jsonify(rows("SELECT * FROM products ORDER BY id DESC"))

@app.get("/api/products/<int:item_id>")
def get_item(item_id):
    item = row("SELECT * FROM products WHERE id=?", (item_id,))
    if not item:
        return jsonify({"error": "Record not found"}), 404
    return jsonify(item)

@app.post("/api/products")
def create_item():
    data = body()
    try:
        values = [data[k] for k in ['name', 'sku', 'category', 'price', 'stock', 'description']]
    except KeyError as exc:
        return jsonify({"error": f"Missing field: {exc.args[0]}"}), 400
    with connect() as db:
        cur = db.execute("INSERT INTO products (name, sku, category, price, stock, description) VALUES (?, ?, ?, ?, ?, ?)", values)
        item_id = cur.lastrowid
    return jsonify(row("SELECT * FROM products WHERE id=?", (item_id,))), 201

@app.put("/api/products/<int:item_id>")
def update_item(item_id):
    data = body()
    existing = row("SELECT * FROM products WHERE id=?", (item_id,))
    if not existing:
        return jsonify({"error": "Record not found"}), 404
    merged = {**existing, **data}
    values = [merged[k] for k in ['name', 'sku', 'category', 'price', 'stock', 'description']]
    with connect() as db:
        db.execute("UPDATE products SET name=?, sku=?, category=?, price=?, stock=?, description=? WHERE id=?", values + [item_id])
    return jsonify(row("SELECT * FROM products WHERE id=?", (item_id,)))

@app.delete("/api/products/<int:item_id>")
def delete_item(item_id):
    with connect() as db:
        cur = db.execute("DELETE FROM products WHERE id=?", (item_id,))
    if cur.rowcount == 0:
        return jsonify({"error": "Record not found"}), 404
    return jsonify({"message": "Deleted successfully"})

init_db()
