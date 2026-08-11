import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listCompanies, getCompany, createCompany, updateCompany, changeCompanyStatus } from "../api/companies";
import { getPendingForCompany, listPendingChangeRequests, approveChangeRequest, rejectChangeRequest } from "../api/changeRequests";
import "../styles/shared.css";

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

// Status -> pill color. Reserved vocabulary: success = approved,
// warning = pending, danger = suspended (serious block), neutral = disabled
// (deliberately turned off, not alarming).
function statusVariant(status) {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "suspended":
      return "danger";
    default:
      return "neutral";
  }
}

function StatusPill({ status }) {
  return <span className={`status-pill status-pill--${statusVariant(status)}`}>{status}</span>;
}

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
        {myCompanyError && <p className="alert-banner--danger">{myCompanyError}</p>}

        {!myCompanyLoading && !myCompanyError && myCompanyForm && (
          <div style={{ marginTop: 20, maxWidth: 700 }}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Status:</span>
              {myCompany?.status && <StatusPill status={myCompany.status} />}
            </div>

            {pendingRequest && (
              <div className="alert-banner alert-banner--warning">
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
                    <label className="field-label">Company Name</label>
                    <input
                      className="field-input"
                      value={myCompanyForm.companyName}
                      onChange={(e) => updateMyCompanyField("companyName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Legal Company Name</label>
                    <input
                      className="field-input"
                      value={myCompanyForm.legalCompanyName}
                      onChange={(e) => updateMyCompanyField("legalCompanyName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Company Type</label>
                    <input
                      className="field-input"
                      value={myCompanyForm.companyType}
                      onChange={(e) => updateMyCompanyField("companyType", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Website</label>
                    <input
                      className="field-input"
                      value={myCompanyForm.website}
                      onChange={(e) => updateMyCompanyField("website", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Email</label>
                    <input
                      className="field-input"
                      type="email"
                      value={myCompanyForm.email}
                      onChange={(e) => updateMyCompanyField("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Phone Number</label>
                    <input
                      className="field-input"
                      value={myCompanyForm.phoneNumber}
                      onChange={(e) => updateMyCompanyField("phoneNumber", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {myCompanySaveError && <p className="alert-banner--danger">{myCompanySaveError}</p>}
                {myCompanySaved && <p className="alert-banner--success">Submitted for Super Admin approval.</p>}

                <button
                  type="submit"
                  disabled={myCompanySubmitting || !!pendingRequest || pendingRequestLoading}
                  className="btn btn--primary"
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
        <button onClick={() => setShowAddForm((v) => !v)} className="icon-btn" title="Add Company">
          <Plus size={22} />
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="alert-banner--danger">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Legal Name</th>
                <th>GST</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c._id}>
                  <td className="id-cell">{c._id}</td>
                  <td>{c.companyName}</td>
                  <td>{c.legalCompanyName}</td>
                  <td>{c.gstNumber}</td>
                  <td>
                    <StatusPill status={c.status} />
                  </td>
                  <td>
                    <button onClick={() => startEdit(c)} className="icon-btn" title="Edit">
                      <Pencil size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={6}>No companies yet.</td>
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
      {pendingRequestsError && <p className="alert-banner--danger">{pendingRequestsError}</p>}

      {!pendingRequestsLoading && !pendingRequestsError && (
        <div className="table-wrapper" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company ID</th>
                <th>Company Name</th>
                <th>Requested On</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pendingChangeRequests.map((r) => (
                <tr key={r._id}>
                  <td className="id-cell">{r.companyId}</td>
                  <td>{companyNameFor(r.companyId)}</td>
                  <td className="tabular-nums">{new Date(r.createdAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => startReview(r)} className="icon-btn" title="Review">
                      <Pencil size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {pendingChangeRequests.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={4}>No pending requests.</td>
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
            <button onClick={cancelReview} className="icon-btn" title="Cancel">
              <X size={20} />
            </button>
          </div>

          <table className="data-table diff-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Field</th>
                <th>Current</th>
                <th>Proposed</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(reviewingRequest.proposedChanges).map(([field, newValue]) => {
                const current = companyById(reviewingRequest.companyId);
                return (
                  <tr key={field}>
                    <td style={{ fontWeight: 600 }}>{field}</td>
                    <td className="diff-current">{current ? current[field] : "—"}</td>
                    <td className="diff-proposed">{newValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {reviewError && <p className="alert-banner--danger">{reviewError}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={handleApproveRequest} disabled={reviewSubmitting} className="btn btn--success">
              {reviewSubmitting ? "Working..." : "Approve"}
            </button>
            <button onClick={handleRejectRequest} disabled={reviewSubmitting} className="btn btn--danger-outline">
              Reject
            </button>
            <button type="button" onClick={cancelReview} disabled={reviewSubmitting} className="btn btn--neutral-outline">
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
                <label className="field-label">Company Name</label>
                <input className="field-input" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Legal Company Name</label>
                <input className="field-input" value={form.legalCompanyName} onChange={(e) => updateField("legalCompanyName", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Company Type</label>
                <input className="field-input" value={form.companyType} onChange={(e) => updateField("companyType", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">GST Number</label>
                <input className="field-input" value={form.gstNumber} onChange={(e) => updateField("gstNumber", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Website</label>
                <input className="field-input" value={form.website} onChange={(e) => updateField("website", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input className="field-input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Phone Number</label>
                <input className="field-input" value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Address Line 1</label>
                <input className="field-input" value={form.address.line1} onChange={(e) => updateAddressField("line1", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">City</label>
                <input className="field-input" value={form.address.city} onChange={(e) => updateAddressField("city", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">State</label>
                <input className="field-input" value={form.address.state} onChange={(e) => updateAddressField("state", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Country</label>
                <input className="field-input" value={form.address.country} onChange={(e) => updateAddressField("country", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">PIN Code</label>
                <input className="field-input" value={form.address.pinCode} onChange={(e) => updateAddressField("pinCode", e.target.value)} required />
              </div>
            </div>

            {formError && <p className="alert-banner--danger">{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} className="btn btn--primary">
                {submitting ? "Creating..." : "Create Company"}
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

      {editingCompany && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingCompany.companyName}</h3>
            <button onClick={cancelEdit} className="icon-btn" title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div>
                <label className="field-label">Company Name</label>
                <input className="field-input" value={editForm.companyName} onChange={(e) => updateEditField("companyName", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Legal Company Name</label>
                <input className="field-input" value={editForm.legalCompanyName} onChange={(e) => updateEditField("legalCompanyName", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Company Type</label>
                <input className="field-input" value={editForm.companyType} onChange={(e) => updateEditField("companyType", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Website</label>
                <input className="field-input" value={editForm.website} onChange={(e) => updateEditField("website", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input className="field-input" type="email" value={editForm.email} onChange={(e) => updateEditField("email", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Phone Number</label>
                <input className="field-input" value={editForm.phoneNumber} onChange={(e) => updateEditField("phoneNumber", e.target.value)} required />
              </div>
            </div>

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

export default CompaniesPage;
