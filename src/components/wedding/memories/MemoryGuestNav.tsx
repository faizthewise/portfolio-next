import Link from "next/link";
import { Album, House, Images } from "lucide-react";
import styles from "./MemoryGuestHome.module.css";

type MemoryGuestNavProps = {
  homeHref: string;
  galleryHref: string;
  isGallery: boolean;
  albumOpen: boolean;
  hidden: boolean;
  onAlbum: () => void;
};

export function MemoryGuestNav({
  homeHref,
  galleryHref,
  isGallery,
  albumOpen,
  hidden,
  onAlbum,
}: MemoryGuestNavProps) {
  return (
    <nav
      className={styles.guestNav}
      aria-label="Wedding memories"
      hidden={hidden}
    >
      <div className={styles.navContent}>
        <Link
          className={styles.navAction}
          href={homeHref}
          aria-current={!isGallery && !albumOpen ? "page" : undefined}
        >
          <House size={22} aria-hidden="true" />
          Home
        </Link>
        <Link
          className={styles.navAction}
          href={galleryHref}
          aria-current={isGallery && !albumOpen ? "page" : undefined}
        >
          <Images size={22} aria-hidden="true" />
          Gallery
        </Link>
        <button
          type="button"
          className={styles.navAction}
          aria-haspopup="dialog"
          aria-expanded={albumOpen}
          onClick={onAlbum}
        >
          <Album size={22} aria-hidden="true" />
          My album
        </button>
      </div>
    </nav>
  );
}
