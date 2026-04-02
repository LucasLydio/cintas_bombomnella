import { login, getSession } from "../auth.js";
import { qs, setAlert } from "../utils/dom.js";

function init() {
  const form = qs("#loginForm");
  if (!form) return;

  const alertBox = qs("#loginAlert");
  const submit = qs("#loginSubmit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(alertBox, { message: null });

    const email = qs("#loginEmail")?.value || "";
    const password = qs("#loginPassword")?.value || "";

    if (!email || !password) {
      setAlert(alertBox, { type: "warning", message: "Preencha email e senha." });
      return;
    }

    submit?.setAttribute("disabled", "disabled");

    try {
      await login({ email, password });
      window.location.href = "user/index.html";
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao entrar." });
    } finally {
      submit?.removeAttribute("disabled");
    }
  });
}

async function boot() {
  try {
    const session = await getSession();
    if (session?.user) {
      window.location.href = "user/index.html";
      return;
    }
  } catch {
    // ignore
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
}

boot();
