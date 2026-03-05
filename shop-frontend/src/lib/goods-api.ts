const API_URL =  "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";


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
  name: string;
  email: string;
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
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  // Если нет тела (например, DELETE 204), возвращаем undefined
  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}
// Темплейт для удобства создания запросов к API
const http = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>("GET", path, undefined, init),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>("POST", path, body, init),
  patch: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>("PATCH", path, body, init),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>("DELETE", path, undefined, init)
};

// Готовый API для работы с товарами
export const GoodsApi = {
  me: () => http.get<User>("/api/me", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`
    }
  }),
  register: (firstName: string, lastName: string, email: string, password: string) =>
    http.post<{ message: string }>("/api/auth/register", { firstName, lastName, email, password }),
  login: (email: string, password: string) =>
    http.post<string>("/api/auth/login", { email, password }),
  list: () => http.get<Good[]>("/api/goods"),
  one: (id: number) => http.get<Good>(`/api/goods/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`
    }
  }),
  create: (payload: CreateGoodPayload) =>
    http.post<Good>("/api/goods", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`
      }
    }),
  update: (id: number, payload: UpdateGoodPayload) =>
    http.patch<Good>(`/api/goods/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`
      }
    }),
  remove: (id: number) =>
    http.delete<{ message: string }>(`/api/goods/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`
      }
    })
};