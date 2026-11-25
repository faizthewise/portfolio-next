import clsx from "clsx";
import { Check, ChevronUp, Layers } from "lucide-react";
import { useId, type RefObject } from "react";
import {
  PHOTO_FILM_PRESETS,
  resolvePhotoFilm,
  type PhotoFilm,
} from "@/lib/wedding/memoriesRender";
import styles from "./MemoryCameraFilm.module.css";

export function MemoryCameraFilm({
  film,
  open,
  disabled,
  onOpenChange,
  onSelect,
  triggerRef,
}: {
  film: PhotoFilm;
  open: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (film: PhotoFilm) => void;
  triggerRef: RefObject<HTMLButtonElement>;
}) {
  const panelId = useId();
  const activeFilm = resolvePhotoFilm(film);
  const activePreset = PHOTO_FILM_PRESETS.find(
    (preset) => preset.id === activeFilm
  );

  return (
    <div className={styles.picker}>
      <button
        ref={triggerRef}
        type="button"
        className={clsx(styles.trigger, activeFilm !== "none" && styles.active)}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        <Layers size={16} aria-hidden="true" />
        <span>
          Film look · <strong>{activePreset?.name}</strong>
        </span>
        <ChevronUp size={14} className={styles.chevron} aria-hidden="true" />
      </button>
      <div
        id={panelId}
        className={styles.panel}
        role="group"
        aria-label="Film looks"
        hidden={!open}
      >
        {PHOTO_FILM_PRESETS.map((preset) => {
          const descriptionId = `${panelId}-${preset.id}`;
          return (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              aria-pressed={preset.id === activeFilm}
              aria-labelledby={`${descriptionId}-name`}
              aria-describedby={descriptionId}
              disabled={disabled}
              onClick={() => {
                onSelect(preset.id);
                triggerRef.current?.focus();
              }}
            >
              <span>
                <span id={`${descriptionId}-name`} className={styles.name}>
                  {preset.name}
                </span>
                <span id={descriptionId} className={styles.description}>
                  {preset.description}
                </span>
              </span>
              {preset.id === activeFilm && (
                <Check size={18} className={styles.check} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
