import { getDocumentTranslations } from "../i18n";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:5132" : "");

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);

  const hasJsonBody = options.body !== undefined && !(options.body instanceof FormData);
  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await sendRequest(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: hasJsonBody ? JSON.stringify(options.body) : (options.body as BodyInit | undefined),
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  try {
    return (await response.json()) as TResponse;
  } catch (_error) {
    // A 200 that is not JSON (an HTML page from a proxy, say) is a failure, not data.
    throw new ApiError(getMessages().requestFailed(response.status), response.status);
  }
}

/** fetch, with a network failure (server down, offline) turned into an ApiError with status 0. */
export async function sendRequest(input: string, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(getMessages().serverUnreachable, 0);
  }
}

/**
 * The error for a failed response. The server's own message is used when it sent one as JSON
 * (`{ "error": ... }` or ProblemDetails); anything else, such as a proxy's HTML error page,
 * becomes a short message with the status, never the raw body.
 */
export async function toApiError(response: Response) {
  return new ApiError((await readServerMessage(response)) ?? getMessages().requestFailed(response.status), response.status);
}

export function getApiAssetUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readServerMessage(response: Response): Promise<string | null> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("json")) {
    return null;
  }

  try {
    const body = (await response.json()) as unknown;
    if (typeof body !== "object" || body === null) {
      return null;
    }

    for (const key of ["error", "detail", "title"] as const) {
      const value = (body as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  } catch (_error) {
    return null;
  }
}

function getMessages() {
  return getDocumentTranslations().common;
}
