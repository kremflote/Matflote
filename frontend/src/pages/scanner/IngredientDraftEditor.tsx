// The scanner's editor for one ingredient draft: name, brand, photo, tags and nutrition, with where each came from.

import { useEffect, useId, useState } from "react";
import Modal from "../../components/Modal";
import CreatableSelect from "../../components/recipeBrowser/CreatableSelect";
import { useBrands, useIngredientTagCategories, useIngredients, useLanguage } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import { brandService } from "../../services";
import { getApiAssetUrl } from "../../services/apiClient";
import { scannerStyles } from "../../styles/appStyles";
import { INGREDIENT_NAME_MAX_LENGTH } from "../../constants/validation";
import { getAllCategoryTagNames, getIngredientVisibleTagCategories } from "../../utils/tagCatalog";
import {
  formatIngredientTagCategoryName,
  getIngredientTagGroupsWithCustomTags,
} from "../../components/recipeBrowser/formOptions";
import { GroupedCheckboxPanel } from "../../components/recipeBrowser/BrowserFilterGroups";
import { recipeBrowserStyles } from "../../components/recipeBrowser/recipeBrowserStyles";
import IngredientTagCreateDialog from "../../components/recipeBrowser/IngredientTagCreateDialog";
import MatvaretabellenSearchDialog, {
  MatvaretabellenCandidateList,
} from "../../components/recipeBrowser/MatvaretabellenSearchDialog";
import NutritionEditor from "../../components/recipeBrowser/NutritionEditor";
import { toggleValue } from "../../utils/formValues";
import { tagManagementHandlers } from "../../components/recipeBrowser/tagManagementHandlers";
import {
  type IngredientDraft,
  type MatvaretabellenCandidate,
  updateNutritionDraft,
  clearNutritionAutofillSource,
  applyMatvaretabellenCandidate,
  removeMatvaretabellenSupplement,
  clearAutofillSource,
  getAutofillSourceLabel,
  getNutritionFieldSubtitles,
  getNutritionSource,
  type NutritionSourceLink,
  nutritionToEditorValues,
} from "./scannerDraft";

