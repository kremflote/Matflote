import { recipeBrowserStyles } from "./recipeBrowserStyles";

type FilterChipProps = {
  label: string;
  onClick: () => void;
};

function FilterChip({ label, onClick }: FilterChipProps) {
  return (
    <button className={recipeBrowserStyles.filterChip} type="button" onClick={onClick}>
      {label}
      <span aria-hidden="true">x</span>
    </button>
  );
}

export default FilterChip;
