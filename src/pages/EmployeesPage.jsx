import { useEffect, useState } from "react";
import { Plus, Power, KeyRound, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listUsers, createUser, changeUserStatus, resetUserPassword } from "../api/users";
import "../styles/shared.css";

const emptyForm = { name: "", email: "", password: "", role: "companyEmployee", companyId: "" };

function statusVariant(status) {
  return status === "active" ? "success" : "neutral";
}

function StatusPill({ status }) {
  return <span className={`status-pill status-pill--${statusVariant(status)}`}>{status}</span>;
}

function EmployeesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superAdmin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (isSuperAdmin) payload.companyId = form.companyId;
      await createUser(payload);
      setForm(emptyForm);
      setShowAddForm(false);
      await loadUsers();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(u) {
    const nextStatus = u.status === "active" ? "disabled" : "active";
    if (!window.confirm(`Set ${u.name}'s account to "${nextStatus}"?`)) return;
    try {
      await changeUserStatus(u.id, nextStatus);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to update status.");
    }
  }

  function startReset(u) {
    setResettingUser(u);
    setNewPassword("");
    setResetError("");
    setResetSuccess("");
  }

  function cancelReset() {
    setResettingUser(null);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setResetError("");
    setResetSubmitting(true);
    try {
      await resetUserPassword(resettingUser.id, newPassword);
      setResetSuccess("Password reset. The user must log in again.");
      setNewPassword("");
    } catch (err) {
      setResetError(err.response?.data?.error?.message || "Failed to reset password.");
    } finally {
      setResetSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Employees</h2>
        <button onClick={() => setShowAddForm((v) => !v)} className="icon-btn" title="Add User">
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
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="id-cell">{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <StatusPill status={u.status} />
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleToggleStatus(u)} className="icon-btn" title={u.status === "active" ? "Disable" : "Enable"}>
                      <Power size={18} />
                    </button>
                    <button onClick={() => startReset(u)} className="icon-btn" title="Reset Password">
                      <KeyRound size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={6}>No employees yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <>
          <h3>Add User</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div>
                <label className="field-label">Name</label>
                <input className="field-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input className="field-input" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input className="field-input" type="text" value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
              </div>
              {isSuperAdmin && (
                <>
                  <div>
                    <label className="field-label">Role</label>
                    <select className="field-input" value={form.role} onChange={(e) => updateField("role", e.target.value)}>
                      <option value="companyEmployee">companyEmployee</option>
                      <option value="companyAdmin">companyAdmin</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Company ID</label>
                    <input className="field-input" value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
                  </div>
                </>
              )}
            </div>

            {formError && <p className="alert-banner--danger">{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} className="btn btn--primary">
                {submitting ? "Creating..." : "Create User"}
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

      {resettingUser && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Reset Password: {resettingUser.name}</h3>
            <button onClick={cancelReset} className="icon-btn" title="Close">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleResetPassword}>
            <label className="field-label">New Password</label>
            <input className="field-input" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            {resetError && <p className="alert-banner--danger">{resetError}</p>}
            {resetSuccess && <p className="alert-banner--success">{resetSuccess}</p>}
            <button type="submit" disabled={resetSubmitting} className="btn btn--primary">
              {resetSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;
