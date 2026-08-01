import { useEffect, useState } from "react";
import { Plus, Power, KeyRound, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listUsers, createUser, changeUserStatus, resetUserPassword } from "../api/users";

const emptyForm = { name: "", email: "", password: "", role: "companyEmployee", companyId: "" };
const inputStyle = { width: "100%", padding: 8, marginTop: 4, marginBottom: 12 };
const labelStyle = { fontSize: 13, fontWeight: 600 };
const iconBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "var(--color-primary)" };

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
        <button onClick={() => setShowAddForm((v) => !v)} style={iconBtnStyle} title="Add User">
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
                <th style={{ padding: 8 }}>Email</th>
                <th style={{ padding: 8 }}>Role</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{u.id}</td>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>{u.role}</td>
                  <td style={{ padding: 8 }}>{u.status}</td>
                  <td style={{ padding: 8, display: "flex", gap: 8 }}>
                    <button onClick={() => handleToggleStatus(u)} style={iconBtnStyle} title={u.status === "active" ? "Disable" : "Enable"}>
                      <Power size={18} />
                    </button>
                    <button onClick={() => startReset(u)} style={iconBtnStyle} title="Reset Password">
                      <KeyRound size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                    No employees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <>
          <h3>Add User</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 700 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="text" value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
              </div>
              {isSuperAdmin && (
                <>
                  <div>
                    <label style={labelStyle}>Role</label>
                    <select style={inputStyle} value={form.role} onChange={(e) => updateField("role", e.target.value)}>
                      <option value="companyEmployee">companyEmployee</option>
                      <option value="companyAdmin">companyAdmin</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Company ID</label>
                    <input style={inputStyle} value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
                  </div>
                </>
              )}
            </div>

            {formError && <p style={{ color: "var(--color-danger)" }}>{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
              >
                {submitting ? "Creating..." : "Create User"}
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

      {resettingUser && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Reset Password: {resettingUser.name}</h3>
            <button onClick={cancelReset} style={iconBtnStyle} title="Close">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleResetPassword}>
            <label style={labelStyle}>New Password</label>
            <input style={inputStyle} type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            {resetError && <p style={{ color: "var(--color-danger)" }}>{resetError}</p>}
            {resetSuccess && <p style={{ color: "var(--color-primary)" }}>{resetSuccess}</p>}
            <button
              type="submit"
              disabled={resetSubmitting}
              style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
            >
              {resetSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;
