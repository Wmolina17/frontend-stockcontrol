import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, ConfirmDialog, DataTable, EmptyState, IconBtn, Modal, PageHeader, SearchInput, StockStatus } from "../components/ui";
import { Filter, Pencil, Plus, Save, Trash2 } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../lib/api";
import { categoryName, formatCOP } from "../lib/format";

function emptyProduct() {
  return { id: null, name: "", description: "", categoryId: "", price: "", stock: "", minimumStock: "10" };
}

export default function Productos() {
  const { can } = useAuth();
  const { showToast, Toast } = useToast();
  const canWrite = can("products:create");
  const canUpdate = can("products:update");
  const canDelete = can("products:delete");
  const canCatCreate = can("categories:create");
  const canCatUpdate = can("categories:update");
  const canCatDelete = can("categories:delete");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct());
  const [errors, setErrors] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [catForm, setCatForm] = useState({ id: null, name: "", description: "" });
  const [catOpen, setCatOpen] = useState(false);
  const [catError, setCatError] = useState("");

  const isEditing = Boolean(form.id);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", sort: "name", order: "asc" });
      if (query.trim()) params.set("search", query.trim());
      if (categoryFilter) params.set("categoryId", categoryFilter);
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get("/products/categories"),
      ]);
      setProducts(prodRes.data || []);
      setMeta(prodRes.meta || { total: prodRes.data?.length || 0 });
      setCategories(catRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= (p.minimumStock ?? 10)).length,
    [products]
  );

  function openCreate() {
    setForm({ ...emptyProduct(), categoryId: categories[0]?._id || "" });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(product) {
    setForm({
      id: product._id,
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId?._id || product.categoryId || "",
      price: String(product.price),
      stock: String(product.stock),
      minimumStock: String(product.minimumStock ?? 10),
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(f) {
    const e = {};
    if (!f.name.trim()) e.name = "El nombre es obligatorio.";
    if (!f.categoryId) e.categoryId = "Selecciona una categoría.";
    if (f.price === "" || Number(f.price) < 0) e.price = "Ingresa un precio válido.";
    if (!isEditing && (f.stock === "" || Number(f.stock) < 0 || !Number.isInteger(Number(f.stock)))) {
      e.stock = "Ingresa una cantidad entera válida.";
    }
    if (f.minimumStock === "" || Number(f.minimumStock) < 0) e.minimumStock = "Ingresa un mínimo válido.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/products/${form.id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          price: Number(form.price),
          minimumStock: Number(form.minimumStock),
        });
        showToast("Producto actualizado correctamente.");
      } else {
        await api.post("/products", {
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          price: Number(form.price),
          stock: Number(form.stock),
          minimumStock: Number(form.minimumStock),
        });
        showToast("Producto creado correctamente.");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id) {
    try {
      await api.delete(`/products/${id}`);
      setConfirmDeleteId(null);
      showToast("Producto eliminado.");
      await load();
    } catch (err) {
      showToast(err.message);
      setConfirmDeleteId(null);
    }
  }

  function openCategory(category = null) {
    setCatForm(category
      ? { id: category._id, name: category.name, description: category.description || "" }
      : { id: null, name: "", description: "" });
    setCatError("");
    setCatOpen(true);
  }

  async function saveCategory(e) {
    e.preventDefault();
    if (!catForm.name.trim()) {
      setCatError("El nombre de la categoría es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: catForm.name.trim(), description: catForm.description.trim() };
      if (catForm.id) {
        await api.put(`/products/categories/${catForm.id}`, payload);
        showToast("Categoría actualizada.");
      } else {
        await api.post("/products/categories", payload);
        showToast("Categoría creada.");
      }
      setCatOpen(false);
      await load();
    } catch (err) {
      setCatError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id) {
    try {
      await api.delete(`/products/categories/${id}`);
      if (categoryFilter === id) setCategoryFilter("");
      showToast("Categoría eliminada.");
      await load();
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div className="ui-page">
      <PageHeader
        kicker="Catálogo"
        title="Productos"
        lede="Clasificación por categorías, precios y disponibilidad conectados al inventario."
        actions={canWrite && (
          <Btn primary icon={Plus} onClick={openCreate}>Nuevo producto</Btn>
        )}
      />

      {lowStockCount > 0 && (
        <div className="ui-alert">
          {lowStockCount} producto{lowStockCount !== 1 ? "s" : ""} en o por debajo del stock mínimo.
        </div>
      )}

      {(canCatCreate || categories.length > 0) && (
        <section className="ui-section" style={{ paddingTop: 8, borderTop: 0 }}>
          <div className="ui-section-row">
            <h3 className="ui-section-title">Categorías</h3>
            {canCatCreate && (
              <Btn ghost icon={Plus} onClick={() => openCategory()}>Nueva categoría</Btn>
            )}
          </div>
          <div className="ui-chips">
            {categories.map((c) => (
              <div key={c._id} className="ui-chip">
                <span>{c.name}</span>
                {canCatUpdate && (
                  <IconBtn icon={Pencil} label="Editar categoría" onClick={() => openCategory(c)} />
                )}
                {canCatDelete && (
                  <IconBtn icon={Trash2} label="Eliminar categoría" danger onClick={() => deleteCategory(c._id)} />
                )}
              </div>
            ))}
            {categories.length === 0 && <span className="ui-hint">Aún no hay categorías. Crea una para clasificar productos.</span>}
          </div>
        </section>
      )}

      <div className="ui-toolbar">
        <div className="ui-filters">
          <SearchInput
            placeholder="Buscar por nombre o código"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ui-filter-wrap">
            <Filter size={15} strokeWidth={1.75} className="ui-filter-icon" aria-hidden="true" />
            <select className="ui-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filtrar por categoría">
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <span className="ui-meta">{products.length} de {meta.total || products.length}</span>
      </div>

      {loading ? (
        <EmptyState description="Cargando productos…" />
      ) : error ? (
        <EmptyState title="No se pudo cargar" description={error} />
      ) : products.length > 0 ? (
        <DataTable>
        <table className="ui-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th className="ui-num">Precio</th>
              <th className="ui-num">Stock</th>
              <th className="ui-num ui-actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="ui-name">{p.name}</div>
                    <div className="ui-hint">{p.description || "Sin descripción"}</div>
                    <div className="ui-code">{p.barcode || p._id.slice(-6).toUpperCase()}</div>
                  </td>
                  <td>{categoryName(p.categoryId)}</td>
                  <td className="ui-num">{formatCOP(p.price)}</td>
                  <td className="ui-num">
                    <StockStatus stock={p.stock} minimumStock={p.minimumStock ?? 10} />
                  </td>
                  <td>
                    <div className="ui-row-actions">
                      {canUpdate && <IconBtn icon={Pencil} label="Editar producto" onClick={() => openEdit(p)} />}
                      {canDelete && <IconBtn icon={Trash2} label="Eliminar producto" danger onClick={() => setConfirmDeleteId(p._id)} />}
                      {!canUpdate && !canDelete && <span className="ui-hint">Consulta</span>}
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
        </DataTable>
      ) : (
        <EmptyState
          title="No hay productos"
          description={query ? `Ningún resultado para “${query}”.` : "Cuando se cree un producto aparecerá en este listado."}
          action={canWrite && !query ? <Btn primary icon={Plus} onClick={openCreate}>Crear producto</Btn> : null}
        />
      )}

      {modalOpen && (
        <Modal
          title={isEditing ? "Editar producto" : "Nuevo producto"}
          subtitle={isEditing ? "El stock se ajusta desde Inventario." : "Completa los datos del nuevo producto."}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} noValidate>
            {errors.form && <div className="ui-error">{errors.form}</div>}
            <div className="ui-field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" className={`ui-input ${errors.name ? "is-invalid" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <div className="ui-error">{errors.name}</div>}
            </div>
            <div className="ui-field">
              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" className="ui-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="ui-field">
              <label htmlFor="categoria">Categoría</label>
              <select id="categoria" className={`ui-select ${errors.categoryId ? "is-invalid" : ""}`} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <div className="ui-error">{errors.categoryId}</div>}
            </div>
            <div className="ui-grid-2">
              <div className="ui-field">
                <label htmlFor="precio">Precio</label>
                <div className="ui-prefix">
                  <span>$</span>
                  <input id="precio" className={`ui-input ${errors.price ? "is-invalid" : ""}`} type="number" min="0" step="100" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                {errors.price && <div className="ui-error">{errors.price}</div>}
              </div>
              {isEditing ? (
                <div className="ui-field">
                  <label>Stock actual</label>
                  <div className="ui-readonly">{form.stock} unidades</div>
                </div>
              ) : (
                <div className="ui-field">
                  <label htmlFor="cantidad">Stock inicial</label>
                  <input id="cantidad" className={`ui-input ${errors.stock ? "is-invalid" : ""}`} type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  {errors.stock && <div className="ui-error">{errors.stock}</div>}
                </div>
              )}
            </div>
            <div className="ui-field">
              <label htmlFor="minimo">Stock mínimo</label>
              <input id="minimo" className={`ui-input ${errors.minimumStock ? "is-invalid" : ""}`} type="number" min="0" step="1" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
              {errors.minimumStock && <div className="ui-error">{errors.minimumStock}</div>}
            </div>
            <div className="ui-actions">
              <Btn ghost onClick={() => setModalOpen(false)}>Cancelar</Btn>
              <Btn primary type="submit" icon={Save} disabled={saving}>
                {saving ? "Guardando…" : isEditing ? "Guardar" : "Crear producto"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {catOpen && (
        <Modal
          title={catForm.id ? "Editar categoría" : "Nueva categoría"}
          subtitle="Sirve para clasificar el catálogo (RF Gestión de productos)."
          onClose={() => setCatOpen(false)}
        >
          <form onSubmit={saveCategory} noValidate>
            {catError && <div className="ui-error">{catError}</div>}
            <div className="ui-field">
              <label>Nombre</label>
              <input className="ui-input" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            </div>
            <div className="ui-field">
              <label>Descripción</label>
              <textarea className="ui-input" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
            </div>
            <div className="ui-actions">
              <Btn ghost onClick={() => setCatOpen(false)}>Cancelar</Btn>
              <Btn primary type="submit" icon={Save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="¿Eliminar producto?"
          description="Se desactivará y dejará de aparecer en el catálogo."
          confirmLabel="Eliminar"
          danger
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => confirmDelete(confirmDeleteId)}
        />
      )}

      {Toast}
    </div>
  );
}
