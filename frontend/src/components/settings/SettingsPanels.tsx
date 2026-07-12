import { useLanguage } from "../../contexts";
import type { IAppSettings } from "../../interfaces/IAppSettings";
import { supportedLanguages } from "../../i18n";
import { settingsStyles, type SiteTheme } from "../../styles/appStyles";

export type ExportSettingsForm = {
  provider: string;
  taskMode: "SingleTask" | "SeparateTasks";
  vikunjaBaseUrl: string;
  vikunjaProjectId: string;
  vikunjaApiToken: string;
};

type LanguageSettingsPanelProps = {
  theme: SiteTheme;
};

export function LanguageSettingsPanel({ theme }: LanguageSettingsPanelProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={settingsStyles.languagePanel(theme)} aria-label={t.settings.languageTitle}>
      <span className={settingsStyles.languagePanelTitle}>{t.settings.languageTitle}</span>
      <div className={settingsStyles.languageOptions}>
        {supportedLanguages.map((languageOption) => (
          <button
            aria-label={languageOption === "en" ? t.language.english : t.language.norwegian}
            aria-pressed={language === languageOption}
            className={settingsStyles.languageButton(theme, language === languageOption)}
            key={languageOption}
            type="button"
            onClick={() => setLanguage(languageOption)}
          >
            <span className={settingsStyles.languageFlag} aria-hidden="true">
              {languageOption === "en" ? "🇬🇧" : "🇳🇴"}
            </span>
            <span className={settingsStyles.languageCode}>
              {languageOption === "en" ? t.language.englishShort : t.language.norwegianShort}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

type ExportSettingsPanelProps = {
  appSettings: IAppSettings | null;
  exportForm: ExportSettingsForm;
  isLoading: boolean;
  isSaving: boolean;
  isTesting: boolean;
  settingsError: string | null;
  settingsSuccess: string | null;
  theme: SiteTheme;
  onChange: (nextForm: ExportSettingsForm) => void;
  onSave: () => void;
  onTestConnection: () => void;
};

export function ExportSettingsPanel({
  appSettings,
  exportForm,
  isLoading,
  isSaving,
  isTesting,
  settingsError,
  settingsSuccess,
  theme,
  onChange,
  onSave,
  onTestConnection,
}: ExportSettingsPanelProps) {
  const { t } = useLanguage();
  const controlsDisabled = isLoading || isSaving || isTesting;

  return (
    <div className={settingsStyles.panel(theme)}>
      <div>
        <h2 className={settingsStyles.panelTitle}>{t.settings.exportTitle}</h2>
        <p className={settingsStyles.panelBody(theme)}>{t.settings.exportBody}</p>
      </div>
      <form
        className={settingsStyles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className={settingsStyles.formGrid}>
          <label className={settingsStyles.fieldGroup}>
            <span className={settingsStyles.label}>{t.settings.provider}</span>
            <select
              className={settingsStyles.selectInput(theme)}
              disabled={controlsDisabled}
              value={exportForm.provider}
              onChange={(event) => onChange({ ...exportForm, provider: event.target.value })}
            >
              <option value="Vikunja">Vikunja</option>
            </select>
          </label>
          <label className={settingsStyles.fieldGroup}>
            <span className={settingsStyles.label}>{t.settings.projectId}</span>
            <input
              className={settingsStyles.textInput(theme)}
              disabled={controlsDisabled}
              min="1"
              type="number"
              value={exportForm.vikunjaProjectId}
              onChange={(event) => onChange({ ...exportForm, vikunjaProjectId: event.target.value })}
            />
          </label>
        </div>
        <div aria-label={t.settings.exportMode} className={settingsStyles.fieldGroup} role="group">
          <span className={settingsStyles.label}>{t.settings.exportMode}</span>
          <div className={settingsStyles.buttonGroup}>
            <button
              aria-pressed={exportForm.taskMode === "SingleTask"}
              className={settingsStyles.languageButton(theme, exportForm.taskMode === "SingleTask")}
              disabled={controlsDisabled}
              type="button"
              onClick={() => onChange({ ...exportForm, taskMode: "SingleTask" })}
            >
              {t.settings.exportModeSingleTask}
            </button>
            <button
              aria-pressed={exportForm.taskMode === "SeparateTasks"}
              className={settingsStyles.languageButton(theme, exportForm.taskMode === "SeparateTasks")}
              disabled={controlsDisabled}
              type="button"
              onClick={() => onChange({ ...exportForm, taskMode: "SeparateTasks" })}
            >
              {t.settings.exportModeSeparateTasks}
            </button>
          </div>
          <span className={settingsStyles.helpText(theme)}>
            {exportForm.taskMode === "SeparateTasks"
              ? t.settings.exportModeSeparateTasksHelp
              : t.settings.exportModeSingleTaskHelp}
          </span>
        </div>
        <label className={settingsStyles.fieldGroup}>
          <span className={settingsStyles.label}>{t.settings.vikunjaBaseUrl}</span>
          <input
            className={settingsStyles.textInput(theme)}
            disabled={controlsDisabled}
            placeholder={t.settings.vikunjaBaseUrlPlaceholder}
            type="url"
            value={exportForm.vikunjaBaseUrl}
            onChange={(event) => onChange({ ...exportForm, vikunjaBaseUrl: event.target.value })}
          />
        </label>
        <label className={settingsStyles.fieldGroup}>
          <span className={settingsStyles.label}>{t.settings.apiToken}</span>
          <input
            autoComplete="off"
            className={settingsStyles.textInput(theme)}
            disabled={controlsDisabled}
            placeholder={appSettings?.shoppingListExport.vikunja.hasApiToken ? t.settings.apiTokenConfigured : t.settings.apiTokenPlaceholder}
            type="password"
            value={exportForm.vikunjaApiToken}
            onChange={(event) => onChange({ ...exportForm, vikunjaApiToken: event.target.value })}
          />
          <span className={settingsStyles.helpText(theme)}>{t.settings.apiTokenHelp}</span>
        </label>
        <div className={settingsStyles.statusRow}>
          <div>
            {settingsError !== null && (
              <p className={settingsStyles.statusText(theme, "error")}>{settingsError}</p>
            )}
            {settingsSuccess !== null && (
              <p className={settingsStyles.statusText(theme, "success")}>{settingsSuccess}</p>
            )}
          </div>
          <button
            className={settingsStyles.secondaryButton(theme)}
            disabled={controlsDisabled}
            type="button"
            onClick={onTestConnection}
          >
            {isTesting ? t.settings.testingConnection : t.settings.testConnection}
          </button>
          <button
            className={settingsStyles.saveButton(theme)}
            disabled={controlsDisabled}
            type="submit"
          >
            {isSaving ? t.settings.saving : t.settings.saveSettings}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CurrentProviderSummary({ appSettings, theme }: { appSettings: IAppSettings; theme: SiteTheme }) {
  const { t } = useLanguage();
  const modeLabel =
    appSettings.shoppingListExport.taskMode === "SeparateTasks"
      ? t.settings.exportModeSeparateTasks
      : t.settings.exportModeSingleTask;

  return (
    <section className={settingsStyles.currentProviderCard(theme)} aria-label={t.settings.currentProvider}>
      <div className={settingsStyles.currentProviderDetails}>
        <ProviderSummaryItem label={t.settings.provider} theme={theme} value={appSettings.shoppingListExport.provider} />
        <ProviderSummaryItem label={t.settings.currentProviderMode} theme={theme} value={modeLabel} />
      </div>
    </section>
  );
}

function ProviderSummaryItem({ label, theme, value }: { label: string; theme: SiteTheme; value: string }) {
  return (
    <div className={settingsStyles.currentProviderItem(theme)}>
      <div className={settingsStyles.currentProviderLabel}>{label}</div>
      <div className={settingsStyles.currentProviderValue}>{value}</div>
    </div>
  );
}

type SystemInfoPanelProps = {
  appSettings: IAppSettings;
  theme: SiteTheme;
};

export function SystemInfoPanel({ appSettings, theme }: SystemInfoPanelProps) {
  const { t } = useLanguage();

  return (
    <div className={settingsStyles.panel(theme)}>
      <div>
        <h2 className={settingsStyles.panelTitle}>{t.settings.systemTitle}</h2>
        <p className={settingsStyles.panelBody(theme)}>{t.settings.systemBody}</p>
      </div>
      <div className={settingsStyles.systemGrid}>
        <InfoRow label={t.settings.environment} theme={theme} value={appSettings.systemInfo.environmentName} />
        <InfoRow label={t.settings.databaseProvider} theme={theme} value={appSettings.systemInfo.databaseProvider} />
        <InfoRow label={t.settings.imageStorage} theme={theme} value={appSettings.systemInfo.imageStorageRootPath} />
      </div>
    </div>
  );
}

function InfoRow({ label, theme, value }: { label: string; theme: SiteTheme; value: string }) {
  return (
    <div className={settingsStyles.systemRow(theme)}>
      <span className={settingsStyles.systemLabel}>{label}</span>
      <span className={settingsStyles.systemValue}>{value}</span>
    </div>
  );
}