export function IngredientDraftEditor({
  draft,
  onChange,
}: {
  draft: IngredientDraft;
  onChange: (draft: IngredientDraft) => void;
}) {
  const { t } = useLanguage();
  const { brands, refreshBrands } = useBrands();
  const { ingredients, refreshIngredients } = useIngredients();
  const { ingredientTagCategories, refreshIngredientTagCategories } = useIngredientTagCategories();
  const imageInputId = useId();
  // The chosen photo and its object URL; shown only while it is still the draft's file.
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const imagePreviewUrl = imagePreview !== null && imagePreview.file === draft.imageFile ? imagePreview.url : null;
  const [isTagCreateOpen, setIsTagCreateOpen] = useState(false);
  const [isMatvarePickerOpen, setIsMatvarePickerOpen] = useState(false);
  const [isMatvareSearchOpen, setIsMatvareSearchOpen] = useState(false);
  const [isAutofillInfoOpen, setIsAutofillInfoOpen] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const imageUrl = getApiAssetUrl(imagePreviewUrl ?? draft.imageUrl);
  const ingredientVisibleTagCategories = getIngredientVisibleTagCategories(ingredientTagCategories);
  const knownIngredientTags = getAllCategoryTagNames(ingredientTagCategories) as IngredientTag[];
  const existingCustomTags = ingredients
    .flatMap((ingredient) => ingredient.tags)
    .filter((tag) => !knownIngredientTags.includes(tag));
  const customTags = Array.from(new Set([
    ...existingCustomTags,
    ...draft.tags.filter((tag) => !knownIngredientTags.includes(tag)),
  ]));
  const groupedTags = getIngredientTagGroupsWithCustomTags(customTags, "pantry", ingredientVisibleTagCategories);
  const groupLabels = Object.fromEntries(
    ingredientVisibleTagCategories.map((category) => [
      category.ingredientTagCategoryId.toString(),
      formatIngredientTagCategoryName(category.name, t.filters.ingredientTagGroups),
    ]),
  );
  const nutritionValues = nutritionToEditorValues(draft.nutritionPer100);
  const nutritionSource = getNutritionSource(
    draft,
    t.scanner.nutritionSources,
  );
  const nutritionFieldSubtitles = getNutritionFieldSubtitles(draft, t.scanner.autofilledBy);
  const hasMatvaretabellenSupplement = draft.matvaretabellenNutritionPer100 !== null;
  const showMatvaretabellenFailedMessage = draft.matvaretabellenSupplementAttempted
    && draft.matvaretabellenSupplementStatus === "NoMatch"
    && !hasMatvaretabellenSupplement;

  useEffect(() => (imagePreview === null ? undefined : () => URL.revokeObjectURL(imagePreview.url)), [imagePreview]);

  return (
    <section className={scannerStyles.ingredientEditor}>
      <div className={scannerStyles.editorImageRow}>
        <input
          accept="image/jpeg,image/png,image/webp"
          className={scannerStyles.hiddenFileInput}
          id={imageInputId}
          type="file"
          onChange={(event) => {
            const imageFile = event.target.files?.[0] ?? null;
            setImagePreview(imageFile === null ? null : { file: imageFile, url: URL.createObjectURL(imageFile) });
            onChange(clearAutofillSource({ ...draft, imageFile }, "image"));
          }}
        />
        <FieldLabel
          className={scannerStyles.editorImageLabel}
          label={t.scanner.productImageLabel}
        />
        <div className={scannerStyles.editorImageFrame}>
          {imageUrl === null ? (
            <div className={scannerStyles.productImageFallback}>{t.scanner.noImage}</div>
          ) : (
            <img className={scannerStyles.productImage} src={imageUrl} alt="" />
          )}
        </div>
        <label className={scannerStyles.editorImageButton} htmlFor={imageInputId}>
          {t.scanner.chooseImage}
        </label>
        <span className={`${scannerStyles.autofillReservedHint} col-span-2`}>
          {getAutofillSourceLabel(draft, "image", t.scanner.autofilledBy) ?? "\u00A0"}
        </span>
      </div>

      <div className={scannerStyles.compactFormGrid}>
        <label className={scannerStyles.field}>
          <FieldLabel
            hint={`${draft.name.length}/${INGREDIENT_NAME_MAX_LENGTH}`}
            label={t.scanner.nameLabel}
          />
          <input
            className={scannerStyles.input}
            value={draft.name}
            onChange={(event) => onChange(clearAutofillSource({ ...draft, name: event.target.value }, "name"))}
          />
          <span className={scannerStyles.autofillReservedHint}>
            {getAutofillSourceLabel(draft, "name", t.scanner.autofilledBy) ?? "\u00A0"}
          </span>
        </label>
        <CreatableSelect
          createLabel={t.common.createNew}
          fieldClassName={scannerStyles.field}
          label={(
            <FieldLabel
              label={t.scanner.brandLabel}
            />
          )}
          helperClassName={scannerStyles.autofillReservedHint}
          helperText={getAutofillSourceLabel(draft, "brand", t.scanner.autofilledBy)}
          labelClassName={scannerStyles.label}
          options={brands.map((brand) => ({ id: brand.brandId, name: brand.name }))}
          placeholder={t.cookbook.selectBrand}
          value={draft.brandId}
          onChange={(brandId) => {
            const brandName = brands.find((brand) => brand.brandId === brandId)?.name ?? "";
            onChange(clearAutofillSource({ ...draft, brandId, brandName }, "brand"));
          }}
          onCreate={async (name) => {
            const brand = await brandService.create({ name });
            await refreshBrands();
            return { id: brand.brandId, name: brand.name };
          }}
          onCreatedOptionSelected={(brand) => onChange(clearAutofillSource({ ...draft, brandId: brand.id, brandName: brand.name }, "brand"))}
        />
      </div>

      <section className={scannerStyles.field}>
        <span className={scannerStyles.label}>{t.cookbook.nutrition}</span>
        <div className={scannerStyles.nutritionSourceRow}>
          {nutritionSource.primary === null ? (
            <span className={scannerStyles.nutritionSourcePrimaryLine}>
              <span className={scannerStyles.nutritionSourceText}>{nutritionSource.text}</span>
              <button
                className={scannerStyles.sourceActionButton}
                type="button"
                onClick={() => setIsMatvareSearchOpen(true)}
              >
                {t.scanner.searchAndFillMatvaretabellen}
              </button>
            </span>
          ) : (
            <div className={scannerStyles.nutritionSourceText}>
              <span className={scannerStyles.nutritionSourcePrimaryLine}>
                <span className={scannerStyles.nutritionSourceLine}>
                  <span>{t.scanner.nutritionFromPrefix}</span>
                  <NutritionSourceAnchor source={nutritionSource.primary} />
                </span>
                <span className={scannerStyles.nutritionSourceActions}>
                  <button
                    className={scannerStyles.sourceActionButton}
                    type="button"
                    onClick={() => setIsMatvareSearchOpen(true)}
                  >
                    {t.scanner.searchAndFillMatvaretabellen}
                  </button>
                  {nutritionSource.supplement === null ? (
                    <NutritionSourceActions
                      hasMatvaretabellenSupplement={hasMatvaretabellenSupplement}
                      hasMatvaretabellenCandidates={draft.matvaretabellenCandidates.length > 0}
                      onChangeMatvaretabellen={() => setIsMatvarePickerOpen(true)}
                      onInfo={() => setIsAutofillInfoOpen(true)}
                      onRemoveMatvaretabellen={() => onChange(removeMatvaretabellenSupplement(draft))}
                    />
                  ) : null}
                </span>
              </span>
              {nutritionSource.supplement !== null ? (
                <span className={scannerStyles.nutritionSourceSupplementLine}>
                  <span className={scannerStyles.nutritionSourceLine}>
                    <span>{t.scanner.nutritionSupplementedByPrefix}</span>
                    <NutritionSourceAnchor source={nutritionSource.supplement} />
                  </span>
                  <NutritionSourceActions
                    hasMatvaretabellenSupplement={hasMatvaretabellenSupplement}
                    hasMatvaretabellenCandidates={draft.matvaretabellenCandidates.length > 0}
                    onChangeMatvaretabellen={() => setIsMatvarePickerOpen(true)}
                    onInfo={() => setIsAutofillInfoOpen(true)}
                    onRemoveMatvaretabellen={() => onChange(removeMatvaretabellenSupplement(draft))}
                  />
                </span>
              ) : null}
            </div>
          )}
        </div>
        {showMatvaretabellenFailedMessage && (
          <div className={scannerStyles.nutritionSupplementWarningRow}>
            <span>
              {draft.matvaretabellenCandidates.length > 0
                ? t.scanner.matvaretabellenNoMatchFound
                : t.scanner.matvaretabellenSupplementFailed}
            </span>
            {draft.matvaretabellenCandidates.length > 0 && (
              <button
                className={scannerStyles.sourceActionButton}
                type="button"
                onClick={() => setIsMatvarePickerOpen(true)}
              >
                {t.scanner.chooseMatvaretabellenSuggested}
              </button>
            )}
          </div>
        )}
        <button
          aria-expanded={showNutrition}
          className={recipeBrowserStyles.detailsToggleFull}
          type="button"
          onClick={() => setShowNutrition((currentValue) => !currentValue)}
        >
          {showNutrition ? t.cookbook.hideNutrition : t.cookbook.addNutrition}
        </button>
        {showNutrition && (
          <NutritionEditor
            fieldSubtitleClassName={scannerStyles.autofillReservedHint}
            fieldSubtitles={nutritionFieldSubtitles}
            values={nutritionValues}
            onChange={(key, value) => onChange(clearNutritionAutofillSource(updateNutritionDraft(draft, key, value), key))}
          />
        )}
      </section>

      <section className={scannerStyles.field}>
          <FieldLabel
            label={t.scanner.selectTags}
          />
        <GroupedCheckboxPanel
          addActionLabel={t.common.manageTags}
          formatValue={(value) => t.enums.ingredientTags[value] ?? value}
          groupLabels={groupLabels}
          groups={groupedTags}
          panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel}`}
          selectedValues={draft.tags}
          onAddTag={() => setIsTagCreateOpen(true)}
          onToggle={(tag) => onChange(clearAutofillSource({ ...draft, tags: toggleValue(draft.tags, tag) }, "tags"))}
        />
        <span className={scannerStyles.autofillReservedHint}>
          {getAutofillSourceLabel(draft, "tags", t.scanner.autofilledBy) ?? "\u00A0"}
        </span>
      </section>
      {isTagCreateOpen && (
        <IngredientTagCreateDialog
          categories={ingredientTagCategories}
          existingTags={[...knownIngredientTags, ...customTags]}
          initialMode="ingredients"
          onCancel={() => setIsTagCreateOpen(false)}
          {...tagManagementHandlers({
            refreshCategories: refreshIngredientTagCategories,
            refreshTagUsers: refreshIngredients,
            onTagCreated: (tag) => {
              onChange(clearAutofillSource({ ...draft, tags: draft.tags.includes(tag) ? draft.tags : [...draft.tags, tag] }, "tags"));
              setIsTagCreateOpen(false);
            },
          })}
        />
      )}
      {isMatvarePickerOpen && (
        <MatvaretabellenCandidateModal
          candidates={draft.matvaretabellenCandidates}
          onCancel={() => setIsMatvarePickerOpen(false)}
          onSelect={(candidate) => {
            onChange(applyMatvaretabellenCandidate(draft, candidate));
            setIsMatvarePickerOpen(false);
          }}
        />
      )}
      {isMatvareSearchOpen && (
        <MatvaretabellenSearchDialog
          initialQuery={draft.name}
          onCancel={() => setIsMatvareSearchOpen(false)}
          onSelect={(candidate, candidates) => {
            onChange(applyMatvaretabellenCandidate({
              ...draft,
              matvaretabellenCandidates: candidates,
            }, candidate));
            setIsMatvareSearchOpen(false);
          }}
        />
      )}
      {isAutofillInfoOpen && (
        <ScannerAutofillInfoModal
          onClose={() => setIsAutofillInfoOpen(false)}
        />
      )}
    </section>
  );
}

export function FieldLabel({
  className,
  hint,
  label,
}: {
  className?: string;
  hint?: string;
  label: string;
}) {
  return (
    <span className={`${scannerStyles.labelRow} ${className ?? ""}`.trim()}>
      <span className={scannerStyles.label}>{label}</span>
      {hint !== undefined && (
        <span className={recipeBrowserStyles.inlineHint}>{hint}</span>
      )}
    </span>
  );
}

export function NutritionSourceAnchor({
  source,
}: {
  source: NutritionSourceLink;
}) {
  if (source.url === null) {
    return <span>{source.label}</span>;
  }

  return (
    <a
      className={scannerStyles.nutritionSourceLink}
      href={source.url}
      rel="noreferrer"
      target="_blank"
    >
      {source.label}
    </a>
  );
}

export function NutritionSourceActions({
  hasMatvaretabellenCandidates,
  hasMatvaretabellenSupplement,
  onChangeMatvaretabellen,
  onInfo,
  onRemoveMatvaretabellen,
}: {
  hasMatvaretabellenCandidates: boolean;
  hasMatvaretabellenSupplement: boolean;
  onChangeMatvaretabellen: () => void;
  onInfo: () => void;
  onRemoveMatvaretabellen: () => void;
}) {
  const { t } = useLanguage();

  return (
    <span className={scannerStyles.nutritionSourceActions}>
      {hasMatvaretabellenSupplement && hasMatvaretabellenCandidates && (
        <button
          className={scannerStyles.sourceActionButton}
          type="button"
          onClick={onChangeMatvaretabellen}
        >
          {t.scanner.changeMatvaretabellen}
        </button>
      )}
      {hasMatvaretabellenSupplement && (
        <button
          className={scannerStyles.sourceActionButton}
          type="button"
          onClick={onRemoveMatvaretabellen}
        >
          {t.common.remove}
        </button>
      )}
      <button
        className={scannerStyles.sourceActionButton}
        type="button"
        onClick={onInfo}
      >
        {t.scanner.autofillInfoButton}
      </button>
    </span>
  );
}

export function ScannerAutofillInfoModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Modal
      backdropClassName={scannerStyles.editorModalBackdrop}
      bodyClassName={scannerStyles.infoModalBody}
      closeButtonClassName={scannerStyles.editorModalCloseButton}
      closeLabel={t.common.close}
      footer={(
        <button
          className={scannerStyles.saveButton}
          type="button"
          onClick={onClose}
        >
          {t.common.close}
        </button>
      )}
      footerClassName={scannerStyles.editorModalFooter}
      headerClassName={scannerStyles.editorModalHeader}
      panelClassName={scannerStyles.infoModalPanel}
      title={t.scanner.autofillInfoTitle}
      titleClassName={scannerStyles.editorModalTitle}
      onClose={onClose}
    >
      <p className={scannerStyles.infoText}>{t.scanner.autofillInfoIntro}</p>
      <ul className={scannerStyles.infoList}>
        {t.scanner.autofillInfoSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
    </Modal>
  );
}

export function MatvaretabellenCandidateModal({
  candidates,
  onCancel,
  onSelect,
}: {
  candidates: MatvaretabellenCandidate[];
  onCancel: () => void;
  onSelect: (candidate: MatvaretabellenCandidate) => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();

  return (
    <Modal
      backdropClassName={scannerStyles.editorModalBackdrop}
      bodyClassName={scannerStyles.matvareCandidateModalBody}
      closeButtonClassName={scannerStyles.editorModalCloseButton}
      closeLabel={t.common.close}
      footer={(
        <button className={scannerStyles.manualEntryButton} type="button" onClick={onCancel}>
          {t.common.cancel}
        </button>
      )}
      footerClassName={scannerStyles.editorModalFooter}
      headerClassName={scannerStyles.editorModalHeader}
      panelClassName={scannerStyles.matvareCandidateModalPanel}
      title={t.scanner.chooseMatvaretabellenEntry}
      titleClassName={scannerStyles.editorModalTitle}
      titleId={titleId}
      onClose={onCancel}
    >
      <MatvaretabellenCandidateList
        candidates={candidates}
        onSelect={onSelect}
      />
    </Modal>
  );
}
