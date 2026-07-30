import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { listCompanies, createCompany } from "../api/companies";

const emptyForm = {
  companyName: "",
  legalCompanyName: "",
  brandName: "",
  companyType: "",
  gstNumber: "",
  website: "",
  email: "",
  phoneNumber: "",
  address: { line1: "", city: "", state: "", country: "", pinCode: "" },
};

function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadCompanies() {
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
      await loadCompanies();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to create company.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { width: "100%", padding: 8, marginTop: 4, marginBottom: 12 };
  const labelStyle = { fontSize: 13, fontWeight: 600 };

  return (
    <div>
      <h2>Companies</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Legal Name</th>
              <th style={{ padding: 8 }}>GST</th>
              <th style={{ padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 8 }}>{c.companyName}</td>
                <td style={{ padding: 8 }}>{c.legalCompanyName}</td>
                <td style={{ padding: 8 }}>{c.gstNumber}</td>
                <td style={{ padding: 8 }}>{c.status}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                  No companies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {user?.role === "superAdmin" && (
        <>
          <h3>Add Company</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 480 }}>
            <label style={labelStyle}>Company Name</label>
            <input style={inputStyle} value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} required />

            <label style={labelStyle}>Legal Company Name</label>
            <input style={inputStyle} value={form.legalCompanyName} onChange={(e) => updateField("legalCompanyName", e.target.value)} required />

            <label style={labelStyle}>Brand Name (optional)</label>
            <input style={inputStyle} value={form.brandName} onChange={(e) => updateField("brandName", e.target.value)} />

            <label style={labelStyle}>Company Type</label>
            <input style={inputStyle} value={form.companyType} onChange={(e) => updateField("companyType", e.target.value)} required />

            <label style={labelStyle}>GST Number</label>
            <input style={inputStyle} value={form.gstNumber} onChange={(e) => updateField("gstNumber", e.target.value)} required />

            <label style={labelStyle}>Website</label>
            <input style={inputStyle} value={form.website} onChange={(e) => updateField("website", e.target.value)} required />

            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />

            <label style={labelStyle}>Phone Number</label>
            <input style={inputStyle} value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required />

            <label style={labelStyle}>Address Line 1</label>
            <input style={inputStyle} value={form.address.line1} onChange={(e) => updateAddressField("line1", e.target.value)} required />

            <label style={labelStyle}>City</label>
            <input style={inputStyle} value={form.address.city} onChange={(e) => updateAddressField("city", e.target.value)} required />

            <label style={labelStyle}>State</label>
            <input style={inputStyle} value={form.address.state} onChange={(e) => updateAddressField("state", e.target.value)} required />

            <label style={labelStyle}>Country</label>
            <input style={inputStyle} value={form.address.country} onChange={(e) => updateAddressField("country", e.target.value)} required />

            <label style={labelStyle}>PIN Code</label>
            <input style={inputStyle} value={form.address.pinCode} onChange={(e) => updateAddressField("pinCode", e.target.value)} required />

            {formError && <p style={{ color: "var(--color-danger)" }}>{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
            >
              {submitting ? "Creating..." : "Create Company"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default CompaniesPage;
