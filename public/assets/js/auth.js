import { apiFetch } from "./api.js";

const TOKEN_KEY = "cb_token";
const TOKEN_EVENT = "cb:token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new CustomEvent(TOKEN_EVENT, { detail: { token } }));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new CustomEvent(TOKEN_EVENT, { detail: { token: null } }));
}

export function onTokenChange(callback) {
  const onCustom = (event) => callback(event.detail?.token ?? null);
  const onStorage = (event) => {
    if (event.key !== TOKEN_KEY) return;
    callback(event.newValue ?? null);
  };

  window.addEventListener(TOKEN_EVENT, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(TOKEN_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export async function login({ email, password }) {
  const payload = await apiFetch("/.netlify/functions/auth", {
    method: "POST",
    body: { action: "login", email, password },
  });

  const token = payload?.data?.token;
  if (token) setToken(token);

  return payload?.data;
}

export async function register({ name, email, phone, password }) {
  const payload = await apiFetch("/.netlify/functions/auth", {
    method: "POST",
    body: { action: "register", name, email, phone, password },
  });

  const token = payload?.data?.token;
  if (token) setToken(token);

  return payload?.data;
}

export async function getSession() {
  const token = getToken();
  if (!token) return null;

  const payload = await apiFetch("/.netlify/functions/session", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return payload?.data || null;
}
