import { auth } from "./auth";

const API_URL = "http://localhost:80";
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = auth.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    auth.setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export interface Good {
  id: number;
  name: string;
  price: number;
  category: string;
  desc: string;
  count: number;
  imageUrl: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "user" | "seller" | "admin";
  isBlocked?: boolean;
}

export interface CreateGoodPayload {
  name: string;
  price: number;
  category?: string;
  desc?: string;
  count?: number;
  imageUrl?: string;
}

export interface UpdateGoodPayload {
  name?: string;
  price?: number;
  category?: string;
  desc?: string;
  count?: number;
  imageUrl?: string;
}
// Создаем ассинхронную функцию-темплейт на получение данных с помощью fetch.
async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  // Build request options
  const buildOptions = (): RequestInit => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = auth.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };
  };

  // First attempt
  let response = await fetch(`${API_URL}${path}`, buildOptions());

  // If 401 — try to refresh and retry ONCE
  if (
    response.status === 401 &&
    !path.includes("/api/auth/login") &&
    !path.includes("/api/auth/register")
  ) {
    console.log("Refreshing tokens...");
    // Prevent multiple parallel refreshes
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      // Retry original request with new token
      response = await fetch(`${API_URL}${path}`, buildOptions());
    } else {
      // Refresh failed — force logout
      auth.clear();
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message || message;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}
// Темплейт для удобства создания запросов к API
const http = {
  get: <T>(path: string) => request<T>("GET", path, undefined),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path, undefined),
};

// Готовый API для работы с товарами
export const GoodsApi = {
  me: () => http.get<User>("/api/auth/me"),
  register: (
    first_name: string,
    last_name: string,
    email: string,
    password: string,
  ) =>
    http.post<{ message: string }>("/api/auth/register", {
      first_name,
      last_name,
      email,
      password,
    }),
  login: (email: string, password: string) =>
    http.post<{ access_token: string; refresh_token: string }>(
      "/api/auth/login",
      { email, password },
    ),
  list: () => http.get<Good[]>("/api/goods"),
  one: (id: number) => http.get<Good>(`/api/goods/${id}`),
  create: (payload: CreateGoodPayload) =>
    http.post<Good>("/api/goods", payload),
  update: (id: number, payload: UpdateGoodPayload) =>
    http.patch<Good>(`/api/goods/${id}`, payload),
  remove: (id: number) => http.delete<{ message: string }>(`/api/goods/${id}`),
};

// API для работы с пользователями (для администратора)
export const UsersApi = {
  list: () => http.get<User[]>("/api/users"),
  one: (id: number) => http.get<User>(`/api/users/${id}`),
  update: (id: number, payload: Partial<User> & { role?: string }) =>
    http.patch<User>(`/api/users/${id}`, payload), 
  block: (id: number) => http.delete<{ message: string }>(`/api/users/${id}`),
};
