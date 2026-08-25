/**
 * Centralized environment configuration.
 *
 * `VITE_API_BASE_URL` is the single source of truth for the Spring Boot API
 * base URL. There is deliberately no fallback value: a missing variable is a
 * configuration error, not something to silently guess.
 *
 * Local development: create a `.env.local` file (see `.env.example`) with
 *   VITE_API_BASE_URL=http://localhost:8080/api
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export const MISSING_API_BASE_URL_MESSAGE =
  "Configuration error: VITE_API_BASE_URL is not set. Create a .env.local file with " +
  "VITE_API_BASE_URL=http://localhost:8080/api and restart the dev server.";

const RAW_API_BASE_URL = import.meta.env['VITE_API_BASE_URL'] as string | undefined;

export const isApiBaseUrlConfigured =
  typeof RAW_API_BASE_URL === "string" && RAW_API_BASE_URL.trim().length > 0;

/** Returns the configured API base URL without a trailing slash. Throws when unset. */
export function getApiBaseUrl(): string {
  if (!isApiBaseUrlConfigured) {
    throw new ConfigError(MISSING_API_BASE_URL_MESSAGE);
  }
  return RAW_API_BASE_URL!.trim().replace(/\/$/, "");
}
