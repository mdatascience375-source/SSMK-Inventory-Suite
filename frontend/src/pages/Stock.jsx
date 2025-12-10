import { useEffect, useState } from "react";
import api from "../api";

function Stock() {
  const [products, setProducts] = useState([]);
  const [formIn, setFormIn] = useState({ product_id: "", quantity: "" });
  const [formOut, setFormOut] = useState({ product_id: "", quantity: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const res = await api.get("/products");
    setProducts(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleIn(e) {
    e.preventDefault();
    if (!formIn.product_id || !formIn.quantity) return;
    const res = await api.post("/stock/in", {
      product_id: Number(formIn.product_id),
      quantity: Number(formIn.quantity)
    });
    setMessage(res.data.message);
    setFormIn({ product_id: "", quantity: "" });
    load();
  }

  async function handleOut(e) {
    e.preventDefault();
    if (!formOut.product_id || !formOut.quantity) return;
    try {
      const res = await api.post("/stock/out", {
        product_id: Number(formOut.product_id),
        quantity: Number(formOut.quantity)
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
    setFormOut({ product_id: "", quantity: "" });
    load();
  }

  return (
    <div>
      <h2>Stock In / Out (Admin only)</h2>
      {message && <div className="alert">{message}</div>}
      <div className="grid-2">
        <form onSubmit={handleIn} className="card form-card">
          <h3>Stock In</h3>
          <label>
            Product
            <select
              value={formIn.product_id}
              onChange={e =>
                setFormIn({ ...formIn, product_id: e.target.value })
              }
            >
              <option value="">Select</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              value={formIn.quantity}
              onChange={e =>
                setFormIn({ ...formIn, quantity: e.target.value })
              }
            />
          </label>
          <button type="submit" className="btn-primary">
            Add Stock
          </button>
        </form>

        <form onSubmit={handleOut} className="card form-card">
          <h3>Stock Out</h3>
          <label>
            Product
            <select
              value={formOut.product_id}
              onChange={e =>
                setFormOut({ ...formOut, product_id: e.target.value })
              }
            >
              <option value="">Select</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              value={formOut.quantity}
              onChange={e =>
                setFormOut({ ...formOut, quantity: e.target.value })
              }
            />
          </label>
          <button type="submit" className="btn-danger">
            Reduce Stock
          </button>
        </form>
      </div>
    </div>
  );
}

export default Stock;

