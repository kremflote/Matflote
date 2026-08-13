import { useLanguage } from "../../contexts";
import type { IAppSettings } from "../../interfaces/IAppSettings";
import type { IImageCleanupReport } from "../../interfaces/IMaintenance";
import { supportedLanguages } from "../../i18n";
import { API_BASE_URL } from "../../services/apiClient";
import { settingsStyles, type SiteTheme } from "../../styles/appStyles";

export type ExportSettingsForm = {
  helsedirektoratetBaseUrl: string;
  helsedirektoratetSubscriptionKey: string;
  kassalappApiKey: string;
  kassalappBaseUrl: string;
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
  isTestingKassalapp: boolean;
  isTestingVikunja: boolean;
  isUpdatingNutritionReferences: boolean;
  settingsError: string | null;
  settingsSuccess: string | null;
  theme: SiteTheme;
  onChange: (nextForm: ExportSettingsForm) => void;
  onSave: () => void;
  onTestKassalappConnection: () => void;
  onTestVikunjaConnection: () => void;
  onUpdateNutritionReferences: () => void;
};

export function ExportSettingsPanel({
  appSettings,
  exportForm,
  isLoading,
  isSaving,
  isTestingKassalapp,
  isTestingVikunja,
  isUpdatingNutritionReferences,
  settingsError,
  settingsSuccess,
  theme,
  onChange,
  onSave,
  onTestKassalappConnection,
  onTestVikunjaConnection,
  onUpdateNutritionReferences,
}: ExportSettingsPanelProps) {
  const { t } = useLanguage();
  const controlsDisabled = isLoading || isSaving || isTestingVikunja || isTestingKassalapp || isUpdatingNutritionReferences;

  return (
    <div className={settingsStyles.panel(theme)}>
      <div>
        <h2 className={settingsStyles.panelTitle}>{t.settings.integrationsTitle}</h2>
        <p className={settingsStyles.panelBody(theme)}>{t.settings.integrationsBody}</p>
      </div>
      <form
        className={settingsStyles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className={settingsStyles.integrationBlock}>
          <div>
            <h3 className={settingsStyles.subsectionTitle}>{t.settings.todoListTitle}</h3>
            <p className={settingsStyles.helpText(theme)}>{t.settings.exportBody}</p>
          </div>
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
        <div className={settingsStyles.inlineActionRow}>
          <button
            className={settingsStyles.secondaryButton(theme)}
            disabled={controlsDisabled}
            type="button"
            onClick={onTestVikunjaConnection}
          >
            {isTestingVikunja ? t.settings.testingConnection : t.settings.testConnection}
          </button>
        </div>
        </div>

        <div className={settingsStyles.integrationBlock}>
          <div>
            <h3 className={settingsStyles.subsectionTitle}>{t.settings.scannerIntegrationTitle}</h3>
            <p className={settingsStyles.helpText(theme)}>{t.settings.scannerIntegrationBody}</p>
          </div>
          <label className={settingsStyles.fieldGroup}>
            <span className={settingsStyles.label}>{t.settings.kassalappBaseUrl}</span>
            <input
              className={settingsStyles.textInput(theme)}
              disabled={controlsDisabled}
              placeholder={t.settings.kassalappBaseUrlPlaceholder}
              type="url"
              value={exportForm.kassalappBaseUrl}
              onChange={(event) => onChange({ ...exportForm, kassalappBaseUrl: event.target.value })}
            />
          </label>
          <label className={settingsStyles.fieldGroup}>
            <span className={settingsStyles.label}>{t.settings.kassalappApiKey}</span>
            <input
              autoComplete="off"
              className={settingsStyles.textInput(theme)}
              disabled={controlsDisabled}
              placeholder={appSettings?.externalIntegrations.kassalapp.hasApiKey ? t.settings.apiTokenConfigured : t.settings.kassalappApiKeyPlaceholder}
              type="password"
              value={exportForm.kassalappApiKey}
              onChange={(event) => onChange({ ...exportForm, kassalappApiKey: event.target.value })}
            />
            <span className={settingsStyles.helpText(theme)}>{t.settings.apiTokenHelp}</span>
          </label>
          <div className={settingsStyles.inlineActionRow}>
            <button
              className={settingsStyles.secondaryButton(theme)}
              disabled={controlsDisabled}
              type="button"
              onClick={onTestKassalappConnection}
            >
              {isTestingKassalapp ? t.settings.testingConnection : t.settings.testConnection}
            </button>
          </div>
        </div>

        <div className={settingsStyles.integrationBlock}>
          <div>
            <h3 className={settingsStyles.subsectionTitle}>{t.settings.nutritionIntegrationTitle}</h3>
            <p className={settingsStyles.helpText(theme)}>{t.settings.nutritionIntegrationBody}</p>
          </div>
          <label className={settingsStyles.fieldGroup}>
            <span className={settingsStyles.label}>{t.settings.helsedirektoratetBaseUrl}</span>
            <input
              className={settingsStyles.textInput(theme)}
              disabled={controlsDisabled}
              placeholder={t.settings.helsedirektoratetBaseUrlPlaceholder}
              type="url"
              value={exportForm.helsedirektoratetBaseUrl}
              onChange={(event) => onChange({ ...exportForm, helsedirektoratetBaseUrl: event.target.value })}
            />
          </label>
          <label className={settingsStyles.fieldGroup}>
            <span className={settingsStyles.label}>{t.settings.helsedirektoratetSubscriptionKey}</span>
            <input
              autoComplete="off"
              className={settingsStyles.textInput(theme)}
              disabled={controlsDisabled}
              placeholder={appSettings?.externalIntegrations.helsedirektoratet.hasSubscriptionKey ? t.settings.apiTokenConfigured : t.settings.helsedirektoratetSubscriptionKeyPlaceholder}
              type="password"
              value={exportForm.helsedirektoratetSubscriptionKey}
              onChange={(event) => onChange({ ...exportForm, helsedirektoratetSubscriptionKey: event.target.value })}
            />
            <span className={settingsStyles.helpText(theme)}>{t.settings.apiTokenHelp}</span>
          </label>
          <div className={settingsStyles.inlineActionRow}>
            <button
              className={settingsStyles.secondaryButton(theme)}
              disabled={controlsDisabled}
              type="button"
              onClick={onUpdateNutritionReferences}
            >
              {isUpdatingNutritionReferences ? t.settings.updatingReferenceValues : t.settings.updateReferenceValues}
            </button>
          </div>
        </div>

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

type MaintenancePanelProps = {
  imageCleanupReport: IImageCleanupReport | null;
  isCleaningImages: boolean;
  isImportingSeedCatalog: boolean;
  isLoadingImageReport: boolean;
  theme: SiteTheme;
  onCleanupImages: () => void;
  onImportSeedCatalog: (file: File) => void;
  onLoadImageReport: () => void;
};

export function MaintenancePanel({
  imageCleanupReport,
  isCleaningImages,
  isImportingSeedCatalog,
  isLoadingImageReport,
  theme,
  onCleanupImages,
  onImportSeedCatalog,
  onLoadImageReport,
}: MaintenancePanelProps) {
  const { t } = useLanguage();
  const unusedImageCount =
    (imageCleanupReport?.unusedUploadedImages.length ?? 0) +
    (imageCleanupReport?.untrackedImageFiles.length ?? 0);

  return (
    <div className={settingsStyles.panel(theme)}>
      <div>
        <h2 className={settingsStyles.panelTitle}>{t.settings.maintenanceTitle}</h2>
        <p className={settingsStyles.panelBody(theme)}>{t.settings.maintenanceBody}</p>
      </div>
      <div className={settingsStyles.statusRow}>
        <a
          className={settingsStyles.secondaryButton(theme)}
          href={`${API_BASE_URL}/api/seed-catalog/export-package`}
        >
          {t.settings.downloadExportPackage}
        </a>
        <label className={settingsStyles.secondaryButton(theme)}>
          {isImportingSeedCatalog ? t.settings.importingSeedCatalog : t.settings.importSeedCatalog}
          <input
            accept="application/json,.json"
            className="sr-only"
            disabled={isImportingSeedCatalog}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file !== undefined) {
                onImportSeedCatalog(file);
              }
            }}
          />
        </label>
        <button
          className={settingsStyles.secondaryButton(theme)}
          disabled={isLoadingImageReport || isCleaningImages}
          type="button"
          onClick={onLoadImageReport}
        >
          {isLoadingImageReport ? t.settings.checkingImages : t.settings.checkImages}
        </button>
        <button
          className={settingsStyles.saveButton(theme)}
          disabled={imageCleanupReport === null || unusedImageCount === 0 || isLoadingImageReport || isCleaningImages}
          type="button"
          onClick={onCleanupImages}
        >
          {isCleaningImages ? t.settings.cleaningImages : t.settings.cleanupImages}
        </button>
      </div>
      {imageCleanupReport !== null && (
        <p className={settingsStyles.panelBody(theme)}>
          {t.settings.imageCleanupSummary(
            imageCleanupReport.unusedUploadedImages.length,
            imageCleanupReport.untrackedImageFiles.length,
          )}
        </p>
      )}
    </div>
  );
}
