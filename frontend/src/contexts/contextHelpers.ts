import { useCallback, useEffect, useRef, useState } from "react";
import { getDocumentTranslations } from "../i18n";

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : getDocumentTranslations().common.somethingWentWrong;
}

/**
 * Loads a catalog list once on mount and keeps it on screen while it is refreshed.
 * `isLoading` is true only until the first load has finished, so a refresh never replaces
 * the list with a loading state. A refresh that is overtaken by a newer one is ignored.
 */
export function useCatalogList<TItem>(load: () => Promise<TItem[]>) {
  const [items, setItems] = useState<TItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const refresh = useCallback(() => {
    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;

    return load()
      .then((nextItems) => {
        if (isLatest()) {
          setItems(nextItems);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isLatest()) {
          setError(getErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (isLatest()) {
          setHasLoaded(true);
        }
      });
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, setItems, isLoading: !hasLoaded, error, refresh };
}

/** Replaces the item with the same key, or adds it, and keeps the list in the server's order. */
export function upsertSorted<TItem>(
  items: TItem[],
  item: TItem,
  getKey: (value: TItem) => number,
  compare: (first: TItem, second: TItem) => number,
) {
  const key = getKey(item);
  return [...items.filter((current) => getKey(current) !== key), item].sort(compare);
}

/** Ordinal comparison, the order SQLite's default collation gives the API's `ORDER BY name`. */
export function compareOrdinal(first: string, second: string) {
  return first < second ? -1 : first > second ? 1 : 0;
}
