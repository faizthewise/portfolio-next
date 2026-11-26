import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Memories.module.css";

function tabStops(dialog: HTMLElement) {
  const candidates = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      "button, a[href], input, textarea, select, [tabindex]"
    )
  ).filter(
    (node) =>
      node.tabIndex >= 0 &&
      !node.matches(":disabled") &&
      !node.closest("[hidden], [inert]") &&
      node.getClientRects().length > 0 &&
      getComputedStyle(node).visibility === "visible"
  );
  const radios = candidates.filter(
    (node): node is HTMLInputElement =>
      node instanceof HTMLInputElement && node.type === "radio" && !!node.name
  );

  const representative = (node: HTMLElement) => {
    if (
      !(node instanceof HTMLInputElement) ||
      node.type !== "radio" ||
      !node.name
    ) {
      return node;
    }
    const group = radios.filter(
      (radio) => radio.name === node.name && radio.form === node.form
    );
    return group.find((radio) => radio.checked) ?? group[0];
  };

  return {
    nodes: candidates.filter((node) => representative(node) === node),
    current:
      document.activeElement instanceof HTMLElement
        ? representative(document.activeElement)
        : undefined,
  };
}

export function MemoryGuestPanel({
  theme,
  title,
  backgroundRef,
  className,
  message,
  error,
  contribution,
  returnFocusRef,
  onClose,
  children,
}: {
  title: string;
  theme: "garden" | "songket";
  backgroundRef: React.RefObject<HTMLElement>;
  className?: string;
  message?: string;
  error?: string;
  contribution?: {
    backdrop: string;
    panel: string;
    describedBy?: string;
    header: (titleId: string) => React.ReactNode;
  };
  returnFocusRef?: React.RefObject<HTMLElement>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const tracksViewport = Boolean(contribution);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const returnFocus = returnFocusRef?.current;
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
      if (event.key !== "Tab" || !dialog.current) return;
      const { nodes, current } = tabStops(dialog.current);
      const index = nodes.findIndex((node) => node === current);
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
      const target = [returnFocus, previousFocus].find(
        (node) =>
          node?.isConnected &&
          background?.contains(node) &&
          !node.matches(":disabled") &&
          node.getClientRects().length > 0
      );
      (target ?? background)?.focus({ preventScroll: true });
    };
  }, [backgroundRef, returnFocusRef]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const layer = backdrop.current;
    if (!tracksViewport || !viewport || !layer) return;

    const syncViewport = () => {
      layer.style.setProperty(
        "--sheet-viewport-height",
        `${viewport.height}px`
      );
      layer.style.setProperty("--sheet-viewport-width", `${viewport.width}px`);
      layer.style.setProperty(
        "--sheet-viewport-top",
        `${viewport.offsetTop}px`
      );
      layer.style.setProperty(
        "--sheet-viewport-left",
        `${viewport.offsetLeft}px`
      );
    };
    syncViewport();
    viewport.addEventListener("resize", syncViewport);
    viewport.addEventListener("scroll", syncViewport);
    return () => {
      viewport.removeEventListener("resize", syncViewport);
      viewport.removeEventListener("scroll", syncViewport);
    };
  }, [tracksViewport]);

  useEffect(() => {
    dialog.current?.scrollTo(0, 0);
    dialog.current?.focus({ preventScroll: true });
  }, [title]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={backdrop}
      className={contribution?.backdrop ?? styles.guestPanelBackdrop}
      onMouseDown={onClose}
    >
      <section
        ref={dialog}
        className={`${contribution?.panel ?? styles.guestPanel} ${
          styles[`panel-${theme}`]
        } ${className ?? ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contribution?.describedBy}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {contribution ? (
          contribution.header(titleId)
        ) : (
          <>
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
          </>
        )}
        {contribution && children}
      </section>
    </div>,
    document.body
  );
}
