import { apiFetch } from "../../api.js";
import { getToken } from "../../auth.js";
import { qs, setAlert } from "../../utils/dom.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function rowTemplate(category) {
  const active = category.is_active ? "Sim" : "Nao";
  return `
    <tr>
      <td>${escapeHtml(category.name || "-")}</td>
      <td><code>${escapeHtml(category.slug || "-")}</code></td>
      <td>${active}</td>
      <td>${escapeHtml(String(category.sort_order ?? 0))}</td>
      <td>${escapeHtml(formatDate(category.updated_at))}</td>
      <td class="text-end">
        <button class="btn btn-outline-dark btn-sm me-2" type="button" data-action="edit" data-id="${escapeAttr(category.id)}">
          <i class="bi bi-pencil me-2"></i>Editar
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="${escapeAttr(category.id)}">
          <i class="bi bi-trash me-2"></i>Excluir
        </button>
      </td>
    </tr>
  `.trim();
}

async function listCategories() {
  const payload = await apiFetch("/.netlify/functions/categories?page=1&limit=100", { method: "GET" });
  return payload?.data || null;
}

async function createCategory(body) {
  const token = getToken();
  return apiFetch("/.netlify/functions/categories", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

async function updateCategory(id, body) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/categories?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

async function deleteCategory(id) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/categories?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

function openModal(modalEl) {
  if (!window.bootstrap?.Modal) return null;
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
  return modal;
}

export function mountCategoriesTable() {
  const tbody = qs("#categoriesTbody");
  if (!tbody) return;

  const alertBox = qs("#categoriesAlert");
  const refreshBtn = qs("#categoriesRefresh");
  const newBtn = qs("#categoriesNew");

  const modalEl = qs("#categoryEditModal");
  const formEl = qs("#categoryEditForm");
  const saveBtn = qs("#categorySaveBtn");
  const titleEl = qs("#categoryModalTitle");

  let categoriesById = new Map();

  const render = async () => {
    refreshBtn?.setAttribute("disabled", "disabled");
    tbody.innerHTML = "";
    setAlert(alertBox, { message: null });

    try {
      const list = await listCategories();
      const items = list?.items || [];
      categoriesById = new Map(items.map((c) => [c.id, c]));

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">Nenhuma categoria.</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map(rowTemplate).join("");
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao carregar categorias." });
    } finally {
      refreshBtn?.removeAttribute("disabled");
    }
  };

  const openForCreate = () => {
    if (!modalEl || !formEl) return;
    if (titleEl) titleEl.textContent = "Nova categoria";

    qs("#categoryId").value = "";
    qs("#categoryName").value = "";
    qs("#categorySlug").value = "";
    qs("#categoryDescription").value = "";
    qs("#categoryActive").value = "true";
    qs("#categorySortOrder").value = "0";

    setAlert(alertBox, { message: null });
    openModal(modalEl);
  };

  const openForEdit = (category) => {
    if (!modalEl || !formEl || !category) return;
    if (titleEl) titleEl.textContent = "Editar categoria";

    qs("#categoryId").value = category.id || "";
    qs("#categoryName").value = category.name || "";
    qs("#categorySlug").value = category.slug || "";
    qs("#categoryDescription").value = category.description || "";
    qs("#categoryActive").value = category.is_active ? "true" : "false";
    qs("#categorySortOrder").value = String(category.sort_order ?? 0);

    setAlert(alertBox, { message: null });
    openModal(modalEl);
  };

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "edit") {
      openForEdit(categoriesById.get(id));
      return;
    }

    if (action === "delete") {
      if (!confirm("Excluir esta categoria?")) return;

      btn.setAttribute("disabled", "disabled");
      try {
        await deleteCategory(id);
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao excluir categoria." });
      } finally {
        btn.removeAttribute("disabled");
      }
    }
  });

  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = qs("#categoryId")?.value || "";

    const slugValue = (qs("#categorySlug")?.value || "").trim();
    const descriptionValue = (qs("#categoryDescription")?.value || "").trim();

    const body = {
      name: qs("#categoryName")?.value || "",
      ...(slugValue ? { slug: slugValue } : {}),
      ...(descriptionValue ? { description: descriptionValue } : {}),
      is_active: (qs("#categoryActive")?.value || "true") === "true",
      sort_order: Number(qs("#categorySortOrder")?.value || 0),
    };

    saveBtn?.setAttribute("disabled", "disabled");
    try {
      if (id) {
        await updateCategory(id, body);
      } else {
        await createCategory(body);
      }

      if (modalEl && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      await render();
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao salvar categoria." });
    } finally {
      saveBtn?.removeAttribute("disabled");
    }
  });

  refreshBtn?.addEventListener("click", render);
  newBtn?.addEventListener("click", openForCreate);

  render();
}
