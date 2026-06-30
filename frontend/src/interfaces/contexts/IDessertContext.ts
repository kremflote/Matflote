import type { IDessert } from "../IDessert";

export interface IDessertContext {
  desserts: IDessert[];
  dessertIsLoading: boolean;
  initError: string | null;
  refreshDesserts: () => Promise<void>;
}
