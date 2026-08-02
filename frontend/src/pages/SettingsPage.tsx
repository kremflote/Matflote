import { useEffect, useState } from "react";
import {
  ExportSettingsPanel,
  CurrentProviderSummary,
  LanguageSettingsPanel,
  MaintenancePanel,
  SystemInfoPanel,
  type ExportSettingsForm,
} from "../components/settings/SettingsPanels";
import { useLanguage } from "../contexts";
import type { IAppSettings } from "../interfaces/IAppSettings";
import type { IImageCleanupReport } from "../interfaces/IMaintenance";
import { ApiError, appSettingsService, maintenanceService } from "../services";
import { pageStyles, settingsStyles, type SiteTheme } from "../styles/appStyles";

type SettingsPageProps = {
  theme: SiteTheme;
};

const SettingsPage = ({ theme }: SettingsPageProps) => {
  const { t } = useLanguage();
  const [appSettings, setAppSettings] = useState<IAppSettings | null>(null);
  const [exportForm, setExportForm] = useState<ExportSettingsForm>({
    helsedirektoratetBaseUrl: "https://api.helsedirektoratet.no",
    helsedirektoratetSubscriptionKey: "",
    kassalappApiKey: "",
    kassalappBaseUrl: "https://kassal.app/api/v1",
    provider: "Vikunja",
    taskMode: "SingleTask",
    vikunjaBaseUrl: "",
    vikunjaProjectId: "",
    vikunjaApiToken: "",
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [imageCleanupReport, setImageCleanupReport] = useState<IImageCleanupReport | null>(null);
  const [isLoadingImageReport, setIsLoadingImageReport] = useState(false);
  const [isCleaningImages, setIsCleaningImages] = useState(false);
  const [isImportingSeedCatalog, setIsImportingSeedCatalog] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      setIsLoadingSettings(true);
      setSettingsError(null);

      try {
        const nextSettings = await appSettingsService.get();

        if (ignore) {
          return;
        }

        setAppSettings(nextSettings);
        setExportForm({
          helsedirektoratetBaseUrl: nextSettings.externalIntegrations.helsedirektoratet.baseUrl,
          helsedirektoratetSubscriptionKey: "",
          kassalappApiKey: "",
          kassalappBaseUrl: nextSettings.externalIntegrations.kassalapp.baseUrl,
          provider: nextSettings.shoppingListExport.provider,
          taskMode: nextSettings.shoppingListExport.taskMode,
          vikunjaBaseUrl: nextSettings.shoppingListExport.vikunja.baseUrl,
          vikunjaProjectId: nextSettings.shoppingListExport.vikunja.projectId?.toString() ?? "",
          vikunjaApiToken: "",
        });
      } catch (error) {
        if (!ignore) {
          setSettingsError(getSettingsError(error, t.settings.couldNotLoad));
        }
      } finally {
        if (!ignore) {
          setIsLoadingSettings(false);
        }
      }
    };

    void loadSettings();

    return () => {
      ignore = true;
    };
  }, [t.settings.couldNotLoad]);

  const saveExportSettings = async () => {
    setIsSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const nextSettings = await appSettingsService.update({
        shoppingListExport: {
          provider: exportForm.provider,
          taskMode: exportForm.taskMode,
          vikunja: {
            baseUrl: exportForm.vikunjaBaseUrl,
            projectId: exportForm.vikunjaProjectId.trim().length > 0 ? Number(exportForm.vikunjaProjectId) : null,
            apiToken: exportForm.vikunjaApiToken.trim().length > 0 ? exportForm.vikunjaApiToken : null,
          },
        },
        externalIntegrations: {
          kassalapp: {
            baseUrl: exportForm.kassalappBaseUrl,
            apiKey: exportForm.kassalappApiKey.trim().length > 0 ? exportForm.kassalappApiKey : null,
          },
          helsedirektoratet: {
            baseUrl: exportForm.helsedirektoratetBaseUrl,
            subscriptionKey: exportForm.helsedirektoratetSubscriptionKey.trim().length > 0
              ? exportForm.helsedirektoratetSubscriptionKey
              : null,
          },
        },
      });

      setAppSettings(nextSettings);
      setExportForm((currentForm) => ({
        ...currentForm,
        helsedirektoratetBaseUrl: nextSettings.externalIntegrations.helsedirektoratet.baseUrl,
        helsedirektoratetSubscriptionKey: "",
        kassalappApiKey: "",
        kassalappBaseUrl: nextSettings.externalIntegrations.kassalapp.baseUrl,
        provider: nextSettings.shoppingListExport.provider,
        taskMode: nextSettings.shoppingListExport.taskMode,
        vikunjaBaseUrl: nextSettings.shoppingListExport.vikunja.baseUrl,
        vikunjaProjectId: nextSettings.shoppingListExport.vikunja.projectId?.toString() ?? "",
        vikunjaApiToken: "",
      }));
      setSettingsSuccess(t.settings.saved);
    } catch (error) {
      setSettingsError(getSettingsError(error, t.settings.couldNotSave));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const testExportConnection = async () => {
    setIsTestingConnection(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      await appSettingsService.testShoppingListExport({
        provider: exportForm.provider,
        taskMode: exportForm.taskMode,
        vikunja: {
          baseUrl: exportForm.vikunjaBaseUrl,
          projectId: exportForm.vikunjaProjectId.trim().length > 0 ? Number(exportForm.vikunjaProjectId) : null,
          apiToken: exportForm.vikunjaApiToken.trim().length > 0 ? exportForm.vikunjaApiToken : null,
        },
      });

      setSettingsSuccess(t.settings.testConnectionSucceeded);
    } catch (error) {
      setSettingsError(getSettingsError(error, t.settings.testConnectionFailed));
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadImageCleanupReport = async () => {
    setIsLoadingImageReport(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      setImageCleanupReport(await maintenanceService.getImageCleanupReport());
    } catch (error) {
      setSettingsError(getSettingsError(error, t.settings.couldNotCheckImages));
    } finally {
      setIsLoadingImageReport(false);
    }
  };

  const cleanupImages = async () => {
    setIsCleaningImages(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      setImageCleanupReport(await maintenanceService.cleanupImages());
      setSettingsSuccess(t.settings.imageCleanupFinished);
    } catch (error) {
      setSettingsError(getSettingsError(error, t.settings.couldNotCleanupImages));
    } finally {
      setIsCleaningImages(false);
    }
  };

  const importSeedCatalog = async (file: File) => {
    setIsImportingSeedCatalog(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      await maintenanceService.importSeedCatalog(file);
      setSettingsSuccess(t.settings.importSeedCatalogFinished);
    } catch (error) {
      setSettingsError(getSettingsError(error, t.settings.couldNotImportSeedCatalog));
    } finally {
      setIsImportingSeedCatalog(false);
    }
  };

  return (
    <main className={pageStyles.shell}>
      <section className={settingsStyles.shell}>
        <h1 className={settingsStyles.title(theme)}>{t.settings.pageTitle}</h1>
        <div className={settingsStyles.quickSettingsRow}>
          <LanguageSettingsPanel theme={theme} />
          {appSettings !== null && (
            <CurrentProviderSummary appSettings={appSettings} theme={theme} />
          )}
        </div>
        <ExportSettingsPanel
          appSettings={appSettings}
          exportForm={exportForm}
          isLoading={isLoadingSettings}
          isSaving={isSavingSettings}
          isTesting={isTestingConnection}
          settingsError={settingsError}
          settingsSuccess={settingsSuccess}
          theme={theme}
          onChange={setExportForm}
          onSave={() => void saveExportSettings()}
          onTestConnection={() => void testExportConnection()}
        />
        {appSettings !== null && (
          <SystemInfoPanel appSettings={appSettings} theme={theme} />
        )}
        <MaintenancePanel
          imageCleanupReport={imageCleanupReport}
          isCleaningImages={isCleaningImages}
          isImportingSeedCatalog={isImportingSeedCatalog}
          isLoadingImageReport={isLoadingImageReport}
          theme={theme}
          onCleanupImages={() => void cleanupImages()}
          onImportSeedCatalog={(file) => void importSeedCatalog(file)}
          onLoadImageReport={() => void loadImageCleanupReport()}
        />
      </section>
    </main>
  );
};

function getSettingsError(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return `${fallbackMessage} ${error.message}`;
  }

  return fallbackMessage;
}

export default SettingsPage;
