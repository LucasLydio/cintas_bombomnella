import { apiFetch } from "../api.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardTemplate(category) {
  const name = category?.name || "-";
  const slug = category?.slug || "";
  const description = category?.description || "";

  return `
    <a href="/shop.html?category=${encodeURIComponent(slug)}" class="category-card">
      <div class="category-card__icon">
        <img src="../../assets/images/icons/logoCintas04.PNG" alt="logo" width="52" height="62">
      </div>
      <div class="category-card__content">
        <h6>${escapeHtml(name)}</h6>
        <p>${escapeHtml(description || "Explore esta categoria.")}</p>
      </div>
      <span class="category-card__arrow">
        <i class="bi bi-arrow-right"></i>
      </span>
    </a>
  `.trim();
}

async function fetchCategories() {
  const payload = await apiFetch("/.netlify/functions/categories?page=1&limit=50&is_active=true");
  return payload?.data?.items || [];
}

export async function mountCategories() {
  const root = document.querySelector("[data-categories]");
  if (!root) return;

  const grid = root.querySelector("[data-categories-grid]");
  const empty = root.querySelector("[data-categories-empty]");
  if (!grid || !empty) return;

  grid.innerHTML = "";
  empty.hidden = true;

  try {
    const items = await fetchCategories();

    if (!items.length) {
      empty.hidden = false;
      return;
    }

    grid.innerHTML = items.map(cardTemplate).join("");
  } catch {
    empty.hidden = false;
  }
}

