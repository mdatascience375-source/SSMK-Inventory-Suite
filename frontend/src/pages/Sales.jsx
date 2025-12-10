import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import api from "../api";

const COMPANY_INFO = {
  legalName: "SSMK",
  shopName: "Shree Shyam Mobile and Laptop Repair",
  ownerName: "Sonu Verma",
  contactNumber: "+91 8871315143",
  addressLine1: "in front of VIT Main gate besides MPH",
  addressLine2: "Kothri Kalan, Sehore, Madhya Pradesh, 466114",
  email: "manishyad375@gmail.com",
  note: "Goods once sold will not be taken back. Please keep this bill for warranty.",
  legalLine: "All legal matters are to Sehore jurisdiction only."
};

function Sales() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    payment_mode: "Cash",
    items: [{ product_id: "", quantity: "" }]
  });
  const [message, setMessage] = useState("");

  async function loadProductsAndCategories() {
    const proRes = await api.get("/products");
    const catRes = await api.get("/categories");
    setProducts(proRes.data);
    setCategories(catRes.data);
  }

  async function loadInvoices() {
    const res = await api.get("/sales/invoices");
    setInvoices(res.data);
  }

  useEffect(() => {
    loadProductsAndCategories();
    loadInvoices();
  }, []);

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const addItemRow = () => {
    setForm({
      ...form,
      items: [...form.items, { product_id: "", quantity: "" }]
    });
  };

  const removeItemRow = index => {
    const items = form.items.filter((_, i) => i !== index);
    setForm({
      ...form,
      items: items.length ? items : [{ product_id: "", quantity: "" }]
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");

    const payloadItems = form.items
      .filter(it => it.product_id && it.quantity)
      .map(it => ({
        product_id: Number(it.product_id),
        quantity: Number(it.quantity)
      }));

    if (!payloadItems.length) {
      setMessage("Add at least one product with quantity");
      return;
    }

    try {
      await api.post("/sales/invoices", {
        customer_name: form.customer_name || null,
        customer_phone: form.customer_phone || null,
        payment_mode: form.payment_mode || null,
        items: payloadItems
      });
      setMessage("Invoice created successfully");
      setForm({
        customer_name: "",
        customer_phone: "",
        payment_mode: "Cash",
        items: [{ product_id: "", quantity: "" }]
      });
      loadProductsAndCategories();
      loadInvoices();
    } catch (err) {
      const msg = err.response?.data?.message || "Error creating invoice";
      setMessage(msg);
    }
  };

  const openInvoice = async id => {
    try {
      const res = await api.get(`/sales/invoices/${id}`);
      setSelectedInvoice(res.data);
    } catch (err) {
      // ignore
    }
  };

  const deleteInvoice = async id => {
    if (!window.confirm("Archive this invoice?")) return;
    await api.delete(`/sales/invoices/${id}`);
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice(null);
    }
    loadInvoices();
  };

  const visibleProducts = productCategoryFilter
    ? products.filter(p => String(p.category_id) === String(productCategoryFilter))
    : products;

  const generatePdf = invoice => {
    if (!invoice) return;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_INFO.shopName, 14, 16);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Managed by ${COMPANY_INFO.legalName}`, 14, 22);
    doc.text(`Owner: ${COMPANY_INFO.ownerName}`, 14, 28);

    let addrY = 34;
    if (COMPANY_INFO.addressLine1) {
      doc.text(COMPANY_INFO.addressLine1, 14, addrY);
      addrY += 6;
    }
    if (COMPANY_INFO.addressLine2) {
      doc.text(COMPANY_INFO.addressLine2, 14, addrY);
      addrY += 6;
    }

    doc.text(`Contact: ${COMPANY_INFO.contactNumber}`, 14, addrY);
    addrY += 6;
    if (COMPANY_INFO.email) {
      doc.text(`Email: ${COMPANY_INFO.email}`, 14, addrY);
      addrY += 6;
    }

    const metaX = 135;
    doc.setFontSize(11);
    doc.text(`Invoice ID: ${invoice.id}`, metaX, 20);
    doc.text(
      `Date: ${new Date(invoice.created_at).toLocaleDateString()}`,
      metaX,
      26
    );
    doc.text(
      `Time: ${new Date(invoice.created_at).toLocaleTimeString()}`,
      metaX,
      32
    );
    const pmText = invoice.payment_mode ? invoice.payment_mode : "-";
    doc.text(`Payment Mode: ${pmText}`, metaX, 38);

    doc.line(14, 44, 196, 44);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 14, 52);

    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${invoice.customer_name || "-"}`, 14, 58);
    doc.text(`Phone: ${invoice.customer_phone || "-"}`, 14, 64);

    doc.line(14, 70, 196, 70);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Product", 14, 78);
    doc.text("SKU", 80, 78);
    doc.text("Qty", 120, 78);
    doc.text("Unit Price", 140, 78);
    doc.text("Total", 170, 78);

    doc.line(14, 80, 196, 80);

    let y = 88;
    doc.setFont("helvetica", "normal");
    (invoice.items || []).forEach(item => {
      doc.text(item.product_name || "", 14, y);
      doc.text(item.product_sku || "", 80, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(`₹${Number(item.unit_price).toFixed(2)}`, 140, y);
      const lineTotal =
        item.total != null ? item.total : item.total_amount || 0;
      doc.text(`₹${Number(lineTotal).toFixed(2)}`, 170, y);
      y += 8;
    });

    doc.line(14, y, 196, y);

    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Grand Total: ₹${Number(invoice.total_amount).toFixed(2)}`,
      140,
      y
    );

    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (COMPANY_INFO.note) {
      doc.text(COMPANY_INFO.note, 14, y);
      y += 6;
    }

    if (COMPANY_INFO.legalLine) {
      doc.text(COMPANY_INFO.legalLine, 14, y);
      y += 6;
    }

    doc.text(
      "This is a computer generated invoice. Signature is not required.",
      14,
      y
    );

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("For " + COMPANY_INFO.shopName, 140, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("(Authorised Signatory)", 150, y);

    doc.save(`invoice_${invoice.id}.pdf`);
  };

  return (
    <div>
      <h2>Sales (Multi-item Invoice)</h2>
      {message && <div className="alert">{message}</div>}

      <div className="grid-2">
        <form onSubmit={handleSubmit} className="card form-card">
          <h3>Create Invoice</h3>

          <label>
            Customer Name
            <input
              type="text"
              value={form.customer_name}
              onChange={e =>
                setForm({ ...form, customer_name: e.target.value })
              }
            />
          </label>

          <label>
            Customer Phone
            <input
              type="text"
              value={form.customer_phone}
              onChange={e =>
                setForm({ ...form, customer_phone: e.target.value })
              }
            />
          </label>

          <label>
            Payment Mode
            <select
              value={form.payment_mode}
              onChange={e =>
                setForm({ ...form, payment_mode: e.target.value })
              }
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <div className="filter-row" style={{ marginTop: "0.75rem" }}>
            <span className="filter-label">Product category:</span>
            <select
              value={productCategoryFilter}
              onChange={e => setProductCategoryFilter(e.target.value)}
            >
              <option value="">All</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <strong>Items</strong>
          </div>

          {form.items.map((item, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr auto",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                alignItems: "center"
              }}
            >
              <select
                value={item.product_id}
                onChange={e => updateItem(index, "product_id", e.target.value)}
              >
                <option value="">Select product</option>
                {visibleProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name} (Stock: {p.current_stock})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={e => updateItem(index, "quantity", e.target.value)}
              />
              <button
                type="button"
                className="btn-danger"
                onClick={() => removeItemRow(index)}
              >
                X
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn-primary"
            style={{ marginBottom: "0.75rem" }}
            onClick={addItemRow}
          >
            + Add Item
          </button>

          <button type="submit" className="btn-primary">
            Create Invoice
          </button>
        </form>

        <div className="card">
          <h3>Recent Invoices</h3>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date/Time</th>
                <th>Customer</th>
                <th>Mode</th>
                <th>Total (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.id}</td>
                  <td>{inv.created_at}</td>
                  <td>{inv.customer_name || "-"}</td>
                  <td>{inv.payment_mode || "-"}</td>
                  <td>{Number(inv.total_amount).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-primary btn-xs"
                      onClick={() => openInvoice(inv.id)}
                    >
                      View
                    </button>{" "}
                    <button
                      type="button"
                      className="btn-danger btn-xs"
                      onClick={() => deleteInvoice(inv.id)}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6}>No invoices yet.</td>
                </tr>
              )}
            </tbody>
          </table>

          {selectedInvoice && (
            <div style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
              <h4>Invoice Details (#{selectedInvoice.id})</h4>
              <p>
                Customer: {selectedInvoice.customer_name || "-"}{" "}
                {selectedInvoice.customer_phone
                  ? ` (${selectedInvoice.customer_phone})`
                  : ""}
              </p>
              <p>Payment Mode: {selectedInvoice.payment_mode || "-"}</p>
              <table className="table" style={{ marginTop: "0.5rem" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.product_name}</td>
                      <td>{it.product_sku}</td>
                      <td>{it.quantity}</td>
                      <td>{Number(it.unit_price).toFixed(2)}</td>
                      <td>{Number(it.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: "0.25rem", fontWeight: 600 }}>
                Grand Total: ₹
                {Number(selectedInvoice.total_amount).toFixed(2)}
              </div>
              <button
                type="button"
                style={{ marginTop: "0.5rem" }}
                className="btn-primary"
                onClick={() => generatePdf(selectedInvoice)}
              >
                Download Invoice PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sales;

