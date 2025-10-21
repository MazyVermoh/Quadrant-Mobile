import Constants from "expo-constants";

const defaultApiUrl = "http://localhost:8001";

const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;

export const API_URL =
  (typeof extra?.apiUrl === "string" && extra.apiUrl) ||
  (typeof process.env.EXPO_PUBLIC_API_URL === "string" && process.env.EXPO_PUBLIC_API_URL) ||
  defaultApiUrl;

type FetchOptions = RequestInit & { token?: string };

export const apiFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  const response = await fetch(url, {
    ...options,
    headers
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }
  return response.json() as Promise<T>;
};
