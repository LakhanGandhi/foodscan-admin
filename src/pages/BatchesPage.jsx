import { useEffect, useState } from "react";
import { Plus, Pencil, QrCode, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import client from "../api/client";
import { listBatches, createBatch, updateBatch } from "../api/batches";

const emptyForm = { companyId: "", productId: "", plantId: "", batchNumber: "", mfgDate: "", expDate: "" };
const inputStyle = { width: "100%", padding: 8, marginTop: 4, marginBottom: 12 };
const labelStyle = { fontSize: 13, fontWeight: 600 };
const iconBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "var(--color-primary)" };

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : "";
}

function BatchesPage() {
  const { user } = useAuth();
  const canManage = ["superAdmin", "companyAdmin", "companyEmployee"].includes(user?.role);

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [qrBatch, setQrBatch] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [qrPublicUrl, setQrPublicUrl] = useState(null);
  const [qrBlob, setQrBlob] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  async function loadBatches() {
    setLoading(true);
    try {
      const data = await listBatches();
      setBatches(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load batches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (user.role !== "superAdmin") delete payload.companyId;
      await createBatch(payload);
      setForm(emptyForm);
      setShowAddForm(false);
      await loadBatches();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to create batch.");
    } finally {
      setSubmitting(false);
    }
  }

  const isAdmin = user?.role === "superAdmin" || user?.role === "companyAdmin";
  const [editingBatch, setEditingBatch] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  function startEdit(batch) {
    setEditingBatch(batch);
    setEditForm({
      batchNumber: batch.batchNumber,
      mfgDate: batch.mfgDate ? batch.mfgDate.slice(0, 10) : "",
      expDate: batch.expDate ? batch.expDate.slice(0, 10) : "",
      status: batch.status,
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingBatch(null);
    setEditForm(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditError("");
    setEditSubmitting(true);
    try {
      await updateBatch(editingBatch._id, editForm);
      cancelEdit();
      await loadBatches();
    } catch (err) {
      setEditError(err.response?.data?.error?.message || "Failed to update batch.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleShowQr(batch) {
    setQrBatch(batch);
    setQrLoading(true);
    setQrImageUrl(null);
    try {
      const imgRes = await client.get(`/batches/${batch._id}/qr`, { responseType: "blob" });
      const blob = imgRes.data;
      setQrBlob(blob);
      setQrImageUrl(URL.createObjectURL(blob));

      const urlRes = await client.get(`/batches/${batch._id}/qr-url`);
      setQrPublicUrl(urlRes.data.data.url);
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to generate QR.");
    } finally {
      setQrLoading(false);
    }
  }

  function closeQr() {
    setQrBatch(null);
    setQrImageUrl(null);
    setQrBlob(null);
    setQrPublicUrl(null);
  }

  function downloadQr() {
    if (!qrBlob || !qrBatch) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(qrBlob);
    a.download = `${qrBatch._id}-qr.png`;
    a.click();
  }

  function copyQrUrl() {
    if (!qrPublicUrl) return;
    navigator.clipboard.writeText(qrPublicUrl);
    alert("Public URL copied.");
  }

  const createFields = [
    ["productId", "Product ID"],
    ["plantId", "Plant ID"],
    ["batchNumber", "Batch Number"],
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Batches</h2>
        {canManage && (
          <button onClick={() => setShowAddForm((v) => !v)} style={iconBtnStyle} title="Add Batch">
            <Plus size={22} />
          </button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--color-border)", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card)" }}>
                <th style={{ padding: 8 }}>ID</th>
                <th style={{ padding: 8 }}>Product ID</th>
                <th style={{ padding: 8 }}>Batch No.</th>
                <th style={{ padding: 8 }}>Mfg Date</th>
                <th style={{ padding: 8 }}>Exp Date</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{b._id}</td>
                  <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{b.productId}</td>
                  <td style={{ padding: 8 }}>{b.batchNumber}</td>
                  <td style={{ padding: 8 }}>{formatDate(b.mfgDate)}</td>
                  <td style={{ padding: 8 }}>{formatDate(b.expDate)}</td>
                  <td style={{ padding: 8 }}>{b.status}</td>
                  <td style={{ padding: 8, display: "flex", gap: 8 }}>
                    {isAdmin && (
                      <button onClick={() => startEdit(b)} style={iconBtnStyle} title="Edit">
                        <Pencil size={18} />
                      </button>
                    )}
                    <button onClick={() => handleShowQr(b)} style={iconBtnStyle} title="Generate QR">
                      <QrCode size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                    No batches yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <>
          <h3>Add Batch</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {user.role === "superAdmin" && (
                <div>
                  <label style={labelStyle}>Company ID</label>
                  <input style={inputStyle} value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
                </div>
              )}
              {createFields.map(([key, label]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={form[key]} onChange={(e) => updateField(key, e.target.value)} required />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Manufacturing Date</label>
                <input style={inputStyle} type="date" value={form.mfgDate} onChange={(e) => updateField("mfgDate", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input style={inputStyle} type="date" value={form.expDate} onChange={(e) => updateField("expDate", e.target.value)} required />
              </div>
            </div>

            {formError && <p style={{ color: "var(--color-danger)" }}>{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
              >
                {submitting ? "Creating..." : "Create Batch"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormError("");
                  setShowAddForm(false);
                }}
                style={{ padding: "10px 20px", border: "1px solid var(--color-border)", borderRadius: 999, background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}

      {editingBatch && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit Batch: {editingBatch.batchNumber}</h3>
            <button onClick={cancelEdit} style={iconBtnStyle} title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div>
                <label style={labelStyle}>Batch Number</label>
                <input
                  style={inputStyle}
                  value={editForm.batchNumber}
                  onChange={(e) => setEditForm((p) => ({ ...p, batchNumber: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  style={inputStyle}
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="recalled">recalled</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Manufacturing Date</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={editForm.mfgDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, mfgDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={editForm.expDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, expDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            {editError && <p style={{ color: "var(--color-danger)" }}>{editError}</p>}
            <button
              type="submit"
              disabled={editSubmitting}
              style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {qrBatch && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>QR: {qrBatch.batchNumber}</h3>
            <button onClick={closeQr} style={iconBtnStyle} title="Close">
              <X size={20} />
            </button>
          </div>
          {qrLoading && <p>Generating...</p>}
          {qrImageUrl && (
            <>
              <img src={qrImageUrl} alt="QR code" style={{ width: 200, height: 200, borderRadius: 4 }} />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={downloadQr} style={{ padding: "8px 16px", border: "1px solid var(--color-border)", borderRadius: 999, background: "#fff", cursor: "pointer" }}>
                  Download PNG
                </button>
                <button onClick={copyQrUrl} style={{ padding: "8px 16px", border: "1px solid var(--color-border)", borderRadius: 999, background: "#fff", cursor: "pointer" }}>
                  Copy Public URL
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default BatchesPage;
