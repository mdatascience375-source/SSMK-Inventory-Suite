import { useEffect, useState } from "react";
import api from "../api";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    address: ""
  });

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch {
    user = null;
  }
  const isAdmin = user?.role === "admin";

  async function load() {
    const res = await api.get("/suppliers");
    setSuppliers(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.post("/suppliers", form);
    setForm({ name: "", phone: "", email: "", gstin: "", address: "" });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Archive this supplier?")) return;
    await api.delete(`/suppliers/${id}`);
    load();
  }

  return (
    <div>
      <h2>Suppliers</h2>
      <div className="grid-2">
        <form onSubmit={handleSubmit} className="card form-card">
          <h3>Add Supplier</h3>
          {!isAdmin && (
            <p className="note-readonly">
              Only admin can add or archive suppliers. You are in read-only mode.
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
            Phone
            <input
              type="text"
              value={form.phone}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            GSTIN
            <input
              type="text"
              value={form.gstin}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, gstin: e.target.value })}
            />
          </label>
          <label>
            Address
            <textarea
              value={form.address}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={!isAdmin}>
            Save
          </button>
        </form>

        <div className="card">
          <h3>All Suppliers</h3>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>GSTIN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.phone}</td>
                  <td>{s.email}</td>
                  <td>{s.gstin}</td>
                  <td>
                    {isAdmin && (
                      <button
                        className="btn-danger btn-xs"
                        type="button"
                        onClick={() => handleDelete(s.id)}
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={6}>No suppliers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Suppliers;

