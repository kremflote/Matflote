import type { SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type FilterChipProps = {
  label: string;
  theme: SiteTheme;
  onClick: () => void;
};

function FilterChip({ label, theme, onClick }: FilterChipProps) {
  return (
    <button className={recipeBrowserStyles.filterChip(theme)} type="button" onClick={onClick}>
      {label}
      <span aria-hidden="true">x</span>
    </button>
  );
}

export default FilterChip;
