import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import api from "../api";

const COMPANY_INFO = {
  legalName: "SSMK",
  shopName: "Shree Shyam Mobile and Laptop Repair",
  ownerName: "Sonu Verma",
  contactNumber: "+91 8871315143",
  addressLine1: "In Front of VIT Main Gate Near MPH",
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredProducts = visibleProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generatePdf = invoice => {
    if (!invoice) return;
    const doc = new jsPDF();

    // Colors
    const primaryColor = [99, 102, 241];
    const darkColor = [15, 23, 42];
    const textColor = [51, 65, 85];
    const lightGray = [148, 163, 184];

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 45, 'F');

    // Company Logo/Name
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_INFO.shopName, 15, 18);

    // Company Tagline
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Managed by ${COMPANY_INFO.legalName}`, 15, 25);
    doc.text(`Owner: ${COMPANY_INFO.ownerName}`, 15, 31);

    // Invoice Title (Right side of header)
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 210 - 15, 20, { align: "right" });

    // Reset to dark text
    doc.setTextColor(...textColor);
    
    // Company Details Box (Left)
    let y = 55;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("FROM:", 15, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    y += 5;
    doc.text(COMPANY_INFO.addressLine1, 15, y);
    y += 4;
    doc.text(COMPANY_INFO.addressLine2, 15, y);
    y += 4;
    doc.text(`Phone: ${COMPANY_INFO.contactNumber}`, 15, y);
    y += 4;
    doc.text(`Email: ${COMPANY_INFO.email}`, 15, y);

    // Invoice Details Box (Right)
    const rightX = 120;
    let rightY = 55;
    
    doc.setFillColor(245, 247, 250);
    doc.rect(rightX - 5, rightY - 5, 75, 30, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("Invoice Details", rightX, rightY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    rightY += 6;
    doc.text(`Invoice No:`, rightX, rightY);
    doc.setFont("helvetica", "bold");
    doc.text(`#INV-${String(invoice.id).padStart(5, '0')}`, rightX + 35, rightY);
    
    doc.setFont("helvetica", "normal");
    rightY += 5;
    const invoiceDate = new Date(invoice.created_at);
    doc.text(`Date:`, rightX, rightY);
    doc.text(invoiceDate.toLocaleDateString('en-GB'), rightX + 35, rightY);
    
    rightY += 5;
    doc.text(`Time:`, rightX, rightY);
    doc.text(invoiceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), rightX + 35, rightY);
    
    rightY += 5;
    doc.text(`Payment:`, rightX, rightY);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.payment_mode || "Cash", rightX + 35, rightY);

    // Bill To Section
    y = 95;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text("BILL TO:", 15, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    y += 6;
    doc.text(`Name: ${invoice.customer_name || "Walk-in Customer"}`, 15, y);
    y += 5;
    doc.text(`Phone: ${invoice.customer_phone || "N/A"}`, 15, y);

    // Divider Line
    y += 10;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);

    // Table Header
    y += 8;
    doc.setFillColor(...primaryColor);
    doc.rect(15, y - 5, 180, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("#", 18, y);
    doc.text("Product Details", 28, y);
    doc.text("SKU", 95, y);
    doc.text("Qty", 125, y, { align: "center" });
    doc.text("Unit Price", 145, y, { align: "right" });
    doc.text("Total", 185, y, { align: "right" });

    // Table Rows
    y += 8;
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    let rowBg = true;
    (invoice.items || []).forEach((item, index) => {
      // Alternate row background
      if (rowBg) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, y - 4, 180, 7, 'F');
      }
      rowBg = !rowBg;

      // Row number
      doc.setFont("helvetica", "bold");
      doc.text(String(index + 1), 18, y);
      
      // Product name (truncate if too long)
      doc.setFont("helvetica", "normal");
      const productName = item.product_name || "";
      const truncatedName = productName.length > 35 ? productName.substring(0, 32) + "..." : productName;
      doc.text(truncatedName, 28, y);
      
      // SKU
      doc.text(item.product_sku || "", 95, y);
      
      // Quantity
      doc.setFont("helvetica", "bold");
      doc.text(String(item.quantity), 125, y, { align: "center" });
      
      // Unit Price
      doc.setFont("helvetica", "normal");
      doc.text(`₹${Number(item.unit_price).toFixed(2)}`, 145, y, { align: "right" });
      
      // Line Total
      const lineTotal = item.total != null ? item.total : item.total_amount || 0;
      doc.setFont("helvetica", "bold");
      doc.text(`₹${Number(lineTotal).toFixed(2)}`, 185, y, { align: "right" });
      
      y += 7;

      // Add new page if needed
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    });

    // Bottom Divider
    y += 3;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);

    // Total Section
    y += 10;
    doc.setFillColor(245, 247, 250);
    doc.rect(130, y - 6, 65, 12, 'F');
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Grand Total:", 135, y);
    doc.setFontSize(14);
    doc.text(`₹${Number(invoice.total_amount).toFixed(2)}`, 185, y, { align: "right" });

    // Footer Section
    y += 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...textColor);
    
    if (COMPANY_INFO.note) {
      doc.text(COMPANY_INFO.note, 15, y);
      y += 5;
    }

    if (COMPANY_INFO.legalLine) {
      doc.text(COMPANY_INFO.legalLine, 15, y);
      y += 5;
    }

    // Signature Section
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Authorized Signature", 150, y);
    doc.setLineWidth(0.3);
    doc.line(150, y + 2, 190, y + 2);

    // Thank You Message
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    const thankYouY = 280;
    doc.text("Thank you for your business!", 105, thankYouY, { align: "center" });

    // Footer Line
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text("This is a computer generated invoice", 105, 290, { align: "center" });

    doc.save(`SSMK_Invoice_${invoice.id}_${Date.now()}.pdf`);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(inv.id).includes(searchTerm)
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <h2>💰 Sales & Invoicing</h2>
          <p style={{ color: "#9ca3af", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            Create multi-item invoices and manage sales records
          </p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-error'}`}>
          {message.includes('successfully') ? '✓' : '✗'} {message}
        </div>
      )}

      <div className="grid-2">
        {/* Create Invoice Form */}
        <form onSubmit={handleSubmit} className="card form-card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🧾</span> Create New Invoice
          </h3>

          <label>
            Customer Name
            <input
              type="text"
              value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name: e.target.value })}
              placeholder="Enter customer name"
            />
          </label>

          <label>
            Customer Phone
            <input
              type="text"
              value={form.customer_phone}
              onChange={e => setForm({ ...form, customer_phone: e.target.value })}
              placeholder="+91 XXXXXXXXXX"
            />
          </label>

          <label>
            Payment Mode
            <select
              value={form.payment_mode}
              onChange={e => setForm({ ...form, payment_mode: e.target.value })}
            >
              <option value="Cash">💵 Cash</option>
              <option value="UPI">📱 UPI</option>
              <option value="Card">💳 Card</option>
              <option value="Other">🔄 Other</option>
            </select>
          </label>

          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(99, 102, 241, 0.05)', 
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '0.95rem' }}>📦 Items</strong>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={productCategoryFilter}
                  onChange={e => setProductCategoryFilter(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 0.8fr auto',
                  gap: '0.5rem',
                  marginBottom: '0.65rem',
                  alignItems: 'start'
                }}
              >
                <div>
                  <select
                    value={item.product_id}
                    onChange={e => updateItem(index, "product_id", e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select product...</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name} (Stock: {p.current_stock})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(index, "quantity", e.target.value)}
                  style={{ width: '100%' }}
                />
                <button
                  type="button"
                  className="btn-danger btn-xs"
                  onClick={() => removeItemRow(index)}
                  style={{ height: '100%' }}
                >
                  ✗
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn-primary btn-xs"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={addItemRow}
            >
              ➕ Add Another Item
            </button>
          </div>

          <button type="submit" className="btn-success" style={{ marginTop: '1rem', width: '100%' }}>
            Create Invoice
          </button>
        </form>

        {/* Invoice List */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>📋 Recent Invoices</h3>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by invoice ID or customer name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <span className="badge badge-info">
                        #{String(inv.id).padStart(5, '0')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{inv.created_at}</td>
                    <td>{inv.customer_name || <span style={{ color: '#9ca3af' }}>Walk-in</span>}</td>
                    <td>
                      <span className="badge badge-success">
                        {inv.payment_mode || "Cash"}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: '#10b981' }}>
                      ₹{Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-primary btn-xs"
                          onClick={() => openInvoice(inv.id)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-xs"
                          onClick={() => deleteInvoice(inv.id)}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        <div className="empty-state-text">No invoices found</div>
                        <div className="empty-state-subtext">Create your first invoice above</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.98)',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
            }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>Invoice Details</h3>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  Invoice #{String(selectedInvoice.id).padStart(5, '0')}
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f9fafb',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Customer & Payment Info */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(99, 102, 241, 0.1)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
                    Customer
                  </div>
                  <div style={{ fontWeight: '600', color: '#f9fafb' }}>
                    {selectedInvoice.customer_name || "Walk-in Customer"}
                  </div>
                  {selectedInvoice.customer_phone && (
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                      📞 {selectedInvoice.customer_phone}
                    </div>
                  )}
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
                    Date & Time
                  </div>
                  <div style={{ fontWeight: '600', color: '#f9fafb' }}>
                    {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                    🕐 {new Date(selectedInvoice.created_at).toLocaleTimeString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>
                    Payment Mode
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                    {selectedInvoice.payment_mode || "Cash"}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Items</h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInvoice.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: '500' }}>{it.product_name}</td>
                          <td><span className="badge badge-info">{it.product_sku}</span></td>
                          <td style={{ fontWeight: '600' }}>{it.quantity}</td>
                          <td>₹{Number(it.unit_price).toFixed(2)}</td>
                          <td style={{ fontWeight: '700', color: '#10b981' }}>
                            ₹{Number(it.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
                borderRadius: '10px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>Grand Total</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#6366f1' }}>
                  ₹{Number(selectedInvoice.total_amount).toFixed(2)}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
                onClick={() => generatePdf(selectedInvoice)}
              >
                📥 Download Invoice PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;
