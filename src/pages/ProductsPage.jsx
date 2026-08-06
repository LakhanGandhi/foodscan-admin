import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listProducts, createProduct, updateProduct } from "../api/products";

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
const inputStyle = { width: "100%", padding: 8, marginTop: 4, marginBottom: 12 };
const textareaStyle = { ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" };
const labelStyle = { fontSize: 13, fontWeight: 600 };
const iconBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "var(--color-primary)" };

// "a, b, c" -> ["a","b","c"], dropping empty entries
function parseCommaList(text) {
  return (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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
          <button onClick={() => setShowAddForm((v) => !v)} style={iconBtnStyle} title="Add Product">
            <Plus size={22} />
          </button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--color-border)", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-card)" }}>
                <th style={{ padding: 8 }}>ID</th>
                <th style={{ padding: 8 }}>Product Name</th>
                <th style={{ padding: 8 }}>SKU</th>
                <th style={{ padding: 8 }}>Category</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{p._id}</td>
                  <td style={{ padding: 8 }}>{p.productName}</td>
                  <td style={{ padding: 8 }}>{p.sku}</td>
                  <td style={{ padding: 8 }}>{p.category}</td>
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
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 8, color: "var(--color-text-muted)" }}>
                    No products yet.
                  </td>
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
                <label style={labelStyle}>Company ID</label>
                <input style={inputStyle} value={form.companyId} onChange={(e) => updateField("companyId", e.target.value)} required />
              </>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {createFields.map(([key, label]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={form[key]} onChange={(e) => updateField(key, e.target.value)} required />
                </div>
              ))}
            </div>

            <label style={labelStyle}>Ingredients (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={form.ingredientsText}
              onChange={(e) => updateField("ingredientsText", e.target.value)}
              placeholder="Wheat flour, Sugar, Palm oil, Salt"
            />
            <label style={labelStyle}>Allergens (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={form.allergensText}
              onChange={(e) => updateField("allergensText", e.target.value)}
              placeholder="Wheat (Gluten), Soy, Milk"
            />
            <label style={labelStyle}>Certifications (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={form.certificationsText}
              onChange={(e) => updateField("certificationsText", e.target.value)}
              placeholder="ISO 22000, FSSC 22000"
            />

            <label style={{ ...labelStyle, display: "block", marginTop: 8 }}>Nutrition (per 100g)</label>
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
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={form.nutrition[key]} onChange={(e) => updateNutritionField(key, e.target.value)} />
                </div>
              ))}
            </div>

            {formError && <p style={{ color: "var(--color-danger)" }}>{formError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: "10px 20px", border: "none", borderRadius: 999, background: "var(--color-primary)", color: "#fff", cursor: "pointer" }}
              >
                {submitting ? "Creating..." : "Create Product"}
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

      {editingProduct && (
        <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border)", paddingTop: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Edit: {editingProduct.productName}</h3>
            <button onClick={cancelEdit} style={iconBtnStyle} title="Cancel">
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
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={editForm[key]} onChange={(e) => updateEditField(key, e.target.value)} required />
                </div>
              ))}
            </div>

            <label style={labelStyle}>Ingredients (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={editForm.ingredientsText}
              onChange={(e) => updateEditField("ingredientsText", e.target.value)}
            />
            <label style={labelStyle}>Allergens (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={editForm.allergensText}
              onChange={(e) => updateEditField("allergensText", e.target.value)}
            />
            <label style={labelStyle}>Certifications (comma-separated)</label>
            <textarea
              style={textareaStyle}
              value={editForm.certificationsText}
              onChange={(e) => updateEditField("certificationsText", e.target.value)}
            />

            <label style={{ ...labelStyle, display: "block", marginTop: 8 }}>Nutrition (per 100g)</label>
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
                  <label style={labelStyle}>{label}</label>
                  <input style={inputStyle} value={editForm.nutrition[key]} onChange={(e) => updateEditNutritionField(key, e.target.value)} />
                </div>
              ))}
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

export default ProductsPage;
