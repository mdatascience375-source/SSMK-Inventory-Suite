import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import Stock from "./pages/Stock";
import LowStock from "./pages/LowStock";
import Sales from "./pages/Sales";
import SalesReports from "./pages/SalesReports";
import Login from "./pages/Login";

function RequireAuth({ children }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/dashboard" />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/products"
          element={
            <RequireAuth>
              <Products />
            </RequireAuth>
          }
        />
        <Route
          path="/suppliers"
          element={
            <RequireAuth>
              <Suppliers />
            </RequireAuth>
          }
        />
        <Route
          path="/categories"
          element={
            <RequireAuth>
              <Categories />
            </RequireAuth>
          }
        />
        <Route
          path="/stock"
          element={
            <RequireAuth>
              <Stock />
            </RequireAuth>
          }
        />
        <Route
          path="/low-stock"
          element={
            <RequireAuth>
              <LowStock />
            </RequireAuth>
          }
        />
        <Route
          path="/sales"
          element={
            <RequireAuth>
              <Sales />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <SalesReports />
            </RequireAuth>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;

