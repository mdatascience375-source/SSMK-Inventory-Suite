import { useEffect, useState } from "react";
import api from "../api";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    brand: "",
    model: "",
    purchase_price: "",
    selling_price: "",
    tax_percent: "",
    warranty_months: "",
    min_stock: ""
  });
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch {
    user = null;
  }
  const isAdmin = user?.role === "admin";

  async function load() {
    const proRes = await api.get("/products");
    const catRes = await api.get("/categories");
    setProducts(proRes.data);
    setCategories(catRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) return;
    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      purchase_price: Number(form.purchase_price || 0),
      selling_price: Number(form.selling_price || 0),
      tax_percent: Number(form.tax_percent || 0),
      warranty_months: Number(form.warranty_months || 0),
      min_stock: Number(form.min_stock || 0)
    };
    await api.post("/products", payload);
    setForm({
      name: "",
      sku: "",
      category_id: "",
      brand: "",
      model: "",
      purchase_price: "",
      selling_price: "",
      tax_percent: "",
      warranty_months: "",
      min_stock: ""
    });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Archive this product?")) return;
    await api.delete(`/products/${id}`);
    load();
  }

  const filteredProducts = filterCategoryId
    ? products.filter(p => String(p.category_id) === String(filterCategoryId))
    : products;

  return (
    <div>
      <h2>Products</h2>
      <p style={{ color: "#9ca3af", marginTop: "0.25rem" }}>
        Add items and filter by category to focus on a specific segment.
      </p>
      <div className="grid-2">
        <form onSubmit={handleSubmit} className="card form-card">
          <h3>Add Product</h3>
          {!isAdmin && (
            <p className="note-readonly">
              Only admin can add or archive products. You are in read-only mode.
            </p>
          )}
          <label>
            Name
            <input
              type="text"
              value={form.name}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            SKU/Code
            <input
              type="text"
              value={form.sku}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, sku: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={form.category_id}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Select</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Brand
            <input
              type="text"
              value={form.brand}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, brand: e.target.value })}
            />
          </label>
          <label>
            Model
            <input
              type="text"
              value={form.model}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, model: e.target.value })}
            />
          </label>
          <label>
            Purchase Price
            <input
              type="number"
              value={form.purchase_price}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, purchase_price: e.target.value })}
            />
          </label>
          <label>
            Selling Price
            <input
              type="number"
              value={form.selling_price}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, selling_price: e.target.value })}
            />
          </label>
          <label>
            Tax %
            <input
              type="number"
              value={form.tax_percent}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, tax_percent: e.target.value })}
            />
          </label>
          <label>
            Warranty (months)
            <input
              type="number"
              value={form.warranty_months}
              disabled={!isAdmin}
              onChange={e =>
                setForm({ ...form, warranty_months: e.target.value })
              }
            />
          </label>
          <label>
            Minimum Stock
            <input
              type="number"
              value={form.min_stock}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, min_stock: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={!isAdmin}>
            Save
          </button>
        </form>

        <div className="card">
          <div className="card-header-row">
            <h3>All Products</h3>
            <div className="filter-row">
              <span className="filter-label">Filter by category:</span>
              <select
                value={filterCategoryId}
                onChange={e => setFilterCategoryId(e.target.value)}
              >
                <option value="">All</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Min</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>{p.category}</td>
                  <td>{p.current_stock}</td>
                  <td>{p.min_stock}</td>
                  <td>
                    {isAdmin && (
                      <button
                        className="btn-danger btn-xs"
                        type="button"
                        onClick={() => handleDelete(p.id)}
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8}>No products for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;

