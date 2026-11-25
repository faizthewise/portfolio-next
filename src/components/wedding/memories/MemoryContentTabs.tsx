import type { LucideIcon } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./MemoryGallery.module.css";

type ContentTabsProps<T extends string> = {
  id: string;
  label: string;
  tabs: readonly { id: T; label: string; Icon?: LucideIcon; badge?: number }[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
  sticky?: boolean;
};

export function MemoryContentTabs<T extends string>({
  id,
  label,
  tabs,
  active,
  onChange,
  children,
  sticky = true,
}: ContentTabsProps<T>) {
  const [focusedTab, setFocusedTab] = useState<T | null>(null);
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const panelId = `${id}-content`;

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    const { length } = tabs;
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
        next = (index + length - 1) % length;
        break;
      case "ArrowRight":
        next = (index + 1) % length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = length - 1;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!event.repeat) onChange(tabs[index].id);
        return;
      default:
        return;
    }
    event.preventDefault();
    tabButtons.current[next]?.focus();
  }

  return (
    <>
      <div
        className={styles.tabBar}
        data-sticky={sticky || undefined}
        id={`${id}-tabs`}
        role="tablist"
        aria-label={label}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocusedTab(null);
        }}
      >
        {tabs.map(({ id: tabId, label: tabLabel, Icon, badge }, index) => (
          <button
            type="button"
            key={tabId}
            ref={(button) => {
              tabButtons.current[index] = button;
            }}
            id={`${id}-tab-${tabId}`}
            role="tab"
            aria-selected={active === tabId}
            aria-controls={panelId}
            tabIndex={(focusedTab ?? active) === tabId ? 0 : -1}
            className={styles.tab}
            onFocus={() => setFocusedTab(tabId)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            onClick={() => onChange(tabId)}
          >
            {Icon && <Icon size={16} strokeWidth={1.6} aria-hidden="true" />}
            {tabLabel}
            {badge !== undefined && badge > 0 && (
              <span className={styles.tabBadge}>{badge}</span>
            )}
          </button>
        ))}
      </div>
      <div
        className={styles.tabPanel}
        data-content={active}
        data-sticky={sticky || undefined}
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
      >
        {children}
      </div>
    </>
  );
}
