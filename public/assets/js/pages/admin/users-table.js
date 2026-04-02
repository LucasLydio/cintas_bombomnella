import { apiFetch } from "../../api.js";
import { getToken } from "../../auth.js";
import { qs, setAlert } from "../../utils/dom.js";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

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

function rowTemplate(user) {
  const active = user.is_active ? "Sim" : "Nao";
  return `
    <tr>
      <td>${escapeHtml(user.name || "-")}</td>
      <td>${escapeHtml(user.email || "-")}</td>
      <td><span class="badge text-bg-secondary">${escapeHtml(user.role || "-")}</span></td>
      <td>${active}</td>
      <td>${escapeHtml(formatDate(user.created_at))}</td>
      <td class="text-end">
        <button class="btn btn-outline-dark btn-sm me-2" type="button" data-action="edit" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-pencil me-2"></i>Editar
        </button>
        <button class="btn btn-outline-secondary btn-sm me-2" type="button" data-action="reset" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-key me-2"></i>Reset
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-trash me-2"></i>Excluir
        </button>
      </td>
    </tr>
  `.trim();
}

async function loadUsers() {
  const token = getToken();
  const payload = await apiFetch("/.netlify/functions/users?page=1&limit=50", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return payload?.data || null;
}

async function updateUser({ id, patch }) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/users?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: patch,
  });
}

async function deleteUser(id) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/users?id=${encodeURIComponent(id)}`, {
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

export function mountUsersTable() {
  const alertBox = qs("#adminAlert");
  const tbody = qs("#usersTbody");
  const refreshBtn = qs("#usersRefresh");

  const modalEl = qs("#userEditModal");
  const formEl = qs("#userEditForm");
  const resetBtn = qs("#resetPasswordBtn");
  const saveBtn = qs("#saveUserBtn");

  if (!tbody) return;

  let usersById = new Map();

  const render = async () => {
    refreshBtn?.setAttribute("disabled", "disabled");
    tbody.innerHTML = "";
    setAlert(alertBox, { message: null });

    try {
      const list = await loadUsers();
      const items = list?.items || [];
      usersById = new Map(items.map((u) => [u.id, u]));

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">Nenhum usuario.</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map(rowTemplate).join("");
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao carregar usuarios." });
    } finally {
      refreshBtn?.removeAttribute("disabled");
    }
  };

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!id) return;

    if (action === "edit") {
      const user = usersById.get(id);
      if (!user || !modalEl || !formEl) return;

      qs("#editUserId").value = user.id;
      qs("#editName").value = user.name || "";
      qs("#editEmail").value = user.email || "";
      qs("#editPhone").value = user.phone || "";
      qs("#editRole").value = user.role || "common";
      qs("#editActive").value = user.is_active ? "true" : "false";

      setAlert(alertBox, { message: null });
      openModal(modalEl);
      return;
    }

    if (action === "reset") {
      if (!confirm('Resetar a senha para "cintas1234"?')) return;

      btn.setAttribute("disabled", "disabled");
      try {
        await updateUser({ id, patch: { password: "cintas1234" } });
        setAlert(alertBox, { type: "success", message: "Senha resetada com sucesso." });
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao resetar senha." });
      } finally {
        btn.removeAttribute("disabled");
      }

      return;
    }

    if (action === "delete") {
      if (!confirm("Excluir este usuario?")) return;

      btn.setAttribute("disabled", "disabled");
      try {
        await deleteUser(id);
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao excluir usuario." });
      } finally {
        btn.removeAttribute("disabled");
      }
    }
  });

  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = qs("#editUserId")?.value || "";
    if (!id) return;

    const patch = {
      name: qs("#editName")?.value || "",
      email: qs("#editEmail")?.value || "",
      phone: qs("#editPhone")?.value || null,
      role: qs("#editRole")?.value || "common",
      is_active: (qs("#editActive")?.value || "true") === "true",
    };

    saveBtn?.setAttribute("disabled", "disabled");
    try {
      await updateUser({ id, patch });
      if (modalEl && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      await render();
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao salvar usuario." });
    } finally {
      saveBtn?.removeAttribute("disabled");
    }
  });

  resetBtn?.addEventListener("click", async () => {
    const id = qs("#editUserId")?.value || "";
    if (!id) return;

    if (!confirm('Resetar a senha para "cintas1234"?')) return;

    resetBtn.setAttribute("disabled", "disabled");
    try {
      await updateUser({ id, patch: { password: "cintas1234" } });
      setAlert(alertBox, { type: "success", message: "Senha resetada com sucesso." });
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao resetar senha." });
    } finally {
      resetBtn.removeAttribute("disabled");
    }
  });

  refreshBtn?.addEventListener("click", render);
  render();
}

