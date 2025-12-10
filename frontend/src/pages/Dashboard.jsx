import { useEffect, useState } from "react";
import api from "../api";

function Dashboard() {
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    lowStockCount: 0
  });

  useEffect(() => {
    async function load() {
      const productsRes = await api.get("/products");
      const suppliersRes = await api.get("/suppliers");
      const lowStockRes = await api.get("/stock/low");
      setSummary({
        totalProducts: productsRes.data.length,
        totalSuppliers: suppliersRes.data.length,
        lowStockCount: lowStockRes.data.length
      });
    }
    load();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p style={{ color: "#9ca3af", marginTop: "0.25rem" }}>
        Quick overview of your shop inventory and suppliers.
      </p>
      <div className="cards-row">
        <div className="card card-glow">
          <div className="card-label">Total Products</div>
          <div className="card-value">{summary.totalProducts}</div>
        </div>
        <div className="card card-glow">
          <div className="card-label">Total Suppliers</div>
          <div className="card-value">{summary.totalSuppliers}</div>
        </div>
        <div className="card card-warning">
          <div className="card-label">Low Stock Items</div>
          <div className="card-value">{summary.lowStockCount}</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

