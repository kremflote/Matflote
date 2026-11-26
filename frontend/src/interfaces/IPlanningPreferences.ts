export interface IPlanningPreferences {
  /** The household size; the same number as "people eating" on the Nutrition page. */
  peopleEating: number;
  minFishDinnersPerWeek: number;
  minChickenDinnersPerWeek: number;
  avoidTags: string[];
  avoidIngredients: string[];
  /** How many weeks before the same dinner may be planned again. 0 means no rule. */
  repeatAfterWeeks: number;
  notes: string | null;
}
