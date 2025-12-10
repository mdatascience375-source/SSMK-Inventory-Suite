import { useEffect, useState } from "react";
import api from "../api";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch {
    user = null;
  }
  const isAdmin = user?.role === "admin";

  async function load() {
    const res = await api.get("/categories");
    setCategories(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.post("/categories", form);
    setForm({ name: "", description: "" });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Archive this category?")) return;
    await api.delete(`/categories/${id}`);
    load();
  }

  return (
    <div>
      <h2>Categories</h2>
      <div className="grid-2">
        <form onSubmit={handleSubmit} className="card form-card">
          <h3>Add Category</h3>
          {!isAdmin && (
            <p className="note-readonly">
              Only admin can add or archive categories. You are in read-only mode.
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
            Description
            <input
              type="text"
              value={form.description}
              disabled={!isAdmin}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={!isAdmin}>
            Save
          </button>
        </form>

        <div className="card">
          <h3>All Categories</h3>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.description}</td>
                  <td>
                    {isAdmin && (
                      <button
                        className="btn-danger btn-xs"
                        type="button"
                        onClick={() => handleDelete(c.id)}
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4}>No categories yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Categories;

