const API_BASE_URL = "https://satquery-ai-1-ap5j.onrender.com";

function getBaseUrl() {
  const url = import.meta.env.VITE_API_URL || API_BASE_URL;
  return url.replace(/\/+$/, "");
}

// ── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = `Login failed (${response.status}).`;
    try {
      const data = await response.json();
      if (data.detail) errorMessage = typeof data.detail === "string" ? data.detail : data.detail[0]?.msg || errorMessage;
    } catch {
      // Not JSON
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// ── Register ─────────────────────────────────────────────────────────────────
export async function registerUser(name, email, password) {
  const response = await fetch(`${getBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    let errorMessage = `Registration failed (${response.status}).`;
    try {
      const data = await response.json();
      if (data.detail) errorMessage = typeof data.detail === "string" ? data.detail : data.detail[0]?.msg || errorMessage;
    } catch {
      // Not JSON
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// ── Me ───────────────────────────────────────────────────────────────────────
export async function fetchCurrentUser(token) {
  const response = await fetch(`${getBaseUrl()}/api/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Session expired. Please log in again.");
  }
  return response.json();
}

// ── History ──────────────────────────────────────────────────────────────────
export async function fetchUserHistory(token) {
  const response = await fetch(`${getBaseUrl()}/api/auth/history`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch history.");
  }
  return response.json();
}
