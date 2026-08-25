import { getApiBaseUrl, MISSING_API_BASE_URL_MESSAGE } from "@/config/env";

const TOKEN_KEY = "documind.token";
const USER_KEY = "documind.user";

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

export const userStorage = {
  get<T>(): T | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set(user: unknown) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** 0 = the backend could not be reached at all. */
export const BACKEND_UNAVAILABLE_MESSAGE =
  "Backend unavailable. Please start the Spring Boot API.";

/** Shown when a login/register attempt is rejected by the backend. */
export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

export function messageForStatus(status: number, fallback?: string): string {
  switch (status) {
    case 0:
      return BACKEND_UNAVAILABLE_MESSAGE;
    case 400:
      return fallback || "The request was invalid. Please check your input.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to access this page.";
    case 404:
      return fallback || "We couldn't find what you were looking for.";
    case 409:
      return fallback || "That record already exists.";
    case 413:
      return "File is too large.";
    case 429:
      return "Too many requests. Please slow down and try again.";
    case 500:
    case 502:
    case 503:
      return "Something went wrong. Please try again.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

async function extractError(response: Response): Promise<string | undefined> {
  try {
    const text = await response.text();
    if (!text) return undefined;
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      const value = json['message'] ?? json['error'] ?? json['detail'];
      if (typeof value === "string" && value.length < 300) return value;
    } catch {
      if (text.length < 300 && !text.includes("\tat ")) return text;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  /**
   * Marks login/register calls. A 401/403 then means "wrong credentials",
   * not "session expired", and must not trigger the global logout handler.
   */
  credentialsRequest?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal, credentialsRequest = false } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = tokenStorage.get();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let baseUrl: string;
  try {
    baseUrl = getApiBaseUrl();
  } catch {
    throw new ApiError(0, MISSING_API_BASE_URL_MESSAGE);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      ...(signal ? { signal } : {}),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, BACKEND_UNAVAILABLE_MESSAGE);
  }

  if (credentialsRequest && (response.status === 401 || response.status === 403)) {
    throw new ApiError(response.status, INVALID_CREDENTIALS_MESSAGE);
  }

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, messageForStatus(401));
  }

  if (!response.ok) {
    throw new ApiError(response.status, messageForStatus(response.status, await extractError(response)));
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Upload with progress. Uses XHR because fetch cannot report upload progress. */
export function apiUpload<T>(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let baseUrl: string;
    try {
      baseUrl = getApiBaseUrl();
    } catch {
      reject(new ApiError(0, MISSING_API_BASE_URL_MESSAGE));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}${path}`);
    const token = tokenStorage.get();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, BACKEND_UNAVAILABLE_MESSAGE));
    xhr.onload = () => {
      if (xhr.status === 401) {
        onUnauthorized?.();
        reject(new ApiError(401, messageForStatus(401)));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve((xhr.responseText ? JSON.parse(xhr.responseText) : undefined) as T);
        } catch {
          reject(new ApiError(500, messageForStatus(500)));
        }
        return;
      }
      let detail: string | undefined;
      try {
        const json = JSON.parse(xhr.responseText) as Record<string, unknown>;
        if (typeof json['message'] === "string") detail = json['message'] as string;
      } catch {
        /* ignore */
      }
      reject(new ApiError(xhr.status, messageForStatus(xhr.status, detail)));
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}