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
  list: () => http.get<Good[]>("/api/goods"),
  one: (id: number) => http.get<Good>(`/api/goods/${id}`),
  create: (payload: CreateGoodPayload) =>
    http.post<Good>("/api/goods", payload),
  update: (id: number, payload: UpdateGoodPayload) =>
    http.patch<Good>(`/api/goods/${id}`, payload),
  remove: (id: number) =>
    http.delete<{ message: string }>(`/api/goods/${id}`)
};