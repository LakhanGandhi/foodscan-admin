import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listCompanies, createCompany, updateCompany, changeCompanyStatus } from "../api/companies";

const emptyForm = {
  companyName: "",
  legalCompanyName: "",
  companyType: "",
  gstNumber: "",
  website: "",
  email: "",
  phoneNumber: "",
  address: { line1: "", city: "", state: "", country: "", pinCode: "" },
};

const STATUS_OPTIONS = ["pending", "approved", "disabled", "suspended"];
const inputStyle = { width: "100%", padding: 8, marginTop: 4, marginBottom: 12 };
const labelStyle = { fontSize: 13, fontWeight: 600 };
const iconBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "var(--color-primary)" };

function CompaniesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superAdmin";

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadCompanies() {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listCompanies();
      setCompanies(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function updateAddressField(field, value) {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await createCompany(form);
      setForm(emptyForm);
      setShowAddForm(false);
      await loadCompanies();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to create company.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(company) {
    setEditingCompany(company);
    setEditForm({
      companyName: company.companyName,
      legalCompanyName: company.legalCompanyName,
      companyType: company.companyType,
      website: company.website,
      email: company.email,
      phoneNumber: company.phoneNumber,
    });
    setEditStatus(company.status);
    setEditError("");
  }

  function cancelEdit() {
    setEditingCompany(null);
    setEditForm(null);
  }

  function updateEditField(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditError("");
    setEditSubmitting(true);
    try {
      await updateCompany(editingCompany._id, editForm);
      if (editStatus !== editingCompany.status) {
        await changeCompanyStatus(editingCompany._id, editStatus);
      }
      cancelEdit();
      await loadCompanies();
    } catch (err) {
      setEditError(err.response?.data?.error?.message || "Failed to update company.");
    } finally {
      setEditSubmitting(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div>
        <h2>Companies</h2>
        <p style={{ color: "var(--color-text-muted)" }}>
          Viewing all companies is a Super Admin feature. Your own company's details will be available from a
          dedicated page soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Companies</h2>
        <button onClick={() => setShowAddForm((v) => !v)} style={iconBtnStyle} title="Add Company">
          <Plus size={22} />
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--color-border)", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card)" }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Legal Name</th>
              <th style={{ padding: 8 }}>GST</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{c._id}</td>
                <td style={{ padding: 8 }}>{c.companyName}</td>
                <td style={{ padding: 8 }}>{c.legalCompanyName}</td>
                <td style={{ padding: 8 }}>{c.gstNumber}</td>
                <td style={{ padding: 8 }}>{c.status}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => startEdit(c)} style={iconBtnStyle} title="Edit">
                    <Pencil size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                  No companies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}

      {showAddForm && (
        <>
          <h3>Add Company</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input style={inputStyle} value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Legal Company Name</label>
                <input style={inputStyle} value={form.legalCompanyName} onChange={(e) => updateField("legalCompanyName", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Company Type</label>
                <input style={inputStyle} value={form.companyType} onChange={(e) => updateField("companyType", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>GST Number</label>
                <input style={inputStyle} value={form.gstNumber} onChange={(e) => updateField("gstNumber", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input style={inputStyle} value={form.website} onChange={(e) => updateField("website", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input style={inputStyle} value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Address Line 1</label>
                <input style={inputStyle} value={form.address.line1} onChange={(e) => updateAddressField("line1", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={form.address.city} onChange={(e) => updateAddressField("city", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={form.address.state} onChange={(e) => updateAddressField("state", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input style={inputStyle} value={form.address.country} onChange={(e) => updateAddressField("country", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>PIN Code</label>
                <input style={inputStyle} value={form.address.pinCode} onChange={(e) => updateAddressField("pinCode", e.target.value)} required />
              </div>
            </div>

            {formError && <p style={{ color: "var(--color-danger)" }}>{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}>
                {submitting ? "Creating..." : "Create Company"}
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

      {editingCompany && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingCompany.companyName}</h3>
            <button onClick={cancelEdit} style={iconBtnStyle} title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input style={inputStyle} value={editForm.companyName} onChange={(e) => updateEditField("companyName", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Legal Company Name</label>
                <input style={inputStyle} value={editForm.legalCompanyName} onChange={(e) => updateEditField("legalCompanyName", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Company Type</label>
                <input style={inputStyle} value={editForm.companyType} onChange={(e) => updateEditField("companyType", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input style={inputStyle} value={editForm.website} onChange={(e) => updateEditField("website", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={editForm.email} onChange={(e) => updateEditField("email", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input style={inputStyle} value={editForm.phoneNumber} onChange={(e) => updateEditField("phoneNumber", e.target.value)} required />
              </div>
            </div>

            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {editError && <p style={{ color: "var(--color-danger)" }}>{editError}</p>}
            <button type="submit" disabled={editSubmitting} style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}>
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CompaniesPage;
