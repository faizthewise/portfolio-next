import Link from "next/link";
import { Album, House, Images } from "lucide-react";
import styles from "./MemoryGuestHome.module.css";

type MemoryGuestNavProps = {
  homeHref: string;
  galleryHref: string;
  albumHref: string;
  isGallery: boolean;
  isAlbum: boolean;
  hidden: boolean;
};

export function MemoryGuestNav({
  homeHref,
  galleryHref,
  albumHref,
  isGallery,
  isAlbum,
  hidden,
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
          aria-current={!isGallery && !isAlbum ? "page" : undefined}
        >
          <House size={22} aria-hidden="true" />
          Home
        </Link>
        <Link
          className={styles.navAction}
          href={galleryHref}
          aria-current={isGallery ? "page" : undefined}
        >
          <Images size={22} aria-hidden="true" />
          Gallery
        </Link>
        <Link
          className={styles.navAction}
          href={albumHref}
          aria-current={isAlbum ? "page" : undefined}
        >
          <Album size={22} aria-hidden="true" />
          My album
        </Link>
      </div>
    </nav>
  );
}
