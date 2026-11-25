import type { MeasurementUnit } from "../../interfaces/IIngredient";

/**
 * "0,5 kg" or "250 g": the amount scaled to the chosen portions, with up to two decimals in the
 * locale's own decimal separator. An amount of null shows just the unit.
 */
export function formatRecipeIngredientAmount(
  amount: number | null,
  unit: MeasurementUnit,
  unitLabels: Record<MeasurementUnit, string>,
  locale: string,
  multiplier = 1,
) {
  if (amount === null) {
    return unitLabels[unit];
  }

  const scaledAmount = (amount * multiplier).toLocaleString(locale, {
    maximumFractionDigits: 2,
    useGrouping: false,
  });
  return `${scaledAmount} ${unitLabels[unit].toLowerCase()}`;
}
