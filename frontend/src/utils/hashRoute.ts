import { useCallback, useSyncExternalStore } from "react";

/**
 * Addresses for the pages and for an open recipe or ingredient, kept in the URL's hash so links,
 * bookmarks and the browser's back button work without a router or any server change:
 *
 *   #/planner   #/planner/recipe/12
 *   #/cookbook  #/cookbook/recipe/12  #/cookbook/ingredient/7
 *   #/scanner   #/nutrition   #/settings
 *
 * The week shown in the planner is not part of the address; it stays in session storage.
 */

export type RoutePage = "weekPlanner" | "cookbook" | "scanner" | "nutrition" | "settings";

export type RouteDetail = { kind: "recipe" | "ingredient"; id: number };

export type AppRoute = { page: RoutePage; detail: RouteDetail | null };

const pageSlugs: Record<RoutePage, string> = {
  weekPlanner: "planner",
  cookbook: "cookbook",
  scanner: "scanner",
  nutrition: "nutrition",
  settings: "settings",
};

/** Which details a page can show: a recipe from the planner; a recipe or ingredient in the cookbook. */
const detailKindsByPage: Record<RoutePage, ReadonlyArray<RouteDetail["kind"]>> = {
  weekPlanner: ["recipe"],
  cookbook: ["recipe", "ingredient"],
  scanner: [],
  nutrition: [],
  settings: [],
};

/** Marks a history entry that opening a detail added, so closing it can go back instead of adding another. */
const detailStateKey = "matfloteDetail";
const navigateEvent = "matflote:navigate";

export function parseHash(hash: string): AppRoute | null {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const page = (Object.keys(pageSlugs) as RoutePage[]).find((candidate) => pageSlugs[candidate] === parts[0]);
  if (page === undefined) {
    return null;
  }

  const [kind, rawId] = parts.slice(1);
  const id = Number(rawId);
  const detail: RouteDetail | null =
    (kind === "recipe" || kind === "ingredient") &&
    detailKindsByPage[page].includes(kind) &&
    Number.isInteger(id) &&
    id > 0
      ? { kind: kind as RouteDetail["kind"], id }
      : null;

  return { page, detail };
}

export function formatHash(route: AppRoute) {
  const base = `#/${pageSlugs[route.page]}`;
  return route.detail === null ? base : `${base}/${route.detail.kind}/${route.detail.id}`;
}

export function navigateTo(route: AppRoute, options: { replace?: boolean } = {}) {
  const hash = formatHash(route);
  if (hash === window.location.hash) {
    return;
  }

  const state = { [detailStateKey]: route.detail !== null && !options.replace };
  if (options.replace) {
    window.history.replaceState(state, "", hash);
  } else {
    window.history.pushState(state, "", hash);
  }

  window.dispatchEvent(new Event(navigateEvent));
}

/** Closes the open detail: goes back when opening it added the history entry, so Back does not reopen it. */
export function closeDetail(page: RoutePage) {
  const state: unknown = window.history.state;
  const openedHere =
    typeof state === "object" && state !== null && (state as Record<string, unknown>)[detailStateKey] === true;

  if (openedHere) {
    window.history.back();
    return;
  }

  navigateTo({ page, detail: null }, { replace: true });
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  window.addEventListener(navigateEvent, onChange);

  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(navigateEvent, onChange);
  };
}

const getHash = () => window.location.hash;

/** The route in the address bar, or null when the hash names no page. */
export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  return parseHash(hash);
}

/**
 * The recipe or ingredient a page shows by address, with functions that open and close it. A page
 * that is not the one in the address (for example in a test) sees no detail.
 */
export function useRouteDetail(page: RoutePage) {
  const route = useHashRoute();
  const detail = route?.page === page ? route.detail : null;
  const openDetail = useCallback((next: RouteDetail) => navigateTo({ page, detail: next }), [page]);
  const close = useCallback(() => closeDetail(page), [page]);

  return { detail, openDetail, closeDetail: close };
}
