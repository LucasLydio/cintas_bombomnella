import { clearToken, getSession } from "../auth.js";
import { qs, setAlert } from "../utils/dom.js";

function init() {
  const logoutBtn = qs("#logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    clearToken();
    window.location.href = "../login.html";
  });

  const alertBox = qs("#userAlert");

  getSession()
    .then((session) => {
      const user = session?.user;
      if (!user) {
        clearToken();
        window.location.href = "../login.html";
        return;
      }

      qs("#userName").textContent = user.name || "-";
      qs("#userEmail").textContent = user.email || "-";
      qs("#userRole").textContent = user.role || "-";
    })
    .catch(() => {
      setAlert(alertBox, { type: "danger", message: "Nao foi possivel carregar sua sessao." });
    });
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
