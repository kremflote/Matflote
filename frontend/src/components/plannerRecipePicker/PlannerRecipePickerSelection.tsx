import type { SiteTheme } from "../../styles/appStyles";
import { plannerPickerStyles } from "../../styles/appStyles";
import { getApiAssetUrl } from "../../services/apiClient";

type PlannerRecipePickerSelectionProps = {
  items: PlannerPickerSelectedItem[];
  theme: SiteTheme;
  onRemoveItem: (item: PlannerPickerSelectedItem) => void;
};

export type PlannerPickerSelectedItem = {
  id: number;
  imageUrl: string | null;
  kind: "recipe" | "ingredient";
  name: string;
  valueLabel: string;
};

function PlannerRecipePickerSelection({
  items,
  theme,
  onRemoveItem,
}: PlannerRecipePickerSelectionProps) {
  return (
    <div className={plannerPickerStyles.selectedThumbnailList} aria-live="polite">
      {items.map((item) => {
        const imageUrl = getApiAssetUrl(item.imageUrl);

        return (
          <button
            aria-label={item.name}
            className={plannerPickerStyles.selectedThumbnailButton(theme)}
            key={`${item.kind}-${item.id}`}
            title={item.name}
            type="button"
            onClick={() => onRemoveItem(item)}
          >
            <span className={plannerPickerStyles.selectedThumbnailFrame(theme)}>
              {imageUrl === null ? (
                <span className={plannerPickerStyles.selectedThumbnailFallback(theme)} />
              ) : (
                <img alt="" className={plannerPickerStyles.selectedThumbnailImage} src={imageUrl} />
              )}
            </span>
            <span className={plannerPickerStyles.selectedThumbnailAmount(theme)}>
              {item.valueLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default PlannerRecipePickerSelection;
