import { useEffect, useMemo, useState } from "react";
import { getApiAssetUrl } from "../../services/apiClient";
import type { SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type ImageCropPickerProps = {
  inputId: string;
  initialImageUrl?: string | null;
  theme: SiteTheme;
  onCroppedFileChange: (file: File | null) => void;
};

const cropOutputSize = 800;
const placeholderImageUrl = getApiAssetUrl("/images/placeholders/recipe-photo-placeholder.png");

function ImageCropPicker({ inputId, initialImageUrl = null, theme, onCroppedFileChange }: ImageCropPickerProps) {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [cropConfirmed, setCropConfirmed] = useState(false);
  const currentImageUrl = getApiAssetUrl(initialImageUrl);

  useEffect(() => {
    if (sourceFile === null) {
      setImageUrl(null);
      setPreviewUrl(null);
      onCroppedFileChange(null);
      return;
    }

    const objectUrl = URL.createObjectURL(sourceFile);
    setImageUrl(objectUrl);
    setPreviewUrl(null);
    onCroppedFileChange(null);

    return () => URL.revokeObjectURL(objectUrl);
  }, [sourceFile, onCroppedFileChange]);

  useEffect(() => {
    if (imageUrl === null || sourceFile === null) {
      return;
    }

    let isCurrent = true;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropOutputSize;
      canvas.height = cropOutputSize;

      const context = canvas.getContext("2d");
      if (context === null) {
        return;
      }

      const naturalSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceSize = naturalSize / zoom;
      const maxX = Math.max(0, image.naturalWidth - sourceSize);
      const maxY = Math.max(0, image.naturalHeight - sourceSize);
      const sourceX = clamp(maxX / 2 + (offsetX / 100) * (maxX / 2), 0, maxX);
      const sourceY = clamp(maxY / 2 + (offsetY / 100) * (maxY / 2), 0, maxY);

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        cropOutputSize,
        cropOutputSize,
      );

      const nextPreviewUrl = canvas.toDataURL("image/jpeg", 0.88);
      canvas.toBlob(
        (blob) => {
          if (!isCurrent || blob === null) {
            return;
          }

          setPreviewUrl(nextPreviewUrl);
          onCroppedFileChange(
            new File([blob], getCroppedFileName(sourceFile.name), { type: "image/jpeg" }),
          );
        },
        "image/jpeg",
        0.88,
      );
    };
    image.src = imageUrl;

    return () => {
      isCurrent = false;
    };
  }, [imageUrl, offsetX, offsetY, onCroppedFileChange, sourceFile, zoom]);

  const hasImage = useMemo(() => sourceFile !== null && previewUrl !== null, [previewUrl, sourceFile]);

  return (
    <div className={recipeBrowserStyles.imageCropper}>
      <input
        accept="image/jpeg,image/png,image/webp"
        className={recipeBrowserStyles.hiddenFileInput}
        id={inputId}
        type="file"
        onChange={(event) => {
          setSourceFile(event.target.files?.[0] ?? null);
          setZoom(1);
          setOffsetX(0);
          setOffsetY(0);
          setCropConfirmed(false);
        }}
      />

      <div className={recipeBrowserStyles.cropPreview(theme)}>
        {previewUrl ? (
          <img className={recipeBrowserStyles.cropImage} src={previewUrl} alt="Recipe image crop preview" />
        ) : currentImageUrl ? (
          <img
            className={recipeBrowserStyles.cropImage}
            src={currentImageUrl}
            alt="Current recipe"
          />
        ) : placeholderImageUrl ? (
          <img
            className={recipeBrowserStyles.cropImage}
            src={placeholderImageUrl}
            alt="Top-down recipe photo guide"
          />
        ) : (
          <div className={recipeBrowserStyles.cropFallback}>
            Image preview
          </div>
        )}
      </div>

      <label className={recipeBrowserStyles.imageUploadFloatingButton(theme)} htmlFor={inputId}>
        <ImageUploadIcon />
        Choose file
      </label>

      {hasImage && !cropConfirmed && (
        <div className={recipeBrowserStyles.cropControls}>
          <SliderField label="Zoom" max={3} min={1} step={0.05} value={zoom} onChange={setZoom} />
          <SliderField label="Horizontal crop" max={100} min={-100} step={1} value={offsetX} onChange={setOffsetX} />
          <SliderField label="Vertical crop" max={100} min={-100} step={1} value={offsetY} onChange={setOffsetY} />
          <button
            className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.cropConfirmButton}`}
            type="button"
            onClick={() => setCropConfirmed(true)}
          >
            Confirm image
          </button>
        </div>
      )}
    </div>
  );
}

function ImageUploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className={recipeBrowserStyles.imageUploadIcon}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m7 16 3.2-3.2a1.1 1.1 0 0 1 1.6 0L14 15l1.2-1.2a1.1 1.1 0 0 1 1.6 0L20 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M15 4v6m0-6 2 2m-2-2-2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

type SliderFieldProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function SliderField({ label, min, max, step, value, onChange }: SliderFieldProps) {
  return (
    <label className={recipeBrowserStyles.sliderField}>
      <span>{label}</span>
      <input
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function getCroppedFileName(fileName: string) {
  const fileNameWithoutExtension = fileName.replace(/\.[^.]+$/, "");
  return `${fileNameWithoutExtension || "recipe"}-square.jpg`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default ImageCropPicker;
