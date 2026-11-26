// The household's own unit conversions ("1 yellow onion is 170 g"), opened from the recipe form.

import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts";
import type { IConversionRule } from "../../interfaces/IConversionRule";
import { conversionRuleService } from "../../services";
import Modal from "../Modal";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type ConversionHelperDialogProps = {
  onClose: () => void;
};

function ConversionHelperDialog({ onClose }: ConversionHelperDialogProps) {
  const { language, t } = useLanguage();
  const [rules, setRules] = useState<IConversionRule[]>([]);
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  const loadErrorMessage = t.cookbook.couldNotLoadConversionRules;

  useEffect(() => {
    let ignore = false;

    conversionRuleService
      .getAll()
      .then((loadedRules) => {
        if (!ignore) {
          setRules(loadedRules);
        }
      })
      .catch(() => {
        if (!ignore) {
          setRulesError(loadErrorMessage);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingRules(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [loadErrorMessage]);

  async function createRule() {
    const normalizedFromText = fromText.trim();
    const normalizedToText = toText.trim();
    if (normalizedFromText.length === 0 || normalizedToText.length === 0) {
      setRulesError(t.cookbook.conversionRuleNeedsValues);
      return;
    }

    setIsSavingRule(true);
    setRulesError(null);
    try {
      const createdRule = await conversionRuleService.create({
        fromText: normalizedFromText,
        toText: normalizedToText,
      });
      setRules((currentRules) => [
        ...currentRules.filter((rule) => rule.conversionRuleId !== createdRule.conversionRuleId),
        createdRule,
      ].sort((left, right) => left.sortOrder - right.sortOrder || left.fromText.localeCompare(right.fromText)));
      setFromText("");
      setToText("");
    } catch {
      setRulesError(t.cookbook.couldNotSaveConversionRule);
    } finally {
      setIsSavingRule(false);
    }
  }

  async function deleteRule(ruleId: number) {
    setRulesError(null);
    try {
      await conversionRuleService.delete(ruleId);
      setRules((currentRules) => currentRules.filter((rule) => rule.conversionRuleId !== ruleId));
    } catch {
      setRulesError(t.cookbook.couldNotDeleteConversionRule);
    }
  }

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned()}
      closeLabel={t.common.close}
      footer={
        <button className={`${recipeBrowserStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onClose}>
          {t.common.close}
        </button>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel}
      title={t.cookbook.conversionHelper}
      titleClassName={recipeBrowserStyles.modalTitle}
      onClose={onClose}
    >
      <p className={recipeBrowserStyles.conversionHelperIntro}>
        {t.cookbook.conversionHelperIntro}
      </p>
      <p className={recipeBrowserStyles.conversionHelperSource}>
        {t.cookbook.conversionHelperSourceText}{" "}
        <a
          className={recipeBrowserStyles.conversionHelperSourceLink}
          href="https://www.matprat.no/artikler/mengde-mal-og-vekt/mal-og-vekt/"
          rel="noreferrer"
          target="_blank"
        >
          {t.cookbook.conversionHelperSourceLink}
        </a>
        .
      </p>
      <section className={recipeBrowserStyles.conversionSection}>
        <h3 className={recipeBrowserStyles.conversionSectionTitle}>{t.cookbook.conversions}</h3>
        {rulesError !== null && <p className={recipeBrowserStyles.statusError}>{rulesError}</p>}
        {isLoadingRules ? (
          <p className={recipeBrowserStyles.conversionHelperSource}>{t.common.working}</p>
        ) : (
          <div className={recipeBrowserStyles.conversionList}>
            {rules.map((rule) => {
              const localizedFromText = language === "nb" ? rule.fromTextNb ?? rule.fromText : rule.fromText;
              const localizedToText = language === "nb" ? rule.toTextNb ?? rule.toText : rule.toText;

              return (
                <div className={recipeBrowserStyles.conversionRow} key={rule.conversionRuleId}>
                  <span className={recipeBrowserStyles.conversionSource}>{localizedFromText}</span>
                  <span className={recipeBrowserStyles.conversionArrow}>=</span>
                  <span className={recipeBrowserStyles.conversionTarget}>{localizedToText}</span>
                  <button
                    className={recipeBrowserStyles.inlineTextButton}
                    type="button"
                    onClick={() => void deleteRule(rule.conversionRuleId)}
                  >
                    {t.common.remove}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className={recipeBrowserStyles.conversionSection}>
        <h3 className={recipeBrowserStyles.conversionSectionTitle}>{t.cookbook.addConversionRule}</h3>
        <div className={recipeBrowserStyles.conversionRuleForm}>
          <label className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label}>{t.cookbook.conversionFrom}</span>
            <input
              className={recipeBrowserStyles.textField}
              maxLength={120}
              placeholder={t.cookbook.conversionFromPlaceholder}
              value={fromText}
              onChange={(event) => setFromText(event.target.value)}
            />
          </label>
          <label className={recipeBrowserStyles.field}>
            <span className={recipeBrowserStyles.label}>{t.cookbook.conversionTo}</span>
            <input
              className={recipeBrowserStyles.textField}
              maxLength={120}
              placeholder={t.cookbook.conversionToPlaceholder}
              value={toText}
              onChange={(event) => setToText(event.target.value)}
            />
          </label>
          <button
            className={`${recipeBrowserStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`}
            disabled={isSavingRule}
            type="button"
            onClick={() => void createRule()}
          >
            {isSavingRule ? t.common.saving : t.common.add}
          </button>
        </div>
      </section>
    </Modal>
  );
}

export default ConversionHelperDialog;
