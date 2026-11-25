// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./apiClient";

const nginx502 =
  "<html>\r\n<head><title>502 Bad Gateway</title></head>\r\n<body>\r\n<center><h1>502 Bad Gateway</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n";

function respondWith(response: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (response instanceof Error) {
        throw response;
      }
      return response;
    }),
  );
}

async function errorOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("The request did not fail.");
}

beforeEach(() => {
  document.documentElement.lang = "en";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest errors (F7)", () => {
  it("never shows a proxy's HTML error page, only a short message with the status", async () => {
    respondWith(new Response(nginx502, { status: 502, headers: { "Content-Type": "text/html" } }));

    const error = await errorOf(apiRequest("/api/recipes"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.message).not.toContain("<");
    expect(error.message).toBe("The server could not complete the request (status 502).");
  });

  it("uses the UI language for the generic message", async () => {
    document.documentElement.lang = "nb";
    respondWith(new Response("Bad Gateway", { status: 502, headers: { "Content-Type": "text/plain" } }));

    const error = await errorOf(apiRequest("/api/recipes"));

    expect(error.message).toBe("Serveren kunne ikke fullføre forespørselen (status 502).");
  });

  it("keeps the server's own message when it sends JSON", async () => {
    respondWith(new Response(JSON.stringify({ error: "Recipe name is required." }), { status: 400, headers: { "Content-Type": "application/json" } }));
    expect((await errorOf(apiRequest("/api/recipes"))).message).toBe("Recipe name is required.");

    respondWith(new Response(JSON.stringify({ title: "Not Found", status: 404 }), { status: 404, headers: { "Content-Type": "application/problem+json" } }));
    expect((await errorOf(apiRequest("/api/recipes/9"))).message).toBe("Not Found");
  });

  it("falls back to the generic message for JSON without a message or a broken JSON body", async () => {
    respondWith(new Response(JSON.stringify({ errors: {} }), { status: 500, headers: { "Content-Type": "application/json" } }));
    expect((await errorOf(apiRequest("/api/recipes"))).message).toBe("The server could not complete the request (status 500).");

    respondWith(new Response("<html>", { status: 500, headers: { "Content-Type": "application/json" } }));
    expect((await errorOf(apiRequest("/api/recipes"))).message).toBe("The server could not complete the request (status 500).");
  });

  it("treats a successful response that is not JSON as a failure", async () => {
    respondWith(new Response("<!doctype html><html></html>", { status: 200, headers: { "Content-Type": "text/html" } }));

    const error = await errorOf(apiRequest("/api/recipes"));

    expect(error.status).toBe(200);
    expect(error.message).not.toContain("<");
  });

  it("says the server could not be reached when the request never got an answer", async () => {
    respondWith(new TypeError("Failed to fetch"));

    const error = await errorOf(apiRequest("/api/recipes"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toBe("Could not reach the server. Check the connection and try again.");
  });
});
