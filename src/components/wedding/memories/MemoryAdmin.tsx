import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getBlob, ref } from "firebase/storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Cormorant_Garamond, Great_Vibes, Lora } from "next/font/google";
import {
  getWeddingOwnerAuth,
  getWeddingOwnerFirestore,
  getWeddingOwnerStorage,
} from "@/lib/wedding/firebase";
import {
  MEMORY_EVENTS,
  countMemories,
  exportMemoryFiles,
  readSettings,
  readSettingsSnapshot,
  updateSettings,
  type MemorySettings,
} from "@/lib/wedding/memories";
import type { WeddingEventId } from "@/lib/wedding/invitations";
import { brideInvitation, groomInvitation } from "@/lib/wedding/invitations";
import { PHOTO_FILM_PRESETS, resolvePhotoFilm } from "@/lib/wedding/memoriesRender";
import {
  MEMORY_PUBLIC_ALBUMS,
  memoryCanonicalUrl,
  memoryPath,
  memoryPublicSlug,
} from "@/lib/wedding/memoryRoutes";
import styles from "./Memories.module.css";

const emptySettings: MemorySettings = {
  welcome: "",
  cover: "",
  film: "classic-chrome",
  stamp: "#FaIzTheOneForHarissa",
  bankRecipient: "",
  bankDetails: "",
  qrUrl: "",
};
const dashboardTitle = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const dashboardNames = Great_Vibes({ subsets: ["latin"], weight: "400", display: "swap" });
const dashboardBody = Lora({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });
export function MemoryAdmin({ side }: { side: "bride" | "groom" }) {
  const event = MEMORY_EVENTS[side];
  const wedding = side === "bride" ? brideInvitation : groomInvitation;
  const displayDate = wedding.date.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });
  const [user, setUser] = useState<User | null>(null);
  const [owner, setOwner] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [settings, setSettings] = useState<MemorySettings>(emptySettings);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const auth = getWeddingOwnerAuth();
    return onAuthStateChanged(auth, async (activeUser) => {
      setUser(activeUser);
      setOwner(false);
      if (!activeUser) return;
      try {
        const token = await getIdTokenResult(activeUser, true);
        const isOwner = token.claims.owner === true;
        setOwner(isOwner);
        if (isOwner) {
          await readSettings(event.id).then((value) =>
            setSettings({ ...value, film: resolvePhotoFilm(value.film) })
          );
          await countMemories(event.id).then(setCounts);
        } else setError("This account is not enabled as the wedding owner.");
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }, [event.id]);
  useEffect(() => {
    if (!owner) return;
    const unsubscribe = readSettingsSnapshot(
      event.id,
      (value) => setSettings({ ...value, film: resolvePhotoFilm(value.film) }),
      (reason) =>
      setError(`Could not load couple settings: ${reason.message}`)
    );
    return () => {
      void unsubscribe
        .then((stop) => stop())
        .catch((reason) => setError(`Could not load couple settings: ${reason.message}`));
    };
  }, [owner, event.id]);
  async function login(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const auth = getWeddingOwnerAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    setBusy(true);
    try {
      await updateSettings(event.id, settings);
      setStatus("Couple settings saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function exportZip() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const blob = await exportMemoryFiles(event.id, setStatus);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${memoryPublicSlug(side)}-wedding-memories-${new Date()
        .toISOString()
        .slice(0, 10)}.zip`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setStatus("Complete ZIP downloaded.");
    } catch (e) {
      setError(
        `Export stopped without downloading a partial archive: ${
          (e as Error).message
        }`
      );
    } finally {
      setBusy(false);
    }
  }
  const refreshCounts = async () => {
    try {
      setCounts(await countMemories(event.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <main className={`${styles.page} ${styles[event.theme]} ${dashboardBody.className}`}>
      <Head>
        <title>{`${event.name} · ${event.dateLabel} · Couple dashboard`}</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={memoryCanonicalUrl(side, "dashboard")} />
      </Head>
      <header className={styles.header}>
        <Link href={memoryPath(side)}>← Guest album</Link>
        <nav>
          <Link href={memoryPath(side, "gallery")}>Public gallery</Link>
          <Link href={memoryPath(side, "qr")}>QR card</Link>
        </nav>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>PRIVATE COUPLE DASHBOARD</p>
        <p className={`${styles.couple} ${dashboardNames.className}`}>
          {MEMORY_PUBLIC_ALBUMS[side].coupleNames}
        </p>
        <h1 className={dashboardTitle.className}>Memories settings</h1>
        <p>
          {event.name} · {displayDate} · {wedding.venue}
        </p>
      </section>
      {!user || !owner ? (
        <section className={styles.section}>
          <h2>Owner sign in</h2>
          <p>
            Sign in with the Firebase owner account. The server rules require
            the verified <code>owner: true</code> custom claim.
          </p>
          <form className={styles.adminForm} onSubmit={login}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className={styles.button} disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {user && (
            <><p>Signed in as {user.email}; this account does not have the required owner claim.</p><button className={styles.secondary} onClick={() => void signOut(getWeddingOwnerAuth())}>Sign out</button></>
          )}
        </section>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.adminHead}>
              <h2>Gallery counters</h2>
              <button
                className={styles.secondary}
                onClick={() => void refreshCounts()}
              >
                Refresh
              </button>
            </div>
            <div className={styles.counterGrid}>
              {Object.entries(counts).map(([label, value]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>
                    {label
                      .replace("voicePublic", "public voice notes")
                      .replace("voicePrivate", "private voice notes")}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h2>Guest experience</h2>
            <form className={styles.adminForm} onSubmit={save}>
              <label>
                Welcome message
                <textarea
                  maxLength={1000}
                  value={settings.welcome}
                  onChange={(e) =>
                    setSettings({ ...settings, welcome: e.target.value })
                  }
                />
              </label>
              <label>
                Cover image URL
                <input
                  value={settings.cover}
                  onChange={(e) =>
                    setSettings({ ...settings, cover: e.target.value })
                  }
                  placeholder="https://…"
                />
              </label>
              <label>
                Photo film
                <select
                  value={settings.film}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      film: e.target.value as MemorySettings["film"],
                    })
                  }
                >
                  {PHOTO_FILM_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <small className={styles.adminHelp}>
                  {PHOTO_FILM_PRESETS.find(
                    (preset) => preset.id === resolvePhotoFilm(settings.film)
                  )?.description}
                </small>
              </label>
              <label>
                Custom stamp
                <input
                  maxLength={100}
                  value={settings.stamp}
                  onChange={(e) =>
                    setSettings({ ...settings, stamp: e.target.value })
                  }
                />
              </label>
              <h3>Salam Kaut details</h3>
              <label>
                Bank recipient
                <input
                  maxLength={100}
                  value={settings.bankRecipient}
                  onChange={(e) =>
                    setSettings({ ...settings, bankRecipient: e.target.value })
                  }
                />
              </label>
              <label>
                Transfer details
                <input
                  maxLength={300}
                  value={settings.bankDetails}
                  onChange={(e) =>
                    setSettings({ ...settings, bankDetails: e.target.value })
                  }
                />
              </label>
              <label>
                Contribution QR image URL
                <input
                  value={settings.qrUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, qrUrl: e.target.value })
                  }
                  placeholder="https://…"
                />
              </label>
              {settings.qrUrl && (
                <img
                  className={styles.bankQr}
                  src={settings.qrUrl}
                  alt="Salam Kaut QR preview"
                />
              )}
              <button className={styles.button} disabled={busy}>
                Save settings
              </button>
            </form>
          </section>
          <section className={styles.section}>
            <h2>Download archive</h2>
            <p>
              Creates a complete ZIP with original photos, current styled
              versions, public and private voice notes, wishes, favourites,
              public settings, and metadata. Any failed asset stops the export.
            </p>
            <button
              className={styles.button}
              disabled={busy}
              onClick={() => void exportZip()}
            >
              {busy ? "Working…" : "Export complete ZIP"}
            </button>
            <button
              className={styles.secondary}
              onClick={() => void signOut(getWeddingOwnerAuth())}
            >
              Sign out
            </button>
          </section>
          <section className={styles.section}>
            <h2>Private voice notes</h2>
            <PrivateVoices event={event.id} />
          </section>
        </>
      )}
      {status && (
        <p role="status" className={styles.status}>
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error.includes("permission") || error.includes("insufficient")
            ? "Firebase access is not ready or this account lacks the couple owner claim."
            : error}
        </p>
      )}
    </main>
  );
}
function PrivateVoices({ event }: { event: WeddingEventId }) {
  const [voices, setVoices] = useState<
    { id: string; guestName: string; path: string }[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getDocs(
      query(
        collection(
          getWeddingOwnerFirestore(),
          `weddings/${event}/memoryAlbums/main/voicePrivate`
        ),
        where("status", "==", "complete")
      )
    )
      .then((snap) => {
        if (active)
          setVoices(
            snap.docs.map((d) => ({
              id: d.id,
              guestName: d.data().guestName,
              path: d.data().path,
            }))
          );
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
    };
  }, [event]);
  return (
    <>
      {voices.length ? (
        voices.map((voice) => <AdminAudio key={voice.id} voice={voice} />)
      ) : (
        <p className={styles.small}>No private recordings yet.</p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}
function AdminAudio({
  voice,
}: {
  voice: { id: string; guestName: string; path: string };
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setError("");
    getBlob(ref(getWeddingOwnerStorage(), voice.path))
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((reason) => {
        if (active)
          setError(`Could not load this private voice note: ${reason.message}`);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [voice.path, attempt]);
  return (
    <article className={styles.wish}>
      <strong>{voice.guestName}</strong>
      <p>Private recording</p>
      {url && (
        <audio
          controls
          preload="none"
          src={url}
          onError={() => setError("This browser could not play the recording.")}
        />
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}{" "}
          <button
            className={styles.secondary}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </p>
      )}
    </article>
  );
}
