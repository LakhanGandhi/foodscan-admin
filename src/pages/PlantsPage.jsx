import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listPlants, createPlant, updatePlant } from "../api/plants";

const emptyForm = {
  companyId: "",
  plantName: "",
  plantCode: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pinCode: "",
  contactPerson: "",
  contactNumber: "",
  email: "",
  fssaiLicense: "",
};

const STATUS_OPTIONS = ["active", "inactive"];
const inputStyle = { width: "100%", padding: 8, marginTop: 4, marginBottom: 12 };
const labelStyle = { fontSize: 13, fontWeight: 600 };
const iconBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "var(--color-primary)" };

function PlantsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "superAdmin" || user?.role === "companyAdmin";

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingPlant, setEditingPlant] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadPlants() {
    setLoading(true);
    try {
      const data = await listPlants();
      setPlants(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load plants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlants();
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
      await createPlant(payload);
      setForm(emptyForm);
      setShowAddForm(false);
      await loadPlants();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to create plant.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(plant) {
    setEditingPlant(plant);
    setEditForm({
      plantName: plant.plantName,
      plantCode: plant.plantCode,
      address: plant.address,
      city: plant.city,
      state: plant.state,
      country: plant.country,
      pinCode: plant.pinCode,
      contactPerson: plant.contactPerson,
      contactNumber: plant.contactNumber,
      email: plant.email,
      fssaiLicense: plant.fssaiLicense,
    });
    setEditStatus(plant.status);
    setEditError("");
  }

  function cancelEdit() {
    setEditingPlant(null);
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
      await updatePlant(editingPlant._id, { ...editForm, status: editStatus });
      cancelEdit();
      await loadPlants();
    } catch (err) {
      setEditError(err.response?.data?.error?.message || "Failed to update plant.");
    } finally {
      setEditSubmitting(false);
    }
  }

  const fields = [
    ["plantName", "Plant Name"],
    ["plantCode", "Plant Code"],
    ["address", "Address"],
    ["city", "City"],
    ["state", "State"],
    ["country", "Country"],
    ["pinCode", "PIN Code"],
    ["contactPerson", "Contact Person"],
    ["contactNumber", "Contact Number"],
    ["email", "Email"],
    ["fssaiLicense", "FSSAI License"],
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Plants</h2>
        {canManage && (
          <button onClick={() => setShowAddForm((v) => !v)} style={iconBtnStyle} title="Add Plant">
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
              <th style={{ padding: 8 }}>Plant Name</th>
              <th style={{ padding: 8 }}>Code</th>
              <th style={{ padding: 8 }}>City</th>
              <th style={{ padding: 8 }}>FSSAI</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {plants.map((p) => (
              <tr key={p._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{p._id}</td>
                <td style={{ padding: 8 }}>{p.plantName}</td>
                <td style={{ padding: 8 }}>{p.plantCode}</td>
                <td style={{ padding: 8 }}>{p.city}</td>
                <td style={{ padding: 8 }}>{p.fssaiLicense}</td>
                <td style={{ padding: 8 }}>{p.status}</td>
                <td style={{ padding: 8 }}>
                  {canManage && (
                    <button onClick={() => startEdit(p)} style={iconBtnStyle} title="Edit">
                      <Pencil size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {plants.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                  No plants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showAddForm && (
        <>
          <h3>Add Plant</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 480 }}>
            {user.role === "superAdmin" && (
              <>
                <label style={labelStyle}>Company ID</label>
                <input style={inputStyle} value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
              </>
            )}
            {fields.map(([key, label]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input style={inputStyle} value={form[key]} onChange={(e) => updateField(key, e.target.value)} required />
              </div>
            ))}
            {formError && <p style={{ color: "var(--color-danger)" }}>{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
              >
                {submitting ? "Creating..." : "Create Plant"}
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

      {editingPlant && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingPlant.plantName}</h3>
            <button onClick={cancelEdit} style={iconBtnStyle} title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            {fields.map(([key, label]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input style={inputStyle} value={editForm[key]} onChange={(e) => updateEditField(key, e.target.value)} required />
              </div>
            ))}
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

export default PlantsPage;
