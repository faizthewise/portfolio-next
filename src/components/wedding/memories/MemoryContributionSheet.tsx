import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import weddingFonts from "@/styles/WeddingFonts.module.css";
import { MemoryGuestPanel } from "./MemoryGuestPanel";
import styles from "./MemoryContributionSheet.module.css";
import homeStyles from "./MemoryGuestHome.module.css";

type Confirmation = {
  title: string;
  description: string;
  keepLabel: string;
  confirmLabel: string;
  onKeep: () => void;
  onConfirm: () => void;
};

export function MemoryContributionSheet({
  theme,
  backgroundRef,
  returnFocusRef,
  title,
  eyebrow,
  description,
  icon,
  error,
  confirmation,
  onClose,
  children,
}: {
  theme: "garden" | "songket";
  backgroundRef: React.RefObject<HTMLElement>;
  returnFocusRef: React.RefObject<HTMLElement>;
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: React.ReactNode;
  error?: string;
  confirmation?: Confirmation;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const descriptionId = useId();
  const composerFocus = useRef<HTMLElement>();
  const keepButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const wasConfirming = useRef(false);
  const confirming = Boolean(confirmation);
  const visibleDescription = confirmation?.description ?? description;

  useEffect(() => {
    if (confirming) {
      keepButton.current?.focus();
    } else if (wasConfirming.current) {
      const target = composerFocus.current;
      const dialog = header.current?.closest<HTMLElement>('[role="dialog"]');
      if (
        target &&
        dialog?.contains(target) &&
        !target.matches(":disabled") &&
        target.getClientRects().length > 0
      ) {
        target.focus();
      } else {
        dialog?.focus({ preventScroll: true });
      }
    }
    wasConfirming.current = confirming;
  }, [confirming]);

  function captureComposerFocus(event: React.FocusEvent<HTMLElement>) {
    composerFocus.current = event.target;
  }

  return (
    <MemoryGuestPanel
      theme={theme}
      title={title}
      backgroundRef={backgroundRef}
      returnFocusRef={returnFocusRef}
      className={`${homeStyles.identityPanel} ${weddingFonts.memory}`}
      onClose={confirmation?.onKeep ?? onClose}
      contribution={{
        backdrop: styles.backdrop,
        panel: styles.sheet,
        describedBy: visibleDescription ? descriptionId : undefined,
        header: (titleId) => (
          <div ref={header} className={styles.header}>
            <span className={styles.handle} aria-hidden="true" />
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              onFocus={captureComposerFocus}
              hidden={confirming}
              aria-label={`Close ${title}`}
            >
              <X size={21} aria-hidden="true" />
            </button>
            {icon && !confirming && (
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
            )}
            {eyebrow && !confirming && (
              <p className={styles.eyebrow}>{eyebrow}</p>
            )}
            <h2 id={titleId}>{confirmation?.title ?? title}</h2>
            {visibleDescription && (
              <p id={descriptionId} className={styles.description}>
                {visibleDescription}
              </p>
            )}
          </div>
        ),
      }}
    >
      <div
        className={styles.content}
        onFocusCapture={captureComposerFocus}
        hidden={confirming}
      >
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {children}
      </div>
      {confirmation && (
        <div className={styles.content}>
          <ContributionActions>
            <button
              type="button"
              className={homeStyles.primaryAction}
              onClick={confirmation.onKeep}
              ref={keepButton}
            >
              {confirmation.keepLabel}
            </button>
            <ContributionSecondary onClick={confirmation.onConfirm}>
              {confirmation.confirmLabel}
            </ContributionSecondary>
          </ContributionActions>
        </div>
      )}
    </MemoryGuestPanel>
  );
}

export function ContributionActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.actions}>{children}</div>;
}

export function ContributionPrimary({
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={type}
      className={`${homeStyles.primaryAction} ${className ?? ""}`}
    />
  );
}

export function ContributionSecondary({
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={type}
      className={`${homeStyles.secondaryAction} ${className ?? ""}`}
    />
  );
}
