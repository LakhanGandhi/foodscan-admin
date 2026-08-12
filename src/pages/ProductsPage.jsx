import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listProducts, createProduct, updateProduct } from "../api/products";
import "../styles/shared.css";

const emptyForm = {
  companyId: "",
  brandId: "",
  productName: "",
  sku: "",
  category: "",
  countryOfOrigin: "",
  ingredientsText: "",
  allergensText: "",
  certificationsText: "",
  nutrition: { energy: "", protein: "", fat: "", saturatedFat: "", carbohydrates: "", sugars: "", fiber: "", sodium: "" },
};

const STATUS_OPTIONS = ["active", "hidden", "discontinued"];
const textareaStyle = {
  width: "100%",
  padding: 9,
  marginTop: 4,
  marginBottom: 14,
  minHeight: 60,
  resize: "vertical",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--color-text)",
};

// "a, b, c" -> ["a","b","c"], dropping empty entries
function parseCommaList(text) {
  return (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// active = success (in the catalog, visible); hidden/discontinued both get
// the neutral pill — neither is a safety concern, so they don't compete
// with the reserved warning/danger colors. The label text tells them apart.
function statusVariant(status) {
  return status === "active" ? "success" : "neutral";
}

function StatusPill({ status }) {
  return <span className={`status-pill status-pill--${statusVariant(status)}`}>{status}</span>;
}

function ProductsPage() {
  const { user } = useAuth();
  const canManage = ["superAdmin", "companyAdmin", "companyEmployee"].includes(user?.role);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await listProducts();
      setProducts(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateNutritionField(field, value) {
    setForm((prev) => ({ ...prev, nutrition: { ...prev.nutrition, [field]: value } }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const { ingredientsText, allergensText, certificationsText, nutrition, ...rest } = form;
      const payload = {
        ...rest,
        ingredients: parseCommaList(ingredientsText),
        allergens: parseCommaList(allergensText),
        certifications: parseCommaList(certificationsText),
        nutritionPer100g: nutrition,
      };
      if (user.role !== "superAdmin") delete payload.companyId;
      await createProduct(payload);
      setForm(emptyForm);
      setShowAddForm(false);
      await loadProducts();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(product) {
    setEditingProduct(product);
    setEditForm({
      productName: product.productName,
      sku: product.sku,
      category: product.category,
      countryOfOrigin: product.countryOfOrigin,
      brandId: product.brandId,
      ingredientsText: (product.ingredients || []).join(", "),
      allergensText: (product.allergens || []).join(", "),
      certificationsText: (product.certifications || []).join(", "),
      nutrition: {
        energy: product.nutritionPer100g?.energy || "",
        protein: product.nutritionPer100g?.protein || "",
        fat: product.nutritionPer100g?.fat || "",
        saturatedFat: product.nutritionPer100g?.saturatedFat || "",
        carbohydrates: product.nutritionPer100g?.carbohydrates || "",
        sugars: product.nutritionPer100g?.sugars || "",
        fiber: product.nutritionPer100g?.fiber || "",
        sodium: product.nutritionPer100g?.sodium || "",
      },
    });
    setEditStatus(product.status);
    setEditError("");
  }

  function cancelEdit() {
    setEditingProduct(null);
    setEditForm(null);
  }

  function updateEditField(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditNutritionField(field, value) {
    setEditForm((prev) => ({ ...prev, nutrition: { ...prev.nutrition, [field]: value } }));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditError("");
    setEditSubmitting(true);
    try {
      const { ingredientsText, allergensText, certificationsText, nutrition, ...rest } = editForm;
      await updateProduct(editingProduct._id, {
        ...rest,
        ingredients: parseCommaList(ingredientsText),
        allergens: parseCommaList(allergensText),
        certifications: parseCommaList(certificationsText),
        nutritionPer100g: nutrition,
        status: editStatus,
      });
      cancelEdit();
      await loadProducts();
    } catch (err) {
      setEditError(err.response?.data?.error?.message || "Failed to update product.");
    } finally {
      setEditSubmitting(false);
    }
  }

  const createFields = [
    ["productName", "Product Name"],
    ["sku", "SKU"],
    ["category", "Category"],
    ["countryOfOrigin", "Country of Origin"],
    ["brandId", "Brand ID"],
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        {canManage && (
          <button onClick={() => setShowAddForm((v) => !v)} className="icon-btn" title="Add Product">
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
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="id-cell">{p._id}</td>
                  <td>{p.productName}</td>
                  <td>{p.sku}</td>
                  <td>{p.category}</td>
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
              {products.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={6}>No products yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <>
          <h3>Add Product</h3>
          <form onSubmit={handleCreate} style={{ maxWidth: 700, margin: "0 auto" }}>
            {user.role === "superAdmin" && (
              <>
                <label className="field-label">Company ID</label>
                <input className="field-input" value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
              </>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {createFields.map(([key, label]) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={form[key]} onChange={(e) => updateField(key, e.target.value)} required />
                </div>
              ))}
            </div>

            <label className="field-label">Ingredients (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={form.ingredientsText}
              onChange={(e) => updateField("ingredientsText", e.target.value)}
              placeholder="Wheat flour, Sugar, Palm oil, Salt"
            />
            <label className="field-label">Allergens (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={form.allergensText}
              onChange={(e) => updateField("allergensText", e.target.value)}
              placeholder="Wheat (Gluten), Soy, Milk"
            />
            <label className="field-label">Certifications (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={form.certificationsText}
              onChange={(e) => updateField("certificationsText", e.target.value)}
              placeholder="ISO 22000, FSSC 22000"
            />

            <label className="field-label" style={{ marginTop: 8 }}>
              Nutrition (per 100g)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                ["energy", "Energy (e.g. 462 kcal)"],
                ["protein", "Protein (e.g. 7.1 g)"],
                ["fat", "Fat (e.g. 16.8 g)"],
                ["saturatedFat", "Saturated Fat (e.g. 8.2 g)"],
                ["carbohydrates", "Carbohydrates (e.g. 70.4 g)"],
                ["sugars", "Sugars (e.g. 18.2 g)"],
                ["fiber", "Fiber (e.g. 3.1 g)"],
                ["sodium", "Sodium (e.g. 410 mg)"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={form.nutrition[key]} onChange={(e) => updateNutritionField(key, e.target.value)} />
                </div>
              ))}
            </div>

            {formError && <p className="alert-banner--danger">{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={submitting} className="btn btn--primary">
                {submitting ? "Creating..." : "Create Product"}
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

      {editingProduct && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingProduct.productName}</h3>
            <button onClick={cancelEdit} className="icon-btn" title="Cancel">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                ["productName", "Product Name"],
                ["sku", "SKU"],
                ["category", "Category"],
                ["countryOfOrigin", "Country of Origin"],
                ["brandId", "Brand ID"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={editForm[key]} onChange={(e) => updateEditField(key, e.target.value)} required />
                </div>
              ))}
            </div>

            <label className="field-label">Ingredients (comma-separated)</label>
            <textarea style={textareaStyle} value={editForm.ingredientsText} onChange={(e) => updateEditField("ingredientsText", e.target.value)} />
            <label className="field-label">Allergens (comma-separated)</label>
            <textarea style={textareaStyle} value={editForm.allergensText} onChange={(e) => updateEditField("allergensText", e.target.value)} />
            <label className="field-label">Certifications (comma-separated)</label>
            <textarea style={textareaStyle} value={editForm.certificationsText} onChange={(e) => updateEditField("certificationsText", e.target.value)} />

            <label className="field-label" style={{ marginTop: 8 }}>
              Nutrition (per 100g)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                ["energy", "Energy"],
                ["protein", "Protein"],
                ["fat", "Fat"],
                ["saturatedFat", "Saturated Fat"],
                ["carbohydrates", "Carbohydrates"],
                ["sugars", "Sugars"],
                ["fiber", "Fiber"],
                ["sodium", "Sodium"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input className="field-input" value={editForm.nutrition[key]} onChange={(e) => updateEditNutritionField(key, e.target.value)} />
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

export default ProductsPage;
