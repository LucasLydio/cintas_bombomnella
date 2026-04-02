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

function openModal(modalEl) {
  if (!window.bootstrap?.Modal) return null;
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
  return modal;
}

async function listProducts() {
  const token = getToken();
  const payload = await apiFetch("/.netlify/functions/products?page=1&limit=100", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return payload?.data || null;
}

async function createProduct(body) {
  const token = getToken();
  return apiFetch("/.netlify/functions/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

async function updateProduct(id, body) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/products?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

async function deleteProduct(id) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/products?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function listCategories() {
  const payload = await apiFetch("/.netlify/functions/categories?page=1&limit=200");
  return payload?.data?.items || [];
}

async function listSellers() {
  const token = getToken();
  const payload = await apiFetch("/.netlify/functions/users?page=1&limit=200&role=seller&is_active=true", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return payload?.data?.items || [];
}

async function listImages(productId) {
  const payload = await apiFetch(`/.netlify/functions/product-images?product_id=${encodeURIComponent(productId)}`);
  return payload?.data || [];
}

async function createImage(body) {
  const token = getToken();
  return apiFetch("/.netlify/functions/product-images", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

async function updateImage(id, body) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/product-images?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

async function deleteImage(id) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/product-images?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

function productRowTemplate(product, { categoriesById, sellersById }) {
  const active = product.is_active ? "Sim" : "Nao";
  const categoryName = categoriesById.get(product.category_id)?.name || product.category_id || "-";
  const sellerName = sellersById.get(product.seller_id)?.name || product.seller_id || "-";

  return `
    <tr>
      <td>${escapeHtml(product.name || "-")}</td>
      <td>${escapeHtml(String(product.price_cents ?? 0))} ${escapeHtml(product.currency || "")}</td>
      <td>${escapeHtml(String(product.stock ?? 0))}</td>
      <td>${active}</td>
      <td>${escapeHtml(categoryName)}</td>
      <td>${escapeHtml(sellerName)}</td>
      <td class="text-end">
        <button class="btn btn-outline-dark btn-sm me-2" type="button" data-action="edit" data-id="${escapeAttr(product.id)}">
          <i class="bi bi-pencil me-2"></i>Editar
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="${escapeAttr(product.id)}">
          <i class="bi bi-trash me-2"></i>Excluir
        </button>
      </td>
    </tr>
  `.trim();
}

function imageRowTemplate(image) {
  const cover = image.is_cover ? '<span class="badge text-bg-success">cover</span>' : "";
  return `
    <tr>
      <td><code>${escapeHtml(image.storage_path || "-")}</code></td>
      <td>${cover}</td>
      <td>${escapeHtml(String(image.sort_order ?? 0))}</td>
      <td class="text-end">
        <button class="btn btn-outline-secondary btn-sm me-2" type="button" data-img-action="cover" data-img-id="${escapeAttr(
          image.id
        )}">
          <i class="bi bi-star me-2"></i>Cover
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-img-action="delete" data-img-id="${escapeAttr(image.id)}">
          <i class="bi bi-trash me-2"></i>Excluir
        </button>
      </td>
    </tr>
  `.trim();
}

export function mountProductsTable() {
  const tbody = qs("#productsTbody");
  if (!tbody) return;

  const alertBox = qs("#productsAlert");
  const refreshBtn = qs("#productsRefresh");
  const newBtn = qs("#productsNew");

  const modalEl = qs("#productEditModal");
  const titleEl = qs("#productModalTitle");
  const formEl = qs("#productEditForm");
  const saveBtn = qs("#productSaveBtn");

  const imagesTbody = qs("#productImagesTbody");
  const imagesRefreshBtn = qs("#productImagesRefresh");
  const imageAddBtn = qs("#imageAddBtn");

  let productsById = new Map();
  let categoriesById = new Map();
  let sellersById = new Map();

  const loadLookups = async () => {
    const [categories, sellers] = await Promise.all([listCategories(), listSellers()]);
    categoriesById = new Map(categories.map((c) => [c.id, c]));
    sellersById = new Map(sellers.map((u) => [u.id, u]));

    const categorySelect = qs("#productCategoryId");
    const sellerSelect = qs("#productSellerId");

    if (categorySelect) {
      categorySelect.innerHTML = categories.length
        ? categories.map((c) => `<option value="${escapeAttr(c.id)}">${escapeHtml(c.name)}</option>`).join("")
        : `<option value="">Sem categorias</option>`;
    }

    if (sellerSelect) {
      sellerSelect.innerHTML = sellers.length
        ? sellers.map((u) => `<option value="${escapeAttr(u.id)}">${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`).join("")
        : `<option value="">Sem sellers</option>`;
    }
  };

  const render = async () => {
    refreshBtn?.setAttribute("disabled", "disabled");
    tbody.innerHTML = "";
    setAlert(alertBox, { message: null });

    try {
      await loadLookups();

      const list = await listProducts();
      const items = list?.items || [];
      productsById = new Map(items.map((p) => [p.id, p]));

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">Nenhum produto.</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map((p) => productRowTemplate(p, { categoriesById, sellersById })).join("");
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao carregar produtos." });
    } finally {
      refreshBtn?.removeAttribute("disabled");
    }
  };

  const renderImages = async (productId) => {
    if (!imagesTbody) return;
    imagesTbody.innerHTML = "";

    try {
      const items = await listImages(productId);
      if (!items.length) {
        imagesTbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-3">Sem imagens.</td></tr>`;
        return;
      }
      imagesTbody.innerHTML = items.map(imageRowTemplate).join("");
    } catch {
      imagesTbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-3">Falha ao carregar.</td></tr>`;
    }
  };

  const openForCreate = async () => {
    if (!modalEl || !formEl) return;
    if (titleEl) titleEl.textContent = "Novo produto";

    qs("#productId").value = "";
    qs("#productName").value = "";
    qs("#productSlug").value = "";
    qs("#productDescription").value = "";
    qs("#productPriceCents").value = "0";
    qs("#productCurrency").value = "BRL";
    qs("#productStock").value = "0";
    qs("#productActive").value = "true";

    await loadLookups();

    const firstCategory = categoriesById.keys().next().value || "";
    const firstSeller = sellersById.keys().next().value || "";

    if (qs("#productCategoryId")) qs("#productCategoryId").value = firstCategory;
    if (qs("#productSellerId")) qs("#productSellerId").value = firstSeller;

    if (imagesTbody) imagesTbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-3">Salve o produto para gerenciar imagens.</td></tr>`;
    openModal(modalEl);
  };

  const openForEdit = async (product) => {
    if (!modalEl || !formEl || !product) return;
    if (titleEl) titleEl.textContent = "Editar produto";

    qs("#productId").value = product.id || "";
    qs("#productName").value = product.name || "";
    qs("#productSlug").value = product.slug || "";
    qs("#productDescription").value = product.description || "";
    qs("#productPriceCents").value = String(product.price_cents ?? 0);
    qs("#productCurrency").value = product.currency || "BRL";
    qs("#productStock").value = String(product.stock ?? 0);
    qs("#productActive").value = product.is_active ? "true" : "false";

    await loadLookups();
    if (qs("#productCategoryId")) qs("#productCategoryId").value = product.category_id || "";
    if (qs("#productSellerId")) qs("#productSellerId").value = product.seller_id || "";

    await renderImages(product.id);
    openModal(modalEl);
  };

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "edit") {
      await openForEdit(productsById.get(id));
      return;
    }

    if (action === "delete") {
      if (!confirm("Excluir este produto?")) return;

      btn.setAttribute("disabled", "disabled");
      try {
        await deleteProduct(id);
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao excluir produto." });
      } finally {
        btn.removeAttribute("disabled");
      }
    }
  });

  imagesTbody?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-img-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-img-action");
    const imgId = btn.getAttribute("data-img-id");
    const productId = qs("#productId")?.value || "";
    if (!action || !imgId || !productId) return;

    btn.setAttribute("disabled", "disabled");
    try {
      if (action === "delete") {
        if (!confirm("Excluir esta imagem?")) return;
        await deleteImage(imgId);
      }

      if (action === "cover") {
        await updateImage(imgId, { is_cover: true });
      }

      await renderImages(productId);
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha na imagem." });
    } finally {
      btn.removeAttribute("disabled");
    }
  });

  imagesRefreshBtn?.addEventListener("click", async () => {
    const productId = qs("#productId")?.value || "";
    if (!productId) return;
    await renderImages(productId);
  });

  imageAddBtn?.addEventListener("click", async () => {
    const productId = qs("#productId")?.value || "";
    if (!productId) return;

    const storagePath = (qs("#imageStoragePath")?.value || "").trim();
    if (!storagePath) {
      setAlert(alertBox, { type: "warning", message: "Informe storage_path." });
      return;
    }

    imageAddBtn.setAttribute("disabled", "disabled");
    try {
      await createImage({
        product_id: productId,
        storage_path: storagePath,
        alt_text: (qs("#imageAltText")?.value || "").trim() || undefined,
        is_cover: Boolean(qs("#imageIsCover")?.checked),
        sort_order: Number(qs("#imageSortOrder")?.value || 0),
      });

      qs("#imageStoragePath").value = "";
      qs("#imageAltText").value = "";
      qs("#imageIsCover").checked = false;
      qs("#imageSortOrder").value = "0";

      await renderImages(productId);
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao adicionar imagem." });
    } finally {
      imageAddBtn.removeAttribute("disabled");
    }
  });

  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = qs("#productId")?.value || "";
    const slugValue = (qs("#productSlug")?.value || "").trim();
    const descriptionValue = (qs("#productDescription")?.value || "").trim();

    const body = {
      name: qs("#productName")?.value || "",
      ...(slugValue ? { slug: slugValue } : {}),
      ...(descriptionValue ? { description: descriptionValue } : {}),
      category_id: qs("#productCategoryId")?.value || "",
      seller_id: qs("#productSellerId")?.value || "",
      price_cents: Number(qs("#productPriceCents")?.value || 0),
      currency: qs("#productCurrency")?.value || "BRL",
      stock: Number(qs("#productStock")?.value || 0),
      is_active: (qs("#productActive")?.value || "true") === "true",
    };

    saveBtn?.setAttribute("disabled", "disabled");
    try {
      if (id) {
        await updateProduct(id, body);
      } else {
        await createProduct(body);
      }

      if (modalEl && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      await render();
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao salvar produto." });
    } finally {
      saveBtn?.removeAttribute("disabled");
    }
  });

  refreshBtn?.addEventListener("click", render);
  newBtn?.addEventListener("click", openForCreate);

  render();
}

