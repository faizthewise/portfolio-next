import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Memories.module.css";

export function MemoryGuestPanel({
  theme,
  title,
  message,
  error,
  onClose,
  children,
}: {
  title: string;
  theme: "garden" | "songket";
  message?: string;
  error?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
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
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
      if (!nodes.length) return;
      if (event.shiftKey && document.activeElement === nodes[0]) {
        event.preventDefault();
        nodes.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
        event.preventDefault();
        nodes[0].focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.guestPanelBackdrop} onMouseDown={onClose}>
      <section
        ref={dialog}
        className={`${styles.guestPanel} ${styles[`panel-${theme}`]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-panel-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.guestPanelHeader}>
          <h2 id="guest-panel-title">{title}</h2>
          <button
            type="button"
            className={styles.panelClose}
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            ×
          </button>
        </header>
        <div className={styles.guestPanelContent}>
          {message && <p role="status" className={styles.status}>{message}</p>}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}
