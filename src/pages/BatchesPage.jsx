import { useEffect, useState } from "react";
import { Plus, Pencil, QrCode, X, AlertTriangle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import client from "../api/client";
import { listBatches, createBatch, updateBatch } from "../api/batches";
import "../styles/shared.css";

const emptyForm = { companyId: "", productId: "", plantId: "", batchNumber: "", mfgDate: "", expDate: "" };

// Matches the 15-day near-expiry window the public batch endpoint uses
// server-side, so admin sees the same urgency signal as a consumer would.
// This is a client-side estimate for display only — the authoritative
// expiryStatus is computed by the backend on the public endpoint.
const NEAR_EXPIRY_WINDOW_DAYS = 15;

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : "";
}

function expiryInfo(expDate) {
  if (!expDate) return { key: "unknown", label: "—" };
  const daysLeft = Math.ceil((new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { key: "expired", label: "Expired" };
  if (daysLeft <= NEAR_EXPIRY_WINDOW_DAYS) return { key: "near_expiry", label: `${daysLeft}d left` };
  return { key: "safe", label: null };
}

function ExpiryPill({ expDate }) {
  const info = expiryInfo(expDate);
  if (info.key === "safe" || info.key === "unknown") {
    return <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{info.label || "—"}</span>;
  }
  const variant = info.key === "expired" ? "danger" : "warning";
  return <span className={`status-pill status-pill--${variant}`}>{info.label}</span>;
}

// "active" gets no pill at all — plain text. "recalled" is the only status
// in this whole app that gets a bold, icon-carrying pill, on purpose: if
// nothing else here is colored, recalled is unmistakable the moment it
// appears in the table.
function BatchStatus({ status }) {
  if (status === "recalled") {
    return (
      <span className="status-pill status-pill--danger" style={{ gap: 4 }}>
        <AlertTriangle size={12} />
        recalled
      </span>
    );
  }
  return <span style={{ color: "var(--color-text)" }}>{status}</span>;
}

function BatchesPage() {
  const { user } = useAuth();
  const canManage = ["superAdmin", "companyAdmin", "companyEmployee"].includes(user?.role);
  const isAdmin = user?.role === "superAdmin" || user?.role === "companyAdmin";

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

  const [editingBatch, setEditingBatch] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

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
          <button onClick={() => setShowAddForm((v) => !v)} className="icon-btn" title="Add Batch">
            <Plus size={22} />
          </button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="alert-banner--danger">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product ID</th>
                <th>Batch No.</th>
                <th>Mfg Date</th>
                <th>Exp Date</th>
                <th>Expiry</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b._id}>
                  <td className="id-cell">{b._id}</td>
                  <td className="id-cell">{b.productId}</td>
                  <td>{b.batchNumber}</td>
                  <td className="tabular-nums">{formatDate(b.mfgDate)}</td>
                  <td className="tabular-nums">{formatDate(b.expDate)}</td>
                  <td>{b.status === "recalled" ? <span style={{ color: "var(--color-text-muted)" }}>—</span> : <ExpiryPill expDate={b.expDate} />}</td>
                  <td>
                    <BatchStatus status={b.status} />
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    {isAdmin && (
                      <button onClick={() => startEdit(b)} className="icon-btn" title="Edit">
                        <Pencil size={18} />
                      </button>
                    )}
                    <button onClick={() => handleShowQr(b)} className="icon-btn" title="Generate QR">
                      <QrCode size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={8}>No batches yet.</td>
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
                  <label className="field-label">Company ID</label>
                  <input className="field-input" value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
                </div>
              )}
              {createFields.map(([key, label]) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={form[key]} onChange={(e) => updateField(key, e.target.value)} required />
                </div>
              ))}
              <div>
                <label className="field-label">Manufacturing Date</label>
                <input className="field-input" type="date" value={form.mfgDate} onChange={(e) => updateField("mfgDate", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Expiry Date</label>
                <input className="field-input" type="date" value={form.expDate} onChange={(e) => updateField("expDate", e.target.value)} required />
              </div>
            </div>

            {formError && <p className="alert-banner--danger">{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} className="btn btn--primary">
                {submitting ? "Creating..." : "Create Batch"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormError("");
                  setShowAddForm(false);
                }}
                className="btn btn--neutral-outline"
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
            <button onClick={cancelEdit} className="icon-btn" title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div>
                <label className="field-label">Batch Number</label>
                <input
                  className="field-input"
                  value={editForm.batchNumber}
                  onChange={(e) => setEditForm((p) => ({ ...p, batchNumber: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="field-label">Status</label>
                <select className="field-input" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">active</option>
                  <option value="recalled">recalled</option>
                </select>
              </div>
              <div>
                <label className="field-label">Manufacturing Date</label>
                <input
                  className="field-input"
                  type="date"
                  value={editForm.mfgDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, mfgDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="field-label">Expiry Date</label>
                <input
                  className="field-input"
                  type="date"
                  value={editForm.expDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, expDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            {editError && <p className="alert-banner--danger">{editError}</p>}
            <button type="submit" disabled={editSubmitting} className="btn btn--primary">
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {qrBatch && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>QR: {qrBatch.batchNumber}</h3>
            <button onClick={closeQr} className="icon-btn" title="Close">
              <X size={20} />
            </button>
          </div>
          {qrLoading && <p>Generating...</p>}
          {qrImageUrl && (
            <>
              <img src={qrImageUrl} alt="QR code" style={{ width: 200, height: 200, borderRadius: "var(--radius)", border: "1px solid var(--color-border)" }} />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={downloadQr} className="btn btn--neutral-outline">
                  Download PNG
                </button>
                <button onClick={copyQrUrl} className="btn btn--neutral-outline">
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
