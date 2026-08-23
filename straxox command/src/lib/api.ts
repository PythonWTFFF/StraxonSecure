import { debugLog } from "@/components/DebugConsole";
import { useAuthStore } from "@/stores/auth.store";

const API_BASE = "/api/v1";

// ─── Silent Token Refresh ──────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function silentRefresh(): Promise<string | null> {
  if (isRefreshing) {
    // Queue subsequent calls to avoid multiple refresh requests
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include", // sends the httpOnly refreshToken cookie
    });

    if (!res.ok) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
      return null;
    }

    const { accessToken, user } = await res.json();
    useAuthStore.getState().setAuth(accessToken, user);

    // Resolve all queued callers
    refreshQueue.forEach((cb) => cb(accessToken));
    refreshQueue = [];

    return accessToken;
  } catch {
    useAuthStore.getState().clearAuth();
    window.location.href = "/login";
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const store = useAuthStore.getState();

  // Proactively refresh if token is expired or about to expire
  let token = store.token;
  if (!token || store.isTokenExpired()) {
    token = await silentRefresh();
    if (!token) throw new Error("Unauthorized");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  // If the server rejects the token (e.g. it was revoked), try one silent refresh
  if (res.status === 401) {
    const newToken = await silentRefresh();
    if (!newToken) throw new Error("Unauthorized");

    headers.set("Authorization", `Bearer ${newToken}`);
    res = await fetch(url, { ...options, headers, credentials: "include" });
  }

  // Hard 403 = forbidden (wrong role/domain), not an auth error — don't redirect
  if (res.status === 403) {
    throw new Error("Forbidden");
  }

  return res;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}

export async function logoutApi() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  useAuthStore.getState().clearAuth();
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function fetchInvoices() {
  const res = await authFetch(`${API_BASE}/invoices`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export async function saveInvoice(data: any) {
  debugLog("api", `POST /api/v1/invoices — saving ${data.invoiceNumber}`);
  const res = await authFetch(`${API_BASE}/invoices`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save invoice");
  }
  return res.json();
}

export async function cloneInvoiceApi(id: string, originalData: any) {
  const newData = {
    ...originalData,
    invoiceNumber: originalData.invoiceNumber + "-COPY-" + Math.floor(Math.random() * 1000),
  };
  delete newData.id;
  delete newData.createdAt;
  delete newData.updatedAt;
  return saveInvoice(newData);
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function fetchClients() {
  const res = await authFetch(`${API_BASE}/clients`);
  if (!res.ok) throw new Error("Failed to fetch clients");
  return res.json();
}

export async function saveClient(data: any) {
  const res = await authFetch(`${API_BASE}/clients`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save client");
  return res.json();
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function fetchProposals() {
  const res = await authFetch(`${API_BASE}/proposals`);
  if (!res.ok) throw new Error("Failed to fetch proposals");
  return res.json();
}

export async function saveProposal(data: any) {
  const res = await authFetch(`${API_BASE}/proposals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save proposal");
  return res.json();
}

// ─── Dashboard / Intelligence ─────────────────────────────────────────────────

export async function fetchDashboardStats() {
  const res = await authFetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function fetchAuditLogs() {
  const res = await authFetch(`${API_BASE}/audit`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}
