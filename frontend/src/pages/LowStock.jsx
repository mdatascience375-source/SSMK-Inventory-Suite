import { useEffect, useState } from "react";
import api from "../api";

function LowStock() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
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
    const res = await api.get("/stock/low");
    const catRes = await api.get("/categories");
    setItems(res.data);
    setCategories(catRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Archive this product?")) return;
    await api.delete(`/products/${id}`);
    load();
  }

  const filteredItems = filterCategoryId
    ? items.filter(p => String(p.category_id) === String(filterCategoryId))
    : items;

  return (
    <div>
      <h2>Low Stock Items</h2>
      <p style={{ color: "#9ca3af", marginTop: "0.25rem" }}>
        Items where available stock is less than or equal to minimum stock.
      </p>
      <div className="card">
        <div className="card-header-row">
          <h3>Low Stock List</h3>
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
              <th>Category</th>
              <th>Current Stock</th>
              <th>Minimum Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.sku}</td>
                <td>{p.name}</td>
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
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7}>No low stock items for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LowStock;

