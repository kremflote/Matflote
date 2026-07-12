import { useEffect, useState } from "react";
import {
  ExportSettingsPanel,
  CurrentProviderSummary,
  LanguageSettingsPanel,
  SystemInfoPanel,
  type ExportSettingsForm,
} from "../components/settings/SettingsPanels";
import { useLanguage } from "../contexts";
import type { IAppSettings } from "../interfaces/IAppSettings";
import { ApiError, appSettingsService } from "../services";
import { pageStyles, settingsStyles, type SiteTheme } from "../styles/appStyles";

type SettingsPageProps = {
  theme: SiteTheme;
};

const SettingsPage = ({ theme }: SettingsPageProps) => {
  const { t } = useLanguage();
  const [appSettings, setAppSettings] = useState<IAppSettings | null>(null);
  const [exportForm, setExportForm] = useState<ExportSettingsForm>({
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
      });

      setAppSettings(nextSettings);
      setExportForm((currentForm) => ({
        ...currentForm,
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
