//src/utils/server/utils.ts

import { ApiResponse } from "@/config";
import { SITE_URL } from "@/config/url";

export const postRequest = async <T>({
  url,
  data,
}: {
  url: string;
  data?: T;
}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
};

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  data?: unknown;
}

export async function request<T>({ method, path, data }: RequestOptions): Promise<T> {
  const url = `${SITE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || `Erreur API (${res.status})`);
  }
  return result;
}

export const tryData = async <T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
};

export async function tryCatch<T>(promise: Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await promise;
    return { data };
  } catch (err: unknown) {
    return { error: (err as Error)?.message || "Erreur inconnue" };
  }
}

export async function actionData<T>(action: Promise<ApiResponse<T>>): Promise<T> {
  const result = await action;

  if ("error" in result) {
    throw new Error(result.error);
  }

  return result.data;
}

export function isError<T>(result: ApiResponse<T>): result is { error: string } {
  return "error" in result;
}
