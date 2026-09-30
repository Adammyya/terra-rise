import { create } from "zustand";
import { loginUser, registerUser, fetchCurrentUser } from "../services/api/authApi";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("satquery_token") || null,
  isLoading: false,
  error: null,

  // ── Login ─────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("satquery_token", data.access_token);
      // Server returns user directly in login response — no extra round-trip needed
      set({ token: data.access_token, user: data.user, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // ── Register ──────────────────────────────────────────────────────────────
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await registerUser(name, email, password);
      localStorage.setItem("satquery_token", data.access_token);
      set({ token: data.access_token, user: data.user, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // ── Restore session on page load ──────────────────────────────────────────
  fetchUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const user = await fetchCurrentUser(token);
      set({ user, isLoading: false });
    } catch {
      // Token is invalid / expired — clear everything silently
      localStorage.removeItem("satquery_token");
      set({ user: null, token: null, isLoading: false });
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem("satquery_token");
    set({ user: null, token: null, error: null });
  },
}));
