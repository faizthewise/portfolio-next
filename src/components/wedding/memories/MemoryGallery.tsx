import { Camera, Images, Mic, PenLine, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { MemoryGuestPanel } from "./MemoryGuestPanel";
import homeStyles from "./MemoryGuestHome.module.css";
import styles from "./MemoryGallery.module.css";

export type GalleryTab = "photos" | "wishes" | "voice-notes";
export type GalleryScope = "all" | "my" | "favorites";
export type GalleryFilters = { scope: GalleryScope; guest: string | null };
export type GalleryStatus = "loading" | "ready" | "error";

type GalleryOverlayProps = {
  theme: "garden" | "songket";
  backgroundRef: React.RefObject<HTMLElement>;
};

const contentTabs = [
  { id: "photos", label: "Photos", Icon: Images },
  { id: "wishes", label: "Wishes", Icon: PenLine },
  { id: "voice-notes", label: "Voice notes", Icon: Mic },
] as const;

const photoScopes = [
  { value: "all", label: "All photos" },
  { value: "my", label: "My photos" },
  { value: "favorites", label: "Favourites" },
] as const;

const defaultFilters: GalleryFilters = { scope: "all", guest: null };
const tabPanelId = "memory-gallery-content";

export function MemoryGallery({
  coupleNames,
  hashtag,
  cover,
  welcome,
  tab,
  onTabChange,
  children,
}: GalleryOverlayProps & {
  coupleNames: string;
  hashtag: string;
  cover?: string;
  welcome?: string;
  tab: GalleryTab;
  onTabChange: (tab: GalleryTab) => void;
  children: React.ReactNode;
}) {
  const [focusedTab, setFocusedTab] = useState<GalleryTab | null>(null);
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const customWelcome = welcome?.trim();

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    const { length } = contentTabs;
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
        if (!event.repeat) onTabChange(contentTabs[index].id);
        return;
      default:
        return;
    }
    event.preventDefault();
    tabButtons.current[next]?.focus();
  }

  return (
    <>
      <header className={styles.header}>
        {cover && (
          <Image
            key={cover}
            className={styles.cover}
            src={cover}
            alt=""
            width={136}
            height={136}
            unoptimized
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
        <p className={homeStyles.eyebrow}>{hashtag}</p>
        <p className={styles.coupleNames}>{coupleNames}</p>
        <h1 className={styles.title}>Our day, together</h1>
        <p className={styles.description}>
          Memories through everyone&apos;s eyes.
        </p>
        {customWelcome &&
          customWelcome !== "Share the moments you captured with us." && (
            <p className={styles.welcome}>{customWelcome}</p>
          )}
      </header>
      <div
        className={styles.tabBar}
        id="memory-gallery-tabs"
        role="tablist"
        aria-label="Gallery content"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocusedTab(null);
        }}
      >
        {contentTabs.map(({ id, label, Icon }, index) => (
          <button
            type="button"
            key={id}
            ref={(button) => {
              tabButtons.current[index] = button;
            }}
            id={`memory-gallery-tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={tabPanelId}
            tabIndex={(focusedTab ?? tab) === id ? 0 : -1}
            className={styles.tab}
            onFocus={() => setFocusedTab(id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            onClick={() => onTabChange(id)}
          >
            <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div
        className={styles.tabPanel}
        data-content={tab}
        id={tabPanelId}
        role="tabpanel"
        aria-labelledby={`memory-gallery-tab-${tab}`}
        tabIndex={0}
      >
        {children}
      </div>
      <footer className={styles.visibility}>
        Photos, wishes and shared voice notes are available to anyone with the
        album link.
      </footer>
    </>
  );
}

export function MemoryGalleryPhotos({
  filters,
  onFiltersChange,
  guests,
  count,
  status,
  hasMore,
  loadingMore,
  loadMoreFailed,
  favoriteError,
  theme,
  backgroundRef,
  fontClassName,
  onRetry,
  onLoadMore,
  onContribute,
  children,
}: GalleryOverlayProps & {
  filters: GalleryFilters;
  onFiltersChange: (next: GalleryFilters) => void;
  guests: string[];
  count: number;
  status: GalleryStatus;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreFailed?: boolean;
  favoriteError?: boolean;
  fontClassName?: string;
  onRetry: () => void;
  onLoadMore: () => void;
  onContribute: () => void;
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<GalleryFilters | null>(null);
  const filterButton = useRef<HTMLButtonElement>(null);

  const activeFilters =
    Number(filters.scope !== "all") + Number(filters.guest !== null);
  const scope = photoScopes.find(
    (option) => option.value === filters.scope
  )?.label;
  const draftGuest = draft?.guest;
  const guestOptions =
    draftGuest != null && !guests.includes(draftGuest)
      ? [draftGuest, ...guests]
      : guests;

  function clearFilters() {
    onFiltersChange(defaultFilters);
    filterButton.current?.focus({ preventScroll: true });
  }

  let emptyState = {
    title: "Every memory starts somewhere.",
    description: "Be the first to share a little moment from today.",
    label: "Take a photo",
    action: onContribute,
  };

  if (filters.scope === "favorites" && filters.guest === null) {
    emptyState = {
      title: "Keep your favourite moments close.",
      description: "Tap the heart on any photograph to find it here later.",
      label: "Explore photos",
      action: clearFilters,
    };
  } else if (activeFilters) {
    emptyState = {
      title: "No photos found",
      description: "Try changing your filters to discover more memories.",
      label: "Clear filters",
      action: clearFilters,
    };
  }

  return (
    <section className={styles.photos}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarSummary}>
          <h2>{scope}</h2>
          <p role="status">
            {status === "ready" && (
              <>
                {count} {count === 1 ? "photo" : "photos"}
                {hasMore && " loaded"}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          ref={filterButton}
          className={styles.filterButton}
          aria-haspopup="dialog"
          aria-expanded={draft !== null}
          onClick={() => setDraft(filters)}
        >
          <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
          {activeFilters ? `Filters (${activeFilters})` : "Filters"}
        </button>
      </div>
      {activeFilters > 0 && (
        <div className={styles.activeFilters}>
          <p>
            {filters.guest === null
              ? "Filters applied"
              : `Shared by ${filters.guest}`}
          </p>
          {(status !== "ready" || count > 0 || hasMore) && (
            <button
              type="button"
              className={homeStyles.textAction}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {status === "loading" && (
        <>
          <p className={styles.visuallyHidden} role="status">
            Loading photos…
          </p>
          <div className={styles.grid} aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div className={styles.skeleton} key={index} />
            ))}
          </div>
        </>
      )}
      {status === "error" && (
        <div className={styles.state}>
          <div role="alert">
            <h3>Unable to load photos</h3>
            <p>Please try again.</p>
          </div>
          <button
            type="button"
            className={homeStyles.textAction}
            onClick={onRetry}
          >
            Try again
          </button>
        </div>
      )}
      {status === "ready" && (
        <>
          {favoriteError && (
            <p className={styles.feedback} role="alert">
              Favourites could not be updated. Please try again.
            </p>
          )}
          {count > 0 ? (
            <div className={styles.grid}>{children}</div>
          ) : hasMore ? (
            <p className={styles.feedback} role="status">
              No matches so far. Load more photos to keep looking.
            </p>
          ) : (
            <div className={styles.state}>
              <h3>{emptyState.title}</h3>
              <p>{emptyState.description}</p>
              <button
                type="button"
                className={homeStyles.textAction}
                onClick={emptyState.action}
              >
                {activeFilters === 0 && <Camera size={17} aria-hidden="true" />}
                {emptyState.label}
              </button>
            </div>
          )}
          {hasMore && (
            <div className={styles.pagination}>
              {loadMoreFailed && (
                <p className={styles.feedback} role="alert">
                  Unable to load more photos. Please try again.
                </p>
              )}
              <button
                type="button"
                aria-disabled={loadingMore}
                className={`${homeStyles.secondaryAction} ${styles.loadMore}`}
                onClick={() => {
                  if (!loadingMore) onLoadMore();
                }}
              >
                {loadingMore
                  ? "Loading photos…"
                  : loadMoreFailed
                  ? "Try loading more photos"
                  : "Load more photos"}
              </button>
              {loadingMore && (
                <span className={styles.visuallyHidden} role="status">
                  Loading more photos…
                </span>
              )}
            </div>
          )}
          {(count > 0 || hasMore || activeFilters > 0) && (
            <div className={styles.contribution}>
              <button
                type="button"
                className={homeStyles.textAction}
                onClick={onContribute}
              >
                <Camera size={17} strokeWidth={1.7} aria-hidden="true" />
                Add your own moment
              </button>
            </div>
          )}
        </>
      )}
      {draft && (
        <MemoryGuestPanel
          title="Filter photos"
          theme={theme}
          backgroundRef={backgroundRef}
          className={`${homeStyles.identityPanel} ${styles.filterSheet} ${
            fontClassName ?? ""
          }`}
          onClose={() => setDraft(null)}
        >
          <form
            className={styles.filterForm}
            onSubmit={(event) => {
              event.preventDefault();
              onFiltersChange(draft);
              setDraft(null);
            }}
          >
            <fieldset className={styles.scopeOptions}>
              <legend>Photo scope</legend>
              {photoScopes.map(({ value, label }) => (
                <label key={value} className={styles.scopeOption}>
                  <input
                    type="radio"
                    name="gallery-photo-scope"
                    checked={draft.scope === value}
                    onChange={() => setDraft({ ...draft, scope: value })}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className={styles.guestSelect}>
              Shared by
              <select
                value={draft.guest === null ? "" : `guest:${draft.guest}`}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    guest: event.target.value
                      ? event.target.value.slice(6)
                      : null,
                  })
                }
              >
                <option value="">All guests</option>
                {guestOptions.map((guest) => (
                  <option key={guest} value={`guest:${guest}`}>
                    {guest}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.sheetActions}>
              <button
                type="button"
                className={homeStyles.secondaryAction}
                onClick={() => setDraft(defaultFilters)}
              >
                Reset
              </button>
              <button type="submit" className={homeStyles.primaryAction}>
                Show photos
              </button>
            </div>
          </form>
        </MemoryGuestPanel>
      )}
    </section>
  );
}
