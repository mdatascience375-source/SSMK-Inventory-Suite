import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch {
    user = null;
  }
  const role = user?.role;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">SSMK</div>
        <div className="sidebar-subtitle">Inventory Suite</div>
      </div>
      <nav className="nav-links">
        <NavLink to="/dashboard" className="nav-link">
          Dashboard
        </NavLink>
        <NavLink to="/products" className="nav-link">
          Products
        </NavLink>
        <NavLink to="/suppliers" className="nav-link">
          Suppliers
        </NavLink>
        <NavLink to="/categories" className="nav-link">
          Categories
        </NavLink>
        {role === "admin" && (
          <NavLink to="/stock" className="nav-link">
            Stock In/Out
          </NavLink>
        )}
        <NavLink to="/low-stock" className="nav-link">
          Low Stock
        </NavLink>
        <NavLink to="/sales" className="nav-link">
          Sales
        </NavLink>
        <NavLink to="/reports" className="nav-link">
          Sales Reports
        </NavLink>
      </nav>
      <button className="btn-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;

