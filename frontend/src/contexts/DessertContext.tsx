import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IDessert } from "../interfaces/IDessert";
import type { IDessertContext } from "../interfaces/contexts/IDessertContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { dessertService } from "../services";
import { getErrorMessage } from "./contextHelpers";

const DessertContext = createContext<IDessertContext | null>(null);

export function DessertProvider({ children }: IProviderProps) {
  const [desserts, setDesserts] = useState<IDessert[]>([]);
  const [dessertIsLoading, setDessertIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshDesserts = useCallback(async () => {
    setDessertIsLoading(true);
    setInitError(null);

    try {
      setDesserts(await dessertService.getAll());
    } catch (error) {
      setInitError(getErrorMessage(error));
    } finally {
      setDessertIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDesserts();
  }, [refreshDesserts]);

  const value = useMemo<IDessertContext>(
    () => ({
      desserts,
      dessertIsLoading,
      initError,
      refreshDesserts,
    }),
    [desserts, dessertIsLoading, initError, refreshDesserts],
  );

  return <DessertContext.Provider value={value}>{children}</DessertContext.Provider>;
}

export function useDesserts() {
  const context = useContext(DessertContext);
  if (context === null) {
    throw new Error("useDesserts must be used inside DessertProvider.");
  }

  return context;
}
