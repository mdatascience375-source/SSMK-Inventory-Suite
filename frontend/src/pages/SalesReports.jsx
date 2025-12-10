import { useEffect, useState } from "react";
import api from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

function SalesReports() {
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    loadDaily(range);
    loadMonthly();
  }, [range]);

  const loadDaily = async d => {
    const res = await api.get(`/reports/sales/daily?days=${d}`);
    setDaily(res.data);
  };

  const loadMonthly = async () => {
    const res = await api.get("/reports/sales/monthly");
    setMonthly(res.data);
  };

  return (
    <div>
      <h2>Sales Reports</h2>
      <div className="cards-row">
        <div className="card">
          <div className="card-label">Daily Sales (₹)</div>
          <div style={{ marginTop: "0.5rem" }}>
            <select
              value={range}
              onChange={e => setRange(Number(e.target.value))}
              style={{ padding: "0.25rem 0.5rem", borderRadius: "0.5rem" }}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div style={{ width: "100%", height: 260, marginTop: "0.5rem" }}>
            <ResponsiveContainer>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total_amount" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-label">Monthly Sales (₹)</div>
          <div style={{ width: "100%", height: 260, marginTop: "0.5rem" }}>
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesReports;

