import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IStore } from "../interfaces/ILookup";
import type { IStoreContext } from "../interfaces/contexts/IStoreContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { storeService } from "../services";
import { getErrorMessage } from "./contextHelpers";

const StoreContext = createContext<IStoreContext | null>(null);

export function StoreProvider({ children }: IProviderProps) {
  const [stores, setStores] = useState<IStore[]>([]);
  const [storeIsLoading, setStoreIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshStores = useCallback(async () => {
    setStoreIsLoading(true);
    setInitError(null);

    try {
      setStores(await storeService.getAll());
    } catch (error) {
      setInitError(getErrorMessage(error));
    } finally {
      setStoreIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStores();
  }, [refreshStores]);

  const value = useMemo<IStoreContext>(
    () => ({
      stores,
      storeIsLoading,
      initError,
      refreshStores,
    }),
    [stores, storeIsLoading, initError, refreshStores],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStores() {
  const context = useContext(StoreContext);
  if (context === null) {
    throw new Error("useStores must be used inside StoreProvider.");
  }

  return context;
}
