import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listPlants, createPlant, updatePlant } from "../api/plants";
import "../styles/shared.css";

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

function statusVariant(status) {
  return status === "active" ? "success" : "neutral";
}

function StatusPill({ status }) {
  return <span className={`status-pill status-pill--${statusVariant(status)}`}>{status}</span>;
}

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
          <button onClick={() => setShowAddForm((v) => !v)} className="icon-btn" title="Add Plant">
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
                <th>Plant Name</th>
                <th>Company Name</th>
                <th>Code</th>
                <th>City</th>
                <th>FSSAI</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plants.map((p) => (
                <tr key={p._id}>
                  <td className="id-cell">{p._id}</td>
                  <td>{p.plantName}</td>
                  <td>{p.companyName}</td>
                  <td>{p.plantCode}</td>
                  <td>{p.city}</td>
                  <td className="id-cell">{p.fssaiLicense}</td>
                  <td>
                    <StatusPill status={p.status} />
                  </td>
                  <td>
                    {canManage && (
                      <button onClick={() => startEdit(p)} className="icon-btn" title="Edit">
                        <Pencil size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {plants.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={8}>No plants yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <>
          <h3>Add Plant</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 700, margin: "0 auto" }}>
            {user.role === "superAdmin" && (
              <>
                <label className="field-label">Company ID</label>
                <input className="field-input" value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
              </>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {fields.map(([key, label]) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={form[key]} onChange={(e) => updateField(key, e.target.value)} required />
                </div>
              ))}
            </div>
            {formError && <p className="alert-banner--danger">{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} className="btn btn--primary">
                {submitting ? "Creating..." : "Create Plant"}
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

      {editingPlant && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingPlant.plantName}</h3>
            <button onClick={cancelEdit} className="icon-btn" title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {fields.map(([key, label]) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={editForm[key]} onChange={(e) => updateEditField(key, e.target.value)} required />
                </div>
              ))}
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

export default PlantsPage;
