import type { RefObject } from "react";
import Link from "next/link";
import { Camera, Heart, Mic, PenLine, ImagePlus, Gift } from "lucide-react";
import styles from "./Memories.module.css";

export function MemoryGuestHub({
  theme,
  coupleNames,
  date,
  venue,
  welcome,
  cover,
  remaining,
  used,
  canReviewDrafts,
  draftCount,
  name,
  nameRef,
  namesClassName,
  onNameChange,
  onCamera,
  onAlbum,
  onVoice,
  onWish,
  onSalamKaut,
  galleryHref,
  queueSummary,
  status,
}: {
  theme: "garden" | "songket";
  coupleNames: string;
  date: string;
  venue: string;
  welcome: string;
  cover?: string;
  remaining: number;
  used: number;
  canReviewDrafts: boolean;
  draftCount: number;
  name: string;
  nameRef: RefObject<HTMLInputElement>;
  namesClassName: string;
  onNameChange: (value: string) => void;
  onCamera: (reviewOnly?: boolean) => void;
  onAlbum: () => void;
  onVoice: () => void;
  onWish: () => void;
  onSalamKaut: () => void;
  galleryHref: string;
  queueSummary: string;
  status: string;
}) {
  return (
    <section
      className={`${styles.guestHub} ${styles[`hub-${theme}`]}`}
      style={
        cover
          ? {
              backgroundImage: `linear-gradient(0deg, #fffdf8ed, #fffdf8a8), url("${cover}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className={styles.hubArtwork} aria-hidden="true" />
      <p className={styles.hubEyebrow}>WEDDING MEMORIES</p>
      <h1 className={`${styles.hubNames} ${namesClassName}`}>{coupleNames}</h1>
      <p className={styles.hubDate}>{date}</p>
      <p className={styles.hubVenue}>{venue}</p>
      <p className={styles.hubWelcome}>{welcome}</p>

      <label className={styles.hubNameField}>
        Your name
        <input
          ref={nameRef}
          maxLength={100}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoComplete="name"
          placeholder="Name shown with your photos and wishes"
        />
      </label>
      <div className={styles.hubQuota}>
        <span>{remaining} shots left</span>
        <span>{used} of 20 used</span>
      </div>
      <button
        type="button"
        className={styles.hubPrimaryAction}
        disabled={remaining <= 0 && !canReviewDrafts}
        onClick={() => onCamera(remaining <= 0 && canReviewDrafts)}
      >
        {remaining <= 0 && canReviewDrafts ? (
          <ImagePlus size={21} aria-hidden="true" />
        ) : (
          <Camera size={21} aria-hidden="true" />
        )}
        {remaining <= 0 && canReviewDrafts ? "Review photos" : "Open camera"}
      </button>
      {draftCount > 0 && (
        <p className={styles.hubQueueStatus} role="status">
          {draftCount} {draftCount === 1 ? "photo" : "photos"} saved on this device · upload when ready
        </p>
      )}
      <div className={styles.hubActionGrid}>
        <button type="button" onClick={onAlbum}>
          <ImagePlus aria-hidden="true" />
          My album
        </button>
        <button type="button" onClick={onVoice}>
          <Mic aria-hidden="true" />
          Voice note
        </button>
        <button type="button" onClick={onWish}>
          <PenLine aria-hidden="true" />
          Write a wish
        </button>
        <button type="button" onClick={onSalamKaut}>
          <Gift aria-hidden="true" />
          Salam Kaut
        </button>
      </div>
      <div className={styles.hubFooterActions}>
        <Link href={galleryHref}>
          <Heart size={17} aria-hidden="true" /> Shared gallery
        </Link>
      </div>
      {queueSummary && (
        <p className={styles.hubQueueStatus} role="status">
          {queueSummary}
        </p>
      )}
      {status && (
        <p className={styles.hubStatus} role="status">
          {status}
        </p>
      )}
    </section>
  );
}
