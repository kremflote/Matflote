import { useMemo } from "react";
import type { IBrandContext } from "../interfaces/contexts/IBrandContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { brandService } from "../services";
import { useCatalogList } from "./contextHelpers";
import { BrandContext } from "./contextHooks";

export function BrandProvider({ children }: IProviderProps) {
  const { items: brands, isLoading: brandIsLoading, error: initError, refresh: refreshBrands } =
    useCatalogList(brandService.getAll);

  const value = useMemo<IBrandContext>(
    () => ({
      brands,
      brandIsLoading,
      initError,
      refreshBrands,
    }),
    [brands, brandIsLoading, initError, refreshBrands],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}
