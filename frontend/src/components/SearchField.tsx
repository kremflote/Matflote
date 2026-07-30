import { forwardRef, type InputHTMLAttributes, type KeyboardEventHandler } from "react";
import type { SiteTheme } from "../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowser/recipeBrowserStyles";

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> & {
  inputClassName: string;
  theme: SiteTheme;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    className = "",
    inputClassName,
    theme,
    value,
    onChange,
    ...inputProps
  },
  ref,
) {
  return (
    <div className={`${recipeBrowserStyles.searchFieldInlineShell} ${className}`}>
      <input
        {...inputProps}
        className={`${inputClassName} ${recipeBrowserStyles.searchInputClearPadding}`}
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value.length > 0 && (
        <button
          aria-label={inputProps["aria-label"]?.toString() ?? "Clear search"}
          className={recipeBrowserStyles.searchClearButton(theme)}
          type="button"
          onClick={() => onChange("")}
        >
          <svg
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
          </svg>
        </button>
      )}
    </div>
  );
});

export default SearchField;
