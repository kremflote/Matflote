import type { IDish } from "../IDish";

export interface IDishContext {
  dishes: IDish[];
  dishIsLoading: boolean;
  initError: string | null;
  refreshDishes: () => Promise<void>;
}
