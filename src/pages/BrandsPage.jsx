import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listBrands, createBrand, updateBrand } from "../api/brands";
import "../styles/shared.css";

const STATUS_OPTIONS = ["active", "inactive"];

function statusVariant(status) {
  return status === "active" ? "success" : "neutral";
}

function StatusPill({ status }) {
  return <span className={`status-pill status-pill--${statusVariant(status)}`}>{status}</span>;
}

function BrandsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "superAdmin" || user?.role === "companyAdmin";

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingBrand, setEditingBrand] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadBrands() {
    setLoading(true);
    try {
      const data = await listBrands();
      setBrands(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrands();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = { brandName };
      if (user.role === "superAdmin") payload.companyId = companyId;
      await createBrand(payload);
      setBrandName("");
      setCompanyId("");
      setShowAddForm(false);
      await loadBrands();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to create brand.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(brand) {
    setEditingBrand(brand);
    setEditName(brand.brandName);
    setEditStatus(brand.status);
    setEditError("");
  }

  function cancelEdit() {
    setEditingBrand(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditError("");
    setEditSubmitting(true);
    try {
      await updateBrand(editingBrand._id, { brandName: editName, status: editStatus });
      cancelEdit();
      await loadBrands();
    } catch (err) {
      setEditError(err.response?.data?.error?.message || "Failed to update brand.");
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Brands</h2>
        {canManage && (
          <button onClick={() => setShowAddForm((v) => !v)} className="icon-btn" title="Add Brand">
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
                <th>Brand Name</th>
                <th>Company Name</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b._id}>
                  <td className="id-cell">{b._id}</td>
                  <td>{b.brandName}</td>
                  <td>{b.companyName}</td>
                  <td>
                    <StatusPill status={b.status} />
                  </td>
                  <td>
                    {canManage && (
                      <button onClick={() => startEdit(b)} className="icon-btn" title="Edit">
                        <Pencil size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={5}>No brands yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <>
          <h3>Add Brand</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 400 }}>
            {user.role === "superAdmin" && (
              <>
                <label className="field-label">Company ID</label>
                <input className="field-input" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required />
              </>
            )}
            <label className="field-label">Brand Name</label>
            <input className="field-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} required />

            {formError && <p className="alert-banner--danger">{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} className="btn btn--primary">
                {submitting ? "Creating..." : "Create Brand"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrandName("");
                  setCompanyId("");
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

      {editingBrand && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingBrand.brandName}</h3>
            <button onClick={cancelEdit} className="icon-btn" title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <label className="field-label">Brand Name</label>
            <input className="field-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <label className="field-label">Status</label>
            <select className="field-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {editError && <p className="alert-banner--danger">{editError}</p>}
            <button type="submit" disabled={editSubmitting} className="btn btn--primary">
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default BrandsPage;
