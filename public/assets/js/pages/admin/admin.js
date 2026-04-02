import { getSession, clearToken } from "../../auth.js";
import { qs, setAlert } from "../../utils/dom.js";
import { mountUsersTable } from "./users-table.js";
import { mountCategoriesTable } from "./categories-table.js";
import { mountProductsTable } from "./products-table.js";

async function init() {
  const alertBox = qs("#adminAlert");
  setAlert(alertBox, { message: null });

  let session;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  if (!session?.user) {
    clearToken();
    window.location.href = "/login.html";
    return;
  }

  if (session.user.role !== "admin") {
    setAlert(alertBox, { type: "danger", message: "Acesso negado." });
    setTimeout(() => (window.location.href = "/user/index.html"), 700);
    return;
  }

  mountUsersTable();
  mountCategoriesTable();
  mountProductsTable();
}

let ran = false;
const runOnce = () => {
  if (ran) return;
  ran = true;
  init();
};

if (window.__includesLoaded) runOnce();
document.addEventListener("includes:loaded", runOnce, { once: true });
setTimeout(runOnce, 800);
