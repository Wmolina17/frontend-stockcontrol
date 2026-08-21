const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function storage() {
  if (localStorage.getItem("accessToken")) return localStorage;
  return sessionStorage;
}

export function getTokens() {
  const store = storage();
  return {
    accessToken: store.getItem("accessToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"),
    refreshToken: store.getItem("refreshToken") || localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken"),
  };
}

export function setTokens(accessToken, refreshToken, remember = true) {
  const primary = remember ? localStorage : sessionStorage;
  const secondary = remember ? sessionStorage : localStorage;
  primary.setItem("accessToken", accessToken);
  primary.setItem("refreshToken", refreshToken);
  secondary.removeItem("accessToken");
  secondary.removeItem("refreshToken");
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  if (json.data?.accessToken) {
    const remember = Boolean(localStorage.getItem("refreshToken"));
    setTokens(json.data.accessToken, refreshToken, remember);
    return json.data.accessToken;
  }
  return null;
}

export async function apiFetch(path, options = {}, retry = true) {
  const { accessToken } = getTokens();
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch(path, options, false);
    clearTokens();
    throw new Error("Sesión expirada. Inicia sesión de nuevo");
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) throw new Error("No se pudo completar la solicitud");
    return res;
  }

  const json = await res.json();
  if (!res.ok) {
    const detail = json.errors?.[0]?.message;
    throw new Error(detail || json.message || "No se pudo completar la solicitud");
  }
  return json;
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: (path) => apiFetch(path, { method: "DELETE" }),
};

export function getApiUrl(path) {
  const { accessToken } = getTokens();
  return { url: `${API_URL}${path}`, token: accessToken };
}

export async function downloadFile(path, filename) {
  const { accessToken } = getTokens();
  let res = await fetch(`${API_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
    } else {
      clearTokens();
      throw new Error("Sesión expirada. Inicia sesión de nuevo");
    }
  }

  if (!res.ok) {
    let message = "No se pudo descargar el archivo";
    try {
      const json = await res.json();
      message = json.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
}
