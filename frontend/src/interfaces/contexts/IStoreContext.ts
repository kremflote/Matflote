import type { IStore } from "../ILookup";

export interface IStoreContext {
  stores: IStore[];
  storeIsLoading: boolean;
  initError: string | null;
  refreshStores: () => Promise<void>;
}
