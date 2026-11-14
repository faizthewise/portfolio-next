import Head from "next/head";
import Link from "next/link";
import styles from "@/components/wedding/memories/Memories.module.css";
import { MEMORY_PUBLIC_ALBUMS, memoryPath } from "@/lib/wedding/memoryRoutes";

export default function WeddingMemories() {
  return (
    <main className={styles.page}>
      <Head>
        <title>All albums · Faiz &amp; Harissa</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://faizhasnul.com/wedding-memories" />
      </Head>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>FAIZ & HARISSA · #FaIzTheOneForHarissa</p>
        <h1>All albums</h1>
        <p>
          Choose an album to share photos, wishes, and voice notes.
        </p>
        <div
          className={styles.actions}
          style={{ justifyContent: "center", marginTop: "1.5rem" }}
        >
          <Link className={styles.button} href={memoryPath("bride")}>
            {MEMORY_PUBLIC_ALBUMS.bride.coupleNames} · {MEMORY_PUBLIC_ALBUMS.bride.dateLabel}
          </Link>
          <Link className={styles.button} href={memoryPath("groom")}>
            {MEMORY_PUBLIC_ALBUMS.groom.coupleNames} · {MEMORY_PUBLIC_ALBUMS.groom.dateLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
