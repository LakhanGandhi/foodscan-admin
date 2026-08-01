import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listBrands, createBrand, updateBrand } from "../api/brands";

const inputStyle = { width: "100%", padding: 8, marginTop: 4, marginBottom: 12 };
const labelStyle = { fontSize: 13, fontWeight: 600 };
const iconBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "var(--color-primary)" };
const STATUS_OPTIONS = ["active", "inactive"];

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
          <button onClick={() => setShowAddForm((v) => !v)} style={iconBtnStyle} title="Add Brand">
            <Plus size={22} />
          </button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "16px 0 32px" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Brand Name</th>
              <th style={{ padding: 8 }}>Company Name</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{b._id}</td>
                <td style={{ padding: 8 }}>{b.brandName}</td>
                <td style={{ padding: 8 }}>{b.companyName}</td>
                <td style={{ padding: 8 }}>{b.status}</td>
                <td style={{ padding: 8 }}>
                  {canManage && (
                    <button onClick={() => startEdit(b)} style={iconBtnStyle} title="Edit">
                      <Pencil size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                  No brands yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showAddForm && (
        <>
          <h3>Add Brand</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 400 }}>
            {user.role === "superAdmin" && (
              <>
                <label style={labelStyle}>Company ID</label>
                <input style={inputStyle} value={companyId} onChange={(e) => setCompanyId(e.target.value)} required />
              </>
            )}
            <label style={labelStyle}>Brand Name</label>
            <input style={inputStyle} value={brandName} onChange={(e) => setBrandName(e.target.value)} required />

            {formError && <p style={{ color: "var(--color-danger)" }}>{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
            >
              {submitting ? "Creating..." : "Create Brand"}
            </button>
          </form>
        </>
      )}

      {editingBrand && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingBrand.brandName}</h3>
            <button onClick={cancelEdit} style={iconBtnStyle} title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <label style={labelStyle}>Brand Name</label>
            <input style={inputStyle} value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
    </div>
  );
}

export default BrandsPage;
