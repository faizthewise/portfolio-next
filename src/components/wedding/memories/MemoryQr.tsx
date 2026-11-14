import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Cormorant_Garamond, Great_Vibes, Lora } from "next/font/google";
import { brideInvitation, groomInvitation } from "@/lib/wedding/invitations";
import {
  MEMORY_PUBLIC_ALBUMS,
  memoryCanonicalUrl,
  memoryPath,
  memoryPublicSlug,
} from "@/lib/wedding/memoryRoutes";
import styles from "./Memories.module.css";
const title = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const couple = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const body = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export function MemoryQr({ side }: { side: "bride" | "groom" }) {
  const event = {
    ...MEMORY_PUBLIC_ALBUMS[side],
    theme: side === "bride" ? "garden" : "songket",
  };
  const hashtag = "#FaIzTheOneForHarissa";
  const canonical = memoryCanonicalUrl(side);
  const invitation = side === "bride" ? brideInvitation : groomInvitation;
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(canonical, {
          width: 720,
          margin: 4,
          errorCorrectionLevel: "Q",
          color: {
            dark: side === "bride" ? "#3e5949" : "#572330",
            light: "#fffdf8",
          },
        })
      )
      .then((image) => {
        if (active) setQr(image);
      })
      .catch((reason) => {
        if (active) setError((reason as Error).message);
      });
    return () => {
      active = false;
    };
  }, [canonical, side]);
  const displayDate = invitation.date.toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
  return (
    <main className={`${styles.page} ${styles[event.theme]} ${body.className}`}>
      <Head>
        <title>{`${event.coupleNames} · ${event.dateLabel} · Printable QR`}</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <header className={styles.header}>
        <Link href={memoryPath(side)}>
          <ArrowLeft size={17} /> Back to guest page
        </Link>
      </header>
      <section className={`${styles.qrCard} ${styles.qrArtwork}`}>
        <p className={styles.eyebrow}>WEDDING MEMORIES · {event.dateLabel}</p>
        <p className={`${styles.couple} ${couple.className}`}>
          {event.coupleNames}
        </p>
        <h1 className={title.className}>Scan to share your memories</h1>
        <p className={styles.eventDetails}>
          {displayDate}
          <br />
          {invitation.venue}
        </p>
        <p>{hashtag}</p>
        {qr ? (
          <img
            className={styles.qr}
            src={qr}
            alt={`QR code linking to ${canonical}`}
          />
        ) : error ? (
          <p role="alert" className={styles.error}>
            QR could not be created: {error}
          </p>
        ) : (
          <p role="status">Preparing QR…</p>
        )}
        <a
          className={styles.button}
          href={qr || undefined}
          download={`${memoryPublicSlug(side)}-wedding-memories-qr.png`}
          aria-disabled={!qr}
        >
          <Download size={17} /> Download QR image
        </a>
        <p className={styles.small}>{canonical}</p>
        <button className={styles.button} onClick={() => window.print()}>
          Print this card
        </button>
      </section>
    </main>
  );
}
