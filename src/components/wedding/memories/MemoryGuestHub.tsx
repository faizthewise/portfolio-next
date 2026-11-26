import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Camera, ImagePlus, Mic, PenLine } from "lucide-react";
import styles from "./MemoryGuestHome.module.css";

type MemoryGuestHubProps = {
  coupleNames: string;
  date: string;
  hashtag: string;
  remaining: number;
  photoLimit: number;
  quotaState: "loading" | "ready" | "error";
  draftCount: number;
  canReviewDrafts: boolean;
  onCamera: (reviewOnly?: boolean) => void;
  onQuotaRetry: () => void;
  onUpload: () => void;
  onVoice: () => void;
  onWish: () => void;
  galleryHref: string;
  children?: ReactNode;
};

export function MemoryGuestHub({
  coupleNames,
  date,
  hashtag,
  remaining,
  photoLimit,
  quotaState,
  draftCount,
  canReviewDrafts,
  onCamera,
  onQuotaRetry,
  onUpload,
  onVoice,
  onWish,
  galleryHref,
  children,
}: MemoryGuestHubProps) {
  const canTakePhoto = quotaState === "ready" && remaining > 0;
  const reviewOnly = !canTakePhoto && canReviewDrafts;

  return (
    <div className={styles.homeContent}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>The wedding of</p>
        <p className={styles.coupleNames}>{coupleNames}</p>
        <p className={styles.eventDate}>{date}</p>
        <h1 className={styles.heroTitle}>Through your eyes</h1>
        <p className={styles.heroMessage}>
          Capture the little moments and make them part of our forever.
        </p>
      </header>

      <section className={styles.cameraSection} aria-labelledby="guest-camera">
        <div className={styles.cameraHeading}>
          <h2 id="guest-camera" className={styles.sectionTitle}>
            Your camera
          </h2>
          <p className={styles.allowance} role="status">
            {quotaState === "ready" &&
              `${remaining} ${remaining === 1 ? "shot" : "shots"} left`}
            {quotaState === "loading" && "Checking shots…"}
            {quotaState === "error" && "Shot count unavailable"}
          </p>
        </div>
        <div className={styles.exposureMeter} aria-hidden="true">
          {Array.from({ length: photoLimit }, (_, index) => (
            <span
              className={
                quotaState === "ready" && index < remaining
                  ? styles.availableExposure
                  : styles.exposure
              }
              key={index}
            />
          ))}
        </div>
        <div className={styles.cameraActions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => onCamera(reviewOnly)}
            disabled={!canTakePhoto && !reviewOnly}
          >
            {reviewOnly ? (
              <ImagePlus size={24} aria-hidden="true" />
            ) : (
              <Camera size={24} aria-hidden="true" />
            )}
            {reviewOnly ? "Review photos" : "Take a photo"}
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={onUpload}
            disabled={!canTakePhoto}
          >
            <ImagePlus size={20} aria-hidden="true" />
            Upload photos
          </button>
        </div>
        {quotaState === "error" && (
          <button
            type="button"
            className={styles.textAction}
            onClick={onQuotaRetry}
          >
            Retry shot count
          </button>
        )}
        {quotaState === "ready" && !canTakePhoto && (
          <p className={styles.cameraNote}>
            All {photoLimit} {photoLimit === 1 ? "shot is" : "shots are"} in
            use.
          </p>
        )}
        {draftCount > 0 && (
          <p className={styles.cameraNote} role="status">
            {draftCount} {draftCount === 1 ? "photo" : "photos"} saved on this
            device.
          </p>
        )}
      </section>

      {children}

      <section className={styles.homeSection} aria-labelledby="guest-messages">
        <h2 id="guest-messages" className={styles.sectionTitle}>
          Leave us a little love
        </h2>
        <div className={styles.contributionGrid}>
          <button
            type="button"
            className={styles.contributionCard}
            onClick={onWish}
          >
            <PenLine size={24} aria-hidden="true" />
            <span className={styles.cardTitle}>Write a wish</span>
            <span className={styles.cardDescription}>
              A few heartfelt words
            </span>
          </button>
          <button
            type="button"
            className={styles.contributionCard}
            onClick={onVoice}
          >
            <Mic size={24} aria-hidden="true" />
            <span className={styles.cardTitle}>Record a message</span>
            <span className={styles.cardDescription}>
              Let us hear your voice
            </span>
          </button>
        </div>
      </section>

      <section className={styles.homeSection} aria-labelledby="guest-gallery">
        <h2 id="guest-gallery" className={styles.sectionTitle}>
          Our day, together
        </h2>
        <p className={styles.galleryDescription}>
          Memories through everyone&apos;s eyes.
        </p>
        <Link className={styles.textAction} href={galleryHref}>
          Explore the gallery <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <footer className={styles.closing}>{hashtag}</footer>
    </div>
  );
}
