import { getToken, getSession, clearToken, onTokenChange } from "../auth.js";

function createNavItemLink({ href, text, className = "nav-link" }) {
  const a = document.createElement("a");
  a.href = href;
  a.className = className;
  a.textContent = text;
  return a;
}

function createNavItemButton({ text, className = "nav-link", onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;

  if (onClick) {
    button.addEventListener("click", onClick);
  }

  return button;
}

function renderGuest(authNav) {
  const loginItem = createNavItemLink({
    href: "/login.html",
    text: "Entrar",
    className: "nav-link",
  });

  const registerItem = createNavItemLink({
    href: "/register.html",
    text: "Criar Conta",
    className: "btn btn-outline-light",
  });

  authNav.replaceChildren(loginItem, registerItem);
}

function renderAuthenticated(authNav) {
  const accountItem = createNavItemLink({
    href: "/user/index.html",
    text: "Minha Conta",
    className: "btn btn-outline-light",
  });

  const logoutItem = createNavItemButton({
    text: "Sair",
    className: "nav-link btn btn-link p-0",
    onClick: () => {
      clearToken();
      window.location.href = "/login.html";
    },
  });

  authNav.replaceChildren(accountItem, logoutItem);
}

function createSpinner() {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="spinner-border" role="status">
    </div>
  `.trim();
  return wrapper.firstElementChild;
}

function renderLoading(authNav) {
  const spinner = createSpinner();
  authNav.replaceChildren(spinner);
}

function renderSidebarGuest(authSidebar) {
  const account = createNavItemLink({
    href: "/login.html",
    text: "Minha Conta",
    className: "nav-link rounded-0 sidebar-link border-bottom",
  });

  const loginItem = createNavItemLink({
    href: "/login.html",
    text: "Entrar",
    className: "nav-link rounded-0 sidebar-link border-bottom",
  });

  const registerItem = createNavItemLink({
    href: "/register.html",
    text: "Criar conta",
    className: "nav-link sidebar-link",
  });

  authSidebar.replaceChildren( loginItem, registerItem);
}

function renderSidebarAuthenticated(authSidebar) {
  const accountItem = createNavItemLink({
    href: "/user/index.html",
    text: "Minha Conta",
    className: "nav-link rounded-0 sidebar-link border-bottom",
  });

  const logoutItem = createNavItemButton({
    text: "Sair",
    className: "nav-link sidebar-link",
    onClick: () => {
      clearToken();
      window.location.href = "/login.html";
    },
  });

  authSidebar.replaceChildren(accountItem, logoutItem);
}

function renderSidebarLoading(authSidebar) {
  const spinner = document.createElement("div");
  spinner.className = "d-flex justify-content-center py-2";
  spinner.appendChild(createSpinner());
  authSidebar.replaceChildren(spinner);
}

export async function renderAuthNav() {
  const authNav = document.getElementById("auth-nav");
  if (!authNav) return;

  const authSidebar = document.getElementById("auth-sidebar");

  renderLoading(authNav);
  if (authSidebar) renderSidebarLoading(authSidebar);

  const token = getToken();

  if (!token) {
    renderGuest(authNav);
    if (authSidebar) renderSidebarGuest(authSidebar);
    return;
  }

  try {
    const session = await getSession();

    if (!session) {
      clearToken();
      renderGuest(authNav);
      if (authSidebar) renderSidebarGuest(authSidebar);
      return;
    }

    renderAuthenticated(authNav);
    if (authSidebar) renderSidebarAuthenticated(authSidebar);
  } catch {
    clearToken();
    renderGuest(authNav);
    if (authSidebar) renderSidebarGuest(authSidebar);
  }
}

let mounted = false;
export function mountAuthNav() {
  if (mounted) return;
  mounted = true;

  renderAuthNav();
  onTokenChange(() => renderAuthNav());
}
