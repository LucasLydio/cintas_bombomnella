export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function setAlert(container, { type = "danger", message }) {
  if (!container) return;
  if (!message) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="alert alert-${type} mb-0" role="alert">${escapeHtml(message)}</div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

