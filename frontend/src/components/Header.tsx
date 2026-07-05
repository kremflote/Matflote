import { headerStyles, type SiteTheme } from "../styles/appStyles";

export type PageId = "settings" | "weekPlanner" | "cookbook";

const navItems: Array<{
  id: PageId;
  label: string;
  icon: "settings" | "calendar" | "book";
}> = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "weekPlanner", label: "Planner", icon: "calendar" },
  { id: "cookbook", label: "Cookbook", icon: "book" },
];

type HeaderProps = {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  theme: SiteTheme;
  onThemeChange: (theme: SiteTheme) => void;
};

function Header({ activePage, onPageChange, theme, onThemeChange }: HeaderProps) {
  function toggleTheme() {
    onThemeChange(theme === "dark" ? "paletteLight" : "dark");
  }

  const isLightSide = theme !== "dark";

  return (
    <header className={headerStyles.shell(theme)}>
      <div className={headerStyles.inner}>
        <button
          className={headerStyles.logo(theme)}
          type="button"
          aria-label="DinnerPlanner home"
          onClick={() => onPageChange("weekPlanner")}
        >
          DinnerPlanner
        </button>

        <nav className={headerStyles.nav} aria-label="Primary">
          {navItems.map((item) => (
            <button
              aria-current={activePage === item.id ? "page" : undefined}
              aria-label={item.label}
              className={headerStyles.navButton(theme, activePage === item.id)}
              key={item.id}
              onClick={() => onPageChange(item.id)}
              title={item.label}
              type="button"
            >
              <HeaderIcon icon={item.icon} />
              <span className={headerStyles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          aria-label={`Switch to ${theme === "dark" ? "palette light" : "dark"} mode`}
          aria-pressed={isLightSide}
          className={headerStyles.themeButton(theme)}
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "palette light" : "dark"} mode`}
          type="button"
        >
          <span className={headerStyles.themeTrack(theme)}>
            <span className={headerStyles.themeThumb(theme)}>
              <HeaderIcon icon={theme === "dark" ? "moon" : "sun"} />
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}

function HeaderIcon({ icon }: { icon: "settings" | "calendar" | "book" | "moon" | "sun" }) {
  if (icon === "settings") {
    return (
      <svg aria-hidden="true" className={headerStyles.icon} viewBox="0 0 24 24">
        <path d="M12 15.4A3.4 3.4 0 1 0 12 8.6a3.4 3.4 0 0 0 0 6.8Z" />
        <path d="M19.4 13.5a7.5 7.5 0 0 0 .1-1.5 7.5 7.5 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-2.6-1.5L14 2.4h-4L9.6 5a7.8 7.8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 0 0-.1 1.5 7.5 7.5 0 0 0 .1 1.5l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 2.6 1.5l.4 2.6h4l.4-2.6a7.8 7.8 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z" />
      </svg>
    );
  }

  if (icon === "calendar") {
    return (
      <svg aria-hidden="true" className={headerStyles.icon} viewBox="0 0 24 24">
        <path d="M7 2h2v3h6V2h2v3h3.5A1.5 1.5 0 0 1 22 6.5v13A2.5 2.5 0 0 1 19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-13A1.5 1.5 0 0 1 3.5 5H7V2Zm13 8H4v9.5c0 .3.2.5.5.5h15c.3 0 .5-.2.5-.5V10Z" />
      </svg>
    );
  }

  if (icon === "book") {
    return (
      <svg aria-hidden="true" className={headerStyles.icon} viewBox="0 0 24 24">
        <path d="M5 3h5.5c1 0 1.9.3 2.5 1 .6-.7 1.5-1 2.5-1H21v16h-5.5c-.7 0-1.3.2-1.8.7l-.7.7-.7-.7c-.5-.5-1.1-.7-1.8-.7H5V3Zm2 2v12h3.5c.6 0 1.1.1 1.5.3V6.5c-.3-1-1-1.5-1.5-1.5H7Zm7 1.5v10.8c.4-.2.9-.3 1.5-.3H19V5h-3.5c-.5 0-1.2.5-1.5 1.5Z" />
      </svg>
    );
  }

  if (icon === "sun") {
    return (
      <svg aria-hidden="true" className={headerStyles.themeIcon} viewBox="0 0 24 24">
        <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm1-15h-2v3h2V2Zm0 17h-2v3h2v-3ZM5.6 4.2 4.2 5.6l2.1 2.1 1.4-1.4-2.1-2.1Zm12.1 12.1-1.4 1.4 2.1 2.1 1.4-1.4-2.1-2.1ZM2 11v2h3v-2H2Zm17 0v2h3v-2h-3ZM6.3 16.3l-2.1 2.1 1.4 1.4 2.1-2.1-1.4-1.4ZM19.8 5.6l-1.4-1.4-2.1 2.1 1.4 1.4 2.1-2.1Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={headerStyles.themeIcon} viewBox="0 0 24 24">
      <path d="M20.8 14.4A8.6 8.6 0 0 1 9.6 3.2 9.1 9.1 0 1 0 20.8 14.4Z" />
    </svg>
  );
}

export default Header;
