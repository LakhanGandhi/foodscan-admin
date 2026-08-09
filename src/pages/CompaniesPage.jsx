import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listCompanies, getCompany, createCompany, updateCompany, changeCompanyStatus } from "../api/companies";
import { getPendingForCompany, listPendingChangeRequests, approveChangeRequest, rejectChangeRequest } from "../api/changeRequests";

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
  const isCompanyAdmin = user?.role === "companyAdmin";

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

  // Super Admin "pending change requests" review state
  const [pendingChangeRequests, setPendingChangeRequests] = useState([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(true);
  const [pendingRequestsError, setPendingRequestsError] = useState("");
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Company Admin "my company" state
  const [myCompany, setMyCompany] = useState(null);
  const [myCompanyLoading, setMyCompanyLoading] = useState(true);
  const [myCompanyError, setMyCompanyError] = useState("");
  const [myCompanyForm, setMyCompanyForm] = useState(null);
  const [myCompanySubmitting, setMyCompanySubmitting] = useState(false);
  const [myCompanySaveError, setMyCompanySaveError] = useState("");
  const [myCompanySaved, setMyCompanySaved] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [pendingRequestLoading, setPendingRequestLoading] = useState(true);

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

  async function loadMyCompany() {
    if (!isCompanyAdmin) {
      setMyCompanyLoading(false);
      return;
    }
    setMyCompanyLoading(true);
    try {
      const data = await getCompany(user.companyId);
      setMyCompany(data);
      setMyCompanyForm({
        companyName: data.companyName,
        legalCompanyName: data.legalCompanyName,
        companyType: data.companyType,
        website: data.website,
        email: data.email,
        phoneNumber: data.phoneNumber,
      });
      setMyCompanyError("");
    } catch (err) {
      setMyCompanyError(err.response?.data?.error?.message || "Failed to load your company.");
    } finally {
      setMyCompanyLoading(false);
    }
  }

  async function loadPendingRequest() {
    if (!isCompanyAdmin) {
      setPendingRequestLoading(false);
      return;
    }
    setPendingRequestLoading(true);
    try {
      const data = await getPendingForCompany(user.companyId);
      setPendingRequest(data);
    } catch (err) {
      // Non-fatal: if this fails, the form just behaves as if there's no pending request.
      setPendingRequest(null);
    } finally {
      setPendingRequestLoading(false);
    }
  }

  async function loadPendingChangeRequests() {
    if (!isSuperAdmin) {
      setPendingRequestsLoading(false);
      return;
    }
    setPendingRequestsLoading(true);
    try {
      const data = await listPendingChangeRequests();
      setPendingChangeRequests(data);
      setPendingRequestsError("");
    } catch (err) {
      setPendingRequestsError(err.response?.data?.error?.message || "Failed to load pending requests.");
    } finally {
      setPendingRequestsLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
    loadMyCompany();
    loadPendingRequest();
    loadPendingChangeRequests();
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

  function companyNameFor(companyId) {
    const match = companies.find((c) => c._id === companyId);
    return match ? match.companyName : companyId;
  }

  function companyById(companyId) {
    return companies.find((c) => c._id === companyId) || null;
  }

  function startReview(request) {
    setReviewingRequest(request);
    setReviewError("");
  }

  function cancelReview() {
    setReviewingRequest(null);
    setReviewError("");
  }

  async function handleApproveRequest() {
    setReviewError("");
    setReviewSubmitting(true);
    try {
      await approveChangeRequest(reviewingRequest._id);
      setReviewingRequest(null);
      await Promise.all([loadPendingChangeRequests(), loadCompanies()]);
    } catch (err) {
      setReviewError(err.response?.data?.error?.message || "Failed to approve request.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleRejectRequest() {
    setReviewError("");
    setReviewSubmitting(true);
    try {
      await rejectChangeRequest(reviewingRequest._id);
      setReviewingRequest(null);
      await loadPendingChangeRequests();
    } catch (err) {
      setReviewError(err.response?.data?.error?.message || "Failed to reject request.");
    } finally {
      setReviewSubmitting(false);
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

  function updateMyCompanyField(field, value) {
    setMyCompanyForm((prev) => ({ ...prev, [field]: value }));
    setMyCompanySaved(false);
  }

  async function handleSaveMyCompany(e) {
    e.preventDefault();
    setMyCompanySaveError("");
    setMyCompanySaved(false);
    setMyCompanySubmitting(true);
    try {
      await updateCompany(user.companyId, myCompanyForm);
      setMyCompanySaved(true);
      await loadPendingRequest();
    } catch (err) {
      setMyCompanySaveError(err.response?.data?.error?.message || "Failed to submit change request.");
    } finally {
      setMyCompanySubmitting(false);
    }
  }

  // --- Company Admin view: their own company only ---
  if (isCompanyAdmin) {
    return (
      <div>
        <h2 style={{ margin: 0 }}>My Company</h2>

        {myCompanyLoading && <p>Loading...</p>}
        {myCompanyError && <p style={{ color: "var(--color-danger)" }}>{myCompanyError}</p>}

        {!myCompanyLoading && !myCompanyError && myCompanyForm && (
          <div style={{ marginTop: 20, maxWidth: 700 }}>
            <div style={{ marginBottom: 16, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Status: </span>
              <span>{myCompany?.status}</span>
            </div>

            {pendingRequest && (
              <div
                style={{
                  background: "#FFF7E6",
                  border: "1px solid #F0C36D",
                  borderRadius: 6,
                  padding: "12px 16px",
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                <strong>Pending approval:</strong> you have a change request awaiting Super Admin review. You
                can't submit another change until this one is approved or rejected.
              </div>
            )}

            <form onSubmit={handleSaveMyCompany}>
              <fieldset
                disabled={!!pendingRequest || pendingRequestLoading}
                style={{ border: "none", padding: 0, margin: 0 }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <div>
                    <label style={labelStyle}>Company Name</label>
                    <input
                      style={inputStyle}
                      value={myCompanyForm.companyName}
                      onChange={(e) => updateMyCompanyField("companyName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Legal Company Name</label>
                    <input
                      style={inputStyle}
                      value={myCompanyForm.legalCompanyName}
                      onChange={(e) => updateMyCompanyField("legalCompanyName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Company Type</label>
                    <input
                      style={inputStyle}
                      value={myCompanyForm.companyType}
                      onChange={(e) => updateMyCompanyField("companyType", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <input
                      style={inputStyle}
                      value={myCompanyForm.website}
                      onChange={(e) => updateMyCompanyField("website", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      style={inputStyle}
                      type="email"
                      value={myCompanyForm.email}
                      onChange={(e) => updateMyCompanyField("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      style={inputStyle}
                      value={myCompanyForm.phoneNumber}
                      onChange={(e) => updateMyCompanyField("phoneNumber", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {myCompanySaveError && <p style={{ color: "var(--color-danger)" }}>{myCompanySaveError}</p>}
                {myCompanySaved && <p style={{ color: "var(--color-primary)" }}>Submitted for Super Admin approval.</p>}

                <button
                  type="submit"
                  disabled={myCompanySubmitting || !!pendingRequest || pendingRequestLoading}
                  style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
                >
                  {myCompanySubmitting ? "Submitting..." : "Submit for Approval"}
                </button>
              </fieldset>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div>
        <h2>Companies</h2>
        <p style={{ color: "var(--color-text-muted)" }}>You do not have access to company information.</p>
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

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <h3 style={{ margin: 0 }}>Pending Requests</h3>
      </div>

      {pendingRequestsLoading && <p>Loading...</p>}
      {pendingRequestsError && <p style={{ color: "var(--color-danger)" }}>{pendingRequestsError}</p>}

      {!pendingRequestsLoading && !pendingRequestsError && (
        <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--color-border)", marginBottom: 24, marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card)" }}>
                <th style={{ padding: 8 }}>Company ID</th>
                <th style={{ padding: 8 }}>Company Name</th>
                <th style={{ padding: 8 }}>Requested On</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {pendingChangeRequests.map((r) => (
                <tr key={r._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{r.companyId}</td>
                  <td style={{ padding: 8 }}>{companyNameFor(r.companyId)}</td>
                  <td style={{ padding: 8 }}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => startReview(r)} style={iconBtnStyle} title="Review">
                      <Pencil size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {pendingChangeRequests.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                    No pending requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reviewingRequest && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Review Request: {companyNameFor(reviewingRequest.companyId)}</h3>
            <button onClick={cancelReview} style={iconBtnStyle} title="Cancel">
              <X size={20} />
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: 8 }}>Field</th>
                <th style={{ padding: 8 }}>Current</th>
                <th style={{ padding: 8 }}>Proposed</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(reviewingRequest.proposedChanges).map(([field, newValue]) => {
                const current = companyById(reviewingRequest.companyId);
                return (
                  <tr key={field} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{field}</td>
                    <td style={{ padding: 8, color: "var(--color-text-muted)" }}>{current ? current[field] : "—"}</td>
                    <td style={{ padding: 8 }}>{newValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {reviewError && <p style={{ color: "var(--color-danger)" }}>{reviewError}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={handleApproveRequest}
              disabled={reviewSubmitting}
              style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
            >
              {reviewSubmitting ? "Working..." : "Approve"}
            </button>
            <button
              onClick={handleRejectRequest}
              disabled={reviewSubmitting}
              style={{ padding: "10px 20px", border: "1px solid var(--color-danger)", borderRadius: 999, background: "#fff", color: "var(--color-danger)", cursor: "pointer" }}
            >
              Reject
            </button>
            <button
              type="button"
              onClick={cancelReview}
              disabled={reviewSubmitting}
              style={{ padding: "10px 20px", border: "1px solid var(--color-border)", borderRadius: 999, background: "#fff", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
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
