import axios from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "@/lib/constants";

/**
 * Cliente HTTP centralizado. Em desenvolvimento, prefira mocks/SWR com dados locais.
 * Headers de auth serão aplicados quando `token` existir no storage (fase 2).
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer")
      ? token
      : `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.token);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
