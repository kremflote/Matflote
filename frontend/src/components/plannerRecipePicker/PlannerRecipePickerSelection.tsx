import { plannerPickerStyles } from "../../styles/appStyles";
import { getThumbnailSrc } from "../../utils/imageThumbnail";

type PlannerRecipePickerSelectionProps = {
  items: PlannerPickerSelectedItem[];
  onRemoveItem: (item: PlannerPickerSelectedItem) => void;
};

export type PlannerPickerSelectedItem = {
  id: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  kind: "recipe" | "ingredient";
  name: string;
  valueLabel: string;
};

function PlannerRecipePickerSelection({
  items,
  onRemoveItem,
}: PlannerRecipePickerSelectionProps) {
  return (
    <div className={plannerPickerStyles.selectedThumbnailList} aria-live="polite">
      {items.map((item) => {
        const imageUrl = getThumbnailSrc(item);

        return (
          <button
            aria-label={item.name}
            className={plannerPickerStyles.selectedThumbnailButton}
            key={`${item.kind}-${item.id}`}
            title={item.name}
            type="button"
            onClick={() => onRemoveItem(item)}
          >
            <span className={plannerPickerStyles.selectedThumbnailFrame}>
              {imageUrl === null ? (
                <span className={plannerPickerStyles.selectedThumbnailFallback} />
              ) : (
                <img alt="" className={plannerPickerStyles.selectedThumbnailImage} src={imageUrl} decoding="async" />
              )}
            </span>
            <span className={plannerPickerStyles.selectedThumbnailAmount}>
              {item.valueLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default PlannerRecipePickerSelection;
