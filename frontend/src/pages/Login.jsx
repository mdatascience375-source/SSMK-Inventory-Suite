import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setMessage(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="logo-circle">
          <span>SSMK</span>
        </div>
        <h1 className="login-title">SSMK Management Software</h1>
        <p className="login-subtitle">
          Smart Stock & Billing solution for your electronics shop. Secure, fast and easy to use.
        </p>
        <ul className="login-bullets">
          <li>Role-based access (Admin / Staff)</li>
          <li>Live stock tracking & low-stock alerts</li>
          <li>Multi-item invoices with PDF download</li>
          <li>Daily & monthly sales reports</li>
        </ul>
      </div>

      <div className="login-card">
        <h2>Sign in</h2>
        <p className="login-caption">Use your SSMK account to continue</p>
        {message && <div className="alert">{message}</div>}
        <form onSubmit={handleSubmit} className="form-card">
          <label>
            Username
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="admin or staff"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn-primary" style={{ marginTop: "0.75rem" }}>
            Login
          </button>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#9ca3af" }}>
            Demo accounts: <strong>admin / admin123</strong> or <strong>staff / staff123</strong>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;

