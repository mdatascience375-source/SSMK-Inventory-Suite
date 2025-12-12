import { useEffect, useState } from "react";
import api from "../api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function Dashboard() {
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    lowStockCount: 0,
    totalCategories: 0,
    totalStock: 0,
    recentSales: [],
    topProducts: []
  });
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, suppliersRes, lowStockRes, categoriesRes, salesRes] = await Promise.all([
          api.get("/products"),
          api.get("/suppliers"),
          api.get("/stock/low"),
          api.get("/categories"),
          api.get("/reports/sales/daily?days=7")
        ]);

        const products = productsRes.data;
        const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
        
        // Get recent sales
        const invoicesRes = await api.get("/sales/invoices");
        const recentSales = invoicesRes.data.slice(0, 5);

        setSummary({
          totalProducts: products.length,
          totalSuppliers: suppliersRes.data.length,
          lowStockCount: lowStockRes.data.length,
          totalCategories: categoriesRes.data.length,
          totalStock,
          recentSales,
          topProducts: products.slice(0, 5)
        });

        setSalesData(salesRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setLoading(false);
      }
    }
    load();
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const categoryData = [
    { name: 'Products', value: summary.totalProducts },
    { name: 'Suppliers', value: summary.totalSuppliers },
    { name: 'Categories', value: summary.totalCategories }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: "#9ca3af", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            📊 Real-time overview of your inventory and business metrics
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="cards-row">
        <div className="card card-glow">
          <div className="stats-card">
            <div className="stats-icon blue">📦</div>
            <div className="stats-content">
              <div className="card-label">Total Products</div>
              <div className="card-value">{summary.totalProducts}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                {summary.totalStock} items in stock
              </div>
            </div>
          </div>
        </div>

        <div className="card card-glow">
          <div className="stats-card">
            <div className="stats-icon green">🏪</div>
            <div className="stats-content">
              <div className="card-label">Total Suppliers</div>
              <div className="card-value">{summary.totalSuppliers}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                Active partnerships
              </div>
            </div>
          </div>
        </div>

        <div className="card card-warning">
          <div className="stats-card">
            <div className="stats-icon orange">⚠️</div>
            <div className="stats-content">
              <div className="card-label">Low Stock Items</div>
              <div className="card-value">{summary.lowStockCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#fb923c', marginTop: '0.25rem' }}>
                {summary.lowStockCount > 0 ? 'Requires attention' : 'All good!'}
              </div>
            </div>
          </div>
        </div>

        <div className="card card-glow">
          <div className="stats-card">
            <div className="stats-icon blue">📑</div>
            <div className="stats-content">
              <div className="card-label">Categories</div>
              <div className="card-value">{summary.totalCategories}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                Product types
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📈 Sales Trend (Last 7 Days)</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📊 Inventory Distribution</h3>
          <div style={{ width: '100%', height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🛒 Recent Sales</h3>
          {summary.recentSales.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {summary.recentSales.map((sale) => (
                <div 
                  key={sale.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(99, 102, 241, 0.1)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#f9fafb' }}>
                      {sale.customer_name || 'Walk-in Customer'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                      {sale.created_at}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1.1rem' }}>
                      ₹{Number(sale.total_amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {sale.payment_mode || 'Cash'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">No recent sales</div>
              <div className="empty-state-subtext">Sales will appear here</div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>⭐ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a 
              href="/sales" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                textDecoration: 'none',
                color: '#f9fafb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                fontSize: '1.25rem'
              }}>
                🧾
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>Create Invoice</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Start a new sale</div>
              </div>
            </a>

            <a 
              href="/products" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textDecoration: 'none',
                color: '#f9fafb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                fontSize: '1.25rem'
              }}>
                ➕
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>Add Product</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Expand inventory</div>
              </div>
            </a>

            <a 
              href="/low-stock" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(249, 115, 22, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                textDecoration: 'none',
                color: '#f9fafb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(249, 115, 22, 0.2)',
                borderRadius: '8px',
                fontSize: '1.25rem'
              }}>
                ⚠️
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>Check Low Stock</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  {summary.lowStockCount} items need attention
                </div>
              </div>
            </a>

            <a 
              href="/reports" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                textDecoration: 'none',
                color: '#f9fafb',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                fontSize: '1.25rem'
              }}>
                📊
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>View Reports</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Analyze performance</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
