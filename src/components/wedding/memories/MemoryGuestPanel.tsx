import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Memories.module.css";

export function MemoryGuestPanel({
  theme,
  title,
  backgroundRef,
  className,
  message,
  error,
  onClose,
  children,
}: {
  title: string;
  theme: "garden" | "songket";
  backgroundRef: React.RefObject<HTMLElement>;
  className?: string;
  message?: string;
  error?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const background = backgroundRef.current;
    const previousInert = background?.inert;
    if (background) background.inert = true;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[data-overlay-layer="photo-lightbox"]'))
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:enabled, a[href], input:enabled, textarea:enabled, select:enabled, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter(
        (node) => node.tabIndex >= 0 && node.getClientRects().length > 0
      );
      const index = nodes.findIndex((node) => node === document.activeElement);
      if (
        index < 0 ||
        (event.shiftKey ? index === 0 : index === nodes.length - 1)
      ) {
        event.preventDefault();
        const next = event.shiftKey ? nodes.at(-1) : nodes[0];
        (next ?? dialog.current)?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (background) background.inert = previousInert ?? false;
      window.removeEventListener("keydown", onKeyDown);
      if (
        previousFocus?.isConnected &&
        background?.contains(previousFocus) &&
        !previousFocus.matches(":disabled")
      )
        previousFocus.focus({ preventScroll: true });
      else background?.focus({ preventScroll: true });
    };
  }, [backgroundRef]);

  useEffect(() => {
    dialog.current?.scrollTo(0, 0);
    dialog.current?.focus({ preventScroll: true });
  }, [title]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.guestPanelBackdrop} onMouseDown={onClose}>
      <section
        ref={dialog}
        className={`${styles.guestPanel} ${styles[`panel-${theme}`]} ${
          className ?? ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.guestPanelHeader}>
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className={styles.panelClose}
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.guestPanelContent}>
          {message && (
            <p role="status" className={styles.status}>
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}
