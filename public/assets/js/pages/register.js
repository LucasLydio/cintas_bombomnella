import { register, getSession } from "../auth.js";
import { qs, setAlert } from "../utils/dom.js";

function init() {
  const form = qs("#registerForm");
  if (!form) return;

  const alertBox = qs("#registerAlert");
  const submit = qs("#registerSubmit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(alertBox, { message: null });

    const name = qs("#registerName")?.value || "";
    const email = qs("#registerEmail")?.value || "";
    const phone = qs("#registerPhone")?.value || "";
    const password = qs("#registerPassword")?.value || "";
    const password2 = qs("#registerPassword2")?.value || "";

    if (!name || !email || !password || !password2) {
      setAlert(alertBox, { type: "warning", message: "Preencha os campos obrigatorios." });
      return;
    }

    if (password !== password2) {
      setAlert(alertBox, { type: "warning", message: "As senhas nao conferem." });
      return;
    }

    submit?.setAttribute("disabled", "disabled");

    try {
      await register({ name, email, phone: phone || null, password });
      window.location.href = "user/index.html";
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao criar conta." });
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
