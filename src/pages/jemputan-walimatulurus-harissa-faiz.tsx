import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import RegistryProductImage from "@/components/wedding/RegistryProductImage";
import { registryPath, registryProducts } from "@/lib/wedding/registry";
import { getInvitationMode } from "@/lib/wedding/invitationMode";
import registryStyles from "@/styles/WeddingRegistry.module.css";
import WeddingWishes from "@/components/wedding/WeddingWishes";
import GardenReveal from "@/components/wedding/GardenReveal";
import GardenButterflyFlight from "@/components/wedding/GardenButterflyFlight";
import MohorMagic from "@/components/wedding/MohorMagic";
import BotanicalArtwork from "@/components/wedding/BotanicalArtwork";
import { useWeddingMusic } from "@/components/wedding/WeddingMusicProvider";
import styles from "@/styles/WeddingGarden.module.css";
import { getWeddingGuest } from "@/lib/wedding/firebase";
import {
  WeddingWish,
  WISH_CHARACTER_LIMIT,
  subscribeWedding,
  saveRsvp,
} from "@/lib/wedding/data";
import {
  Cormorant_Garamond,
  Great_Vibes,
  Lora,
  Parisienne,
} from "next/font/google";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  QrCode,
  Quote,
  Shirt,
  Sparkles,
  VolumeX,
} from "lucide-react";

const titleFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const namesFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const coupleNamesFont = Parisienne({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const hashtagFont = Lora({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
});

const wedding = {
  bride: "Harissa",
  groom: "Faiz",
  brideFullName: "Harissa Amani binti Abd Razak",
  groomFullName: "Muhammad Faiz bin Hasnul",
  date: new Date("2026-11-28T11:30:00+08:00"),
  dateLabel: "Sabtu, 28 November 2026",
  timeLabel: "11.30 pagi - 4.00 petang",
  venue: "LeQAMR Glasshall, Melaka",
  dresscode: "Tradisional/Formal",
  mapQuery: "LeQAMR Glasshall, Melaka",
  hosts: "Ts. Abd Razak bin Mohamad Zin & Dr Hasuarina binti Hassan",
};

const weddingContacts = [
  { name: "Razak", phone: "0126365859" },
  { name: "Hasuarina", phone: "0126237859" },
  { name: "Amira", phone: "0192115859" },
  { name: "Hanani", phone: "0196345859" },
  { name: "Harris", phone: "0133635859" },
];

function CoupleName({ fullName }: { fullName: string }) {
  const parts = fullName.match(/^(.+?)\s+((?:bin|binti)\s+.+)$/);
  return (
    <span className={styles["couple-name"]}>
      {parts ? parts[1] : fullName}
      {parts && (
        <span className={`${styles["couple-lineage"]} ${titleFont.className}`}>
          {" "}
          {parts[2]}
        </span>
      )}
    </span>
  );
}

function GardenFlower({
  x,
  y,
  scale = 1,
  rotation = 0,
  color = "#fffdf8",
}: {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      <ellipse
        cx="0"
        cy="-11"
        rx="7"
        ry="12"
        fill={color}
        stroke="#ab9d86"
        strokeWidth="1"
      />
      <ellipse
        cx="10.5"
        cy="-3.5"
        rx="7"
        ry="12"
        transform="rotate(72 10.5 -3.5)"
        fill={color}
        stroke="#ab9d86"
        strokeWidth="1"
      />
      <ellipse
        cx="6.5"
        cy="9"
        rx="7"
        ry="12"
        transform="rotate(144 6.5 9)"
        fill={color}
        stroke="#ab9d86"
        strokeWidth="1"
      />
      <ellipse
        cx="-6.5"
        cy="9"
        rx="7"
        ry="12"
        transform="rotate(216 -6.5 9)"
        fill={color}
        stroke="#ab9d86"
        strokeWidth="1"
      />
      <ellipse
        cx="-10.5"
        cy="-3.5"
        rx="7"
        ry="12"
        transform="rotate(288 -10.5 -3.5)"
        fill={color}
        stroke="#ab9d86"
        strokeWidth="1"
      />
      <circle r="5.2" fill="#d1af63" />
      <circle r="2" fill="#8f7440" />
    </g>
  );
}

function Butterfly({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 64"
      aria-hidden="true"
      focusable="false"
      className={`${styles.butterfly} pointer-events-none drop-shadow-[0_3px_3px_rgba(119,88,49,0.22)] ${className}`}
    >
      <g
        fill="#eacfdc"
        fillOpacity=".95"
        stroke="#99703c"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g data-wing="left">
          <path d="M39 32C30 13 10 3 5 8C0 16 9 34 30 38C13 33 9 43 17 53C25 61 36 48 39 35Z" />
          <g fill="none" strokeOpacity=".8" strokeWidth=".85">
            <path d="M38 33L9 12M36 34L10 24M37 36L21 50" />
            <path d="M14 14Q17 27 31 32M22 40L25 48" />
          </g>
        </g>
        <g data-wing="right" fill="#ded3ee">
          <path d="M41 32C50 13 70 3 75 8C80 16 71 34 50 38C67 33 71 43 63 53C55 61 44 48 41 35Z" />
          <g fill="none" strokeOpacity=".8" strokeWidth=".85">
            <path d="M42 33L71 12M44 34L70 24M43 36L59 50" />
            <path d="M66 14Q63 27 49 32M58 40L55 48" />
          </g>
        </g>
        <path
          d="M40 26C38 32 39 43 40 46C41 43 42 32 40 26ZM39 27Q32 15 29 18M41 27Q48 15 51 18"
          fill="none"
        />
      </g>
    </svg>
  );
}

function Ornament() {
  return (
    <svg
      viewBox="0 0 260 80"
      aria-hidden="true"
      className={`${styles.ornament} mx-auto h-16 w-56`}
    >
      <path
        d="M20 48c40 0 54-21 87-13M240 48c-40 0-54-21-87-13"
        fill="none"
        stroke="#6e896b"
        strokeWidth="1.4"
      />
      <path
        d="M68 39c-12-14-25-11-29-2 13-3 22 0 29 2Zm31-7c-5-15-17-20-26-13 12 3 19 8 26 13Zm93 7c12-14 25-11 29-2-13-3-22 0-29 2Zm-31-7c5-15 17-20 26-13-12 3-19 8-26 13Z"
        fill="#6e896b"
        opacity=".82"
      />
      <GardenFlower
        color="#e8c7d3"
        x={108}
        y={37}
        scale={0.72}
        rotation={-12}
      />
      <GardenFlower color="#ddd4ed" x={130} y={32} scale={0.92} rotation={8} />
      <GardenFlower color="#cfdeeb" x={153} y={38} scale={0.68} rotation={24} />
      <path d="M112 62h36" stroke="#a79a78" strokeWidth="1.4" />
      <circle cx="104" cy="62" r="2" fill="#a79a78" />
      <circle cx="156" cy="62" r="2" fill="#a79a78" />
    </svg>
  );
}

function InvitationCoverArtwork({
  onOpen,
  opening,
  revealing,
}: {
  onOpen: () => void;
  opening: boolean;
  revealing: boolean;
}) {
  return (
    <div
      className={`${styles["cover-book"]} ${opening ? styles.enchanting : ""} ${
        revealing ? styles.opening : ""
      } mx-auto w-full`}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={opening}
        aria-busy={opening}
        className={`${styles.envelope} sealed-invitation group relative block w-full text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#607a60] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e4e9df]`}
        aria-label="Buka undangan perkahwinan Harissa Amani dan Muhammad Faiz"
      >
        <span
          className={`${styles["cover-leaf"]} ${styles["leaf-left"]}`}
          aria-hidden="true"
        />
        <span
          className={`${styles["cover-leaf"]} ${styles["leaf-right"]}`}
          aria-hidden="true"
        />

        <Butterfly className="absolute right-[6%] top-[39%] w-20 -rotate-[22deg] sm:w-24" />
        <span
          className={`${styles.seal} wax-seal absolute left-1/2 top-1/2 z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center transition duration-300 group-hover:scale-105`}
          aria-hidden="true"
        >
          <img
            src="/images/wax-seal-fh-v1.png"
            alt=""
            className="wax-seal-image h-full w-full object-cover"
          />
        </span>
        {opening && <MohorMagic fading={revealing} />}
      </button>
      <p
        className={`${styles["cover-hint"]} ${namesFont.className} mt-6 text-[#536858]`}
      >
        Tekan mohor untuk membuka
      </p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  children,
  light = false,
}: {
  eyebrow: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <GardenReveal
      className={`${styles["section-title"]} mx-auto mb-10 max-w-xl text-center`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.34em] ${
          light ? "text-[#496851]" : "text-[#71866d]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`${titleFont.className} mt-3 text-4xl font-medium tracking-wide text-[#3e5949] sm:text-5xl`}
      >
        {children}
      </h2>
      <Ornament />
    </GardenReveal>
  );
}

export default function JemputanWalimatulurusHarissaFaiz() {
  const router = useRouter();
  const mode = getInvitationMode(router.query.mode);
  const showGifts = router.isReady && mode !== "family";
  const showHashtag = router.isReady && mode === "friend";
  const regularGifts = registryProducts.filter(
    (product) => !product.contribution
  );
  const [showSalam, setShowSalam] = useState(false);
  const {
    invitationOpened,
    revealInvitation: setInvitationOpened,
    musicPlaying,
    openingSoundPlaying,
    startOpening,
    toggleMusic,
  } = useWeddingMusic();
  const [showDock, setShowDock] = useState(false);
  const [opening, setOpening] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [wishLength, setWishLength] = useState(0);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [wishes, setWishes] = useState<WeddingWish[]>([]);
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const openingCleanup = useRef<(() => void) | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  const invitationRef = useRef<HTMLElement>(null);

  useEffect(
    () => () => {
      openingCleanup.current?.();
    },
    []
  );

  useEffect(() => {
    if (!invitationOpened) return;
    // Focus the new document, not an off-screen reveal inside the invitation.
    invitationRef.current?.focus({ preventScroll: true });
    const returnFrame =
      showGifts &&
      new URLSearchParams(window.location.search).get("registry") === "1"
        ? requestAnimationFrame(() =>
            document
              .getElementById("hadiah")
              ?.scrollIntoView({ behavior: "auto" })
          )
        : 0;
    setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    let frame = 0;
    const update = () => {
      frame = 0;
      // Introduce shortcuts only once the countdown is comfortably in view.
      const countdownTop = countdownRef.current?.getBoundingClientRect().top;
      if (
        countdownTop !== undefined &&
        countdownTop <= window.innerHeight * 0.8
      )
        setShowDock(true);
      const distance =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(returnFrame);
      clearInterval(tick);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [invitationOpened, showGifts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowSalam(params.get("salam") === "1");
    if (params.get("registry") === "1") setInvitationOpened();

    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void getWeddingGuest()
      .then(() => {
        if (disposed) return;
        let giftsLoaded = false;
        let wishesLoaded = false;
        let failed = false;
        unsubscribe = subscribeWedding(
          () => {
            giftsLoaded = true;
            setBackendReady(!failed && giftsLoaded && wishesLoaded);
          },
          (items) => {
            setWishes(items);
            wishesLoaded = true;
            setBackendReady(!failed && giftsLoaded && wishesLoaded);
          },
          (error, source) => {
            if (disposed) return;
            console.error(
              `[Wedding Firebase] ${source} read failed`,
              error.code,
              error.message
            );
            failed = true;
            setBackendReady(false);
            setBackendError(
              "Tidak dapat memuatkan data. Sila muat semula halaman dan cuba lagi."
            );
          }
        );
      })
      .catch((error) => {
        if (disposed) return;
        console.error("[Wedding Firebase] Connection failed", error);
        setBackendError(
          "Tidak dapat menyambung. Sila muat semula halaman dan cuba lagi."
        );
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [setInvitationOpened]);

  const countdown = useMemo(() => {
    if (now === null) return { hari: "—", jam: "—", minit: "—" };
    const distance = Math.max(0, wedding.date.getTime() - now);
    return {
      hari: Math.floor(distance / 86_400_000),
      jam: Math.floor((distance / 3_600_000) % 24),
      minit: Math.floor((distance / 60_000) % 60),
    };
  }, [now]);

  const performSave = async (action: () => Promise<void>) => {
    if (savingRef.current || !backendReady) return;
    savingRef.current = true;
    setSaving(true);
    setBackendError("");
    try {
      await action();
    } catch (error) {
      setBackendError(
        error instanceof Error && !error.message.includes("Firebase")
          ? error.message
          : "Maklumat belum disimpan. Sila cuba lagi."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const submitRsvp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    setRsvpSent(false);
    void performSave(async () => {
      await saveRsvp(form);
      setRsvpSent(true);
      element.reset();
      setWishLength(0);
    });
  };

  const encodedVenue = encodeURIComponent(wedding.mapQuery);
  const maps = [
    {
      name: "Google Maps",
      href: `https://www.google.com/maps/search/?api=1&query=${encodedVenue}`,
    },
    {
      name: "Waze",
      href: `https://www.waze.com/ul?q=${encodedVenue}&navigate=yes`,
    },
    { name: "Apple Maps", href: `https://maps.apple.com/?q=${encodedVenue}` },
  ];

  const openInvitation = () => {
    if (openingCleanup.current || opening || invitationOpened) return;
    setOpening(true);
    openingCleanup.current = startOpening({
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches,
      onReveal: () => setRevealing(true),
      onOpen: () => window.scrollTo({ top: 0, behavior: "auto" }),
    });
  };

  return (
    <>
      <Head>
        <title>{`${wedding.bride} & ${wedding.groom} — Undangan Walimatulurus`}</title>
        <meta
          name="description"
          content={`Dengan penuh kesyukuran, ${wedding.hosts} menjemput anda ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom} pada 28 November 2026.`}
        />
        <meta name="theme-color" content="#e4e9df" />
        <link
          rel="preload"
          as="image"
          href="/images/gatefold-cover-garden-v1.webp"
        />
      </Head>

      {!invitationOpened ? (
        <main
          className={`${styles.cover} relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-center text-[#3e5949] sm:px-8 sm:py-14`}
        >
          <div
            className={`${styles["cover-content"]} relative z-10 mx-auto w-full max-w-xl`}
          >
            <p
              className={`${styles["cover-label"]} ${namesFont.className} mb-7 text-[#536858]`}
            >
              Jemputan ke Walimatulurus
            </p>
            <InvitationCoverArtwork
              onOpen={openInvitation}
              opening={opening}
              revealing={revealing}
            />
            <p
              className={`${titleFont.className} mt-7 text-sm tracking-[0.3em] text-[#8e7956]`}
            >
              28 . 11 . 2026
            </p>
          </div>
        </main>
      ) : (
        <main
          ref={invitationRef}
          tabIndex={-1}
          aria-label="Undangan perkahwinan Harissa dan Faiz"
          className={`${styles.page} english-invitation-enter english-wedding-paper garden-english-wedding-paper min-h-screen bg-[#fffdf8] text-[#3e5949] antialiased selection:bg-[#eacfdc] focus:outline-none`}
        >
          <div
            ref={progressRef}
            className={styles.progress}
            aria-hidden="true"
          />
          <section
            className={`${styles.hero} relative grid min-h-screen place-items-center overflow-x-hidden px-5 text-center sm:px-8`}
          >
            <div
              className={`${styles["hero-card"]} english-invitation-card garden-english-invitation-card relative z-10 mx-auto w-full px-7 pb-28 pt-32 sm:px-16 sm:pb-36 sm:pt-44`}
            >
              <BotanicalArtwork />
              <Butterfly className="garden-butterfly-accent right-[18%] top-[5%] w-20 rotate-[18deg] sm:w-24" />
              <GardenReveal>
                <p
                  className={`${styles["hero-label"]} font-semibold uppercase text-[#8e7956]`}
                >
                  Walimatulurus
                </p>
              </GardenReveal>
              <GardenReveal delay={120} className={styles["hero-copy"]}>
                <p
                  className={`${styles["hero-blessing"]} font-serif italic text-[#68776d]`}
                  lang="ar"
                  dir="rtl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                </p>
                <p
                  className={`${styles["hero-invitation"]} mx-auto mt-6 max-w-lg text-[#68776d]`}
                >
                  Dengan penuh kesyukuran ke hadrat Allah SWT, kami
                </p>
                <p
                  className={`${styles["hero-hosts"]} ${titleFont.className} mt-2 font-medium text-[#496851]`}
                >
                  {wedding.hosts.split(" & ").map((host, index) => (
                    <span key={host} className={styles["host-name"]}>
                      {index > 0 && (
                        <span className={styles["host-separator"]}>&amp;</span>
                      )}
                      {host}
                    </span>
                  ))}
                </p>
                <p
                  className={`${styles["hero-invitation"]} mx-auto mt-5 max-w-lg text-[#68776d]`}
                >
                  dengan segala hormatnya menjemput Dato&apos; / Datin / Tuan /
                  Puan / Encik / Cik bersama pasangan ke majlis perkahwinan puteri
                  kami
                </p>
              </GardenReveal>
              <GardenReveal delay={240}>
                <h1
                  className={`${coupleNamesFont.className} font-normal focus:outline-none`}
                >
                  <CoupleName fullName={wedding.brideFullName} />
                  <span
                    className={`${styles["couple-connector"]} ${namesFont.className} mx-auto block font-normal italic text-[#9b8b65]`}
                  >
                    dan pilihan hatinya
                  </span>
                  <CoupleName fullName={wedding.groomFullName} />
                </h1>
                <Ornament />
                <p className={`${styles["hero-date"]} ${titleFont.className}`}>
                  28 NOVEMBER 2026
                </p>
                <p className={styles["hero-venue"]}>{wedding.venue}</p>
              </GardenReveal>
              <div>
                <GardenReveal delay={360}>
                  <div
                    className={`${styles["hero-links"]} mt-7 flex flex-wrap justify-center gap-3`}
                  >
                    <a
                      href="#lokasi"
                      className="inline-flex items-center gap-2 rounded-full border border-[#71866d]/25 bg-[#fffdf8]/80 px-5 py-3 text-sm font-semibold text-[#3e5949] shadow-sm transition hover:-translate-y-0.5 hover:border-[#607a60]"
                    >
                      <MapPin className="h-4 w-4" /> Lokasi
                    </a>
                    <a
                      href="#rsvp"
                      className="inline-flex items-center gap-2 rounded-full bg-[#4c6b55] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#3e5949]"
                    >
                      <Heart className="h-4 w-4" /> RSVP
                    </a>
                    {showGifts && (
                      <a
                        href="#hadiah"
                        className="inline-flex items-center gap-2 rounded-full border border-[#3e5949]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[#3e5949] shadow-sm transition hover:-translate-y-0.5 hover:border-[#607a60]"
                      >
                        <Gift className="h-4 w-4" /> Hadiah
                      </a>
                    )}
                    {showSalam && (
                      <a
                        href="#salam-kaut"
                        className="inline-flex items-center gap-2 rounded-full border border-[#607a60]/30 bg-[#607a60] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#4f7058]"
                      >
                        <QrCode className="h-4 w-4" /> Salam Kaut
                      </a>
                    )}
                  </div>
                </GardenReveal>
                <div
                  className={`${styles["hero-schedule"]} ${titleFont.className} mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[#3e5949]`}
                >
                  <span>{wedding.dateLabel}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-[#607a60] sm:block" />
                  <span>{wedding.timeLabel}</span>
                </div>
                <div>
                  <a
                    href="#butiran"
                    className={`${styles["scroll-cue"]} mx-auto mt-9 grid h-12 w-12 place-items-center rounded-full border border-[#a48b60]/40 text-[#8e7956] transition hover:-translate-y-1 hover:bg-white/60`}
                    aria-label="Lihat butiran majlis"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          <GardenReveal className={styles.interlude}>
            <blockquote className={titleFont.className}>
              &ldquo;Dan Kami menciptakan kamu berpasang-pasangan.&rdquo;
              <cite>Surah An-Naba · 78:8</cite>
            </blockquote>
          </GardenReveal>

          <section
            id="butiran"
            className="stationery-section garden-stationery-section relative overflow-hidden border-y border-[#a79a78]/20 bg-[#eef0e8] px-6 py-24 text-[#3e5949]"
          >
            <div className="relative">
              <SectionTitle eyebrow="Dengan segala hormatnya" light>
                Majlis perkahwinan puteri kami
              </SectionTitle>
              <div
                ref={countdownRef}
                className={`${styles.countdown} mx-auto grid grid-cols-3`}
              >
                {[
                  ["Hari", countdown.hari],
                  ["Jam", countdown.jam],
                  ["Minit", countdown.minit],
                ].map(([label, value], index) => (
                  <GardenReveal
                    key={label}
                    delay={index * 100}
                    className="p-5 text-center"
                  >
                    <strong
                      className={`${titleFont.className} block text-6xl font-medium text-[#496851]`}
                    >
                      {value}
                    </strong>
                    <span className="mt-2 block text-xs uppercase tracking-[0.25em] text-[#6e7b70]">
                      {label}
                    </span>
                  </GardenReveal>
                ))}
              </div>
              <div
                className={`${styles["detail-list"]} mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4`}
              >
                {[
                  { icon: CalendarDays, label: wedding.dateLabel },
                  { icon: Sparkles, label: wedding.timeLabel },
                  { icon: MapPin, label: wedding.venue },
                  { icon: Shirt, label: `Kod Pakaian: ${wedding.dresscode}` },
                ].map(({ icon: Icon, label }, index) => (
                  <GardenReveal key={label} delay={index * 100}>
                    <div
                      className={`${styles["detail-card"]} stationery-panel flex items-center gap-4 text-[#3e5949]`}
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e3e9de]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-medium">{label}</span>
                    </div>
                  </GardenReveal>
                ))}
              </div>
              <div className={`${styles["calendar-action"]} mt-8 text-center`}>
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    `Majlis Perkahwinan ${wedding.bride} & ${wedding.groom}`
                  )}&dates=20261128T113000/20261128T160000&ctz=Asia%2FKuala_Lumpur&location=${encodeURIComponent(
                    wedding.venue
                  )}&details=${encodeURIComponent(
                    `Dengan penuh kesyukuran, ${wedding.hosts} menjemput tuan/puan ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#4c6b55] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#3e5949]/10 transition hover:-translate-y-0.5 hover:bg-[#3e5949]"
                >
                  <CalendarDays className="h-4 w-4" /> Tambah ke Google Calendar
                </a>
              </div>
            </div>
          </section>

          <section
            id="lokasi"
            className="relative scroll-mt-6 overflow-hidden px-6 py-24"
          >
            <div className="relative">
              <SectionTitle eyebrow="Tempat berlangsungnya majlis">
                Kami menanti kehadiran tuan dan puan
              </SectionTitle>
              <GardenReveal direction="left" className="mx-auto max-w-4xl">
                <div className={`${styles["venue-card"]} stationery-panel`}>
                  <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <MapPin className="h-9 w-9 text-[#607a60]" />
                      <h3
                        className={`${titleFont.className} mt-4 text-4xl font-medium text-[#3e5949]`}
                      >
                        {wedding.venue}
                      </h3>
                      <p className="mt-3 max-w-lg leading-7 text-[#6f786f]">
                        Kami sekeluarga berbesar hati menyambut
                        kehadiran tuan/puan. Pilih aplikasi navigasi untuk
                        mendapatkan arah ke lokasi majlis.
                      </p>
                    </div>
                    <div className={`${styles["map-links"]} grid gap-3`}>
                      {maps.map((map) => (
                        <a
                          key={map.name}
                          href={map.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-[190px] items-center justify-between rounded-full border border-[#3e5949]/15 bg-white px-5 py-3 font-medium transition hover:-translate-y-0.5 hover:border-[#607a60]"
                        >
                          {map.name}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </GardenReveal>
            </div>
          </section>

          <section
            id="rsvp"
            className={`${styles["rsvp-section"]} english-wedding-blush garden-english-wedding-blush stationery-section garden-stationery-section relative scroll-mt-6 overflow-hidden border-y border-[#a79a78]/20 bg-[#eef0e8] px-6 py-24`}
          >
            <div className="relative">
              <SectionTitle eyebrow="Mohon maklum balas">
                Khabarkan kehadiran tuan dan puan
              </SectionTitle>
              <p
                className={`${styles["section-intro"]} mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[#6f786f]`}
              >
                Bagi membantu kami membuat persiapan, mohon sahkan kehadiran
                sebelum hari majlis.
              </p>
              <GardenReveal className="mx-auto max-w-2xl">
                <form
                  onSubmit={submitRsvp}
                  className={`${styles["rsvp-form"]} stationery-panel grid gap-5 p-6 sm:p-10`}
                >
                  <label
                    className={`${styles["rsvp-name"]} grid gap-2 text-sm font-semibold`}
                  >
                    Nama
                    <input
                      name="nama"
                      maxLength={100}
                      required
                      placeholder="Nama anda"
                      className="rounded-sm border-[#3e5949]/15 bg-white focus:border-[#607a60] focus:ring-[#607a60]"
                    />
                  </label>
                  <label
                    className={`${styles["rsvp-guests"]} grid gap-2 text-sm font-semibold`}
                  >
                    Jumlah tetamu
                    <select
                      name="tetamu"
                      className="rounded-sm border-[#3e5949]/15 bg-white focus:border-[#607a60] focus:ring-[#607a60]"
                    >
                      {[1, 2, 3, 4].map((count) => (
                        <option key={count}>{count}</option>
                      ))}
                    </select>
                  </label>
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                      Kehadiran
                    </legend>
                    <div className="grid grid-cols-2 gap-3">
                      {["Hadir, insya-Allah", "Maaf, tidak dapat hadir"].map(
                        (answer, index) => (
                          <label
                            key={answer}
                            className="flex cursor-pointer items-center gap-3 rounded-sm border border-[#3e5949]/15 bg-white p-4 text-sm"
                          >
                            <input
                              type="radio"
                              name="kehadiran"
                              value={answer}
                              required
                              defaultChecked={index === 0}
                              className="text-[#607a60] focus:ring-[#607a60]"
                            />
                            {index === 0 ? "Hadir" : answer}
                          </label>
                        )
                      )}
                    </div>
                  </fieldset>
                  <label className="grid gap-2 text-sm font-semibold">
                    Ucapan dan doa buat pasangan pengantin
                    <textarea
                      name="ucapan"
                      maxLength={WISH_CHARACTER_LIMIT}
                      aria-describedby="wish-character-count"
                      onChange={(event) =>
                        setWishLength(event.target.value.length)
                      }
                      rows={3}
                      placeholder="Titipkan doa dan ucapan buat pengantin..."
                      className="rounded-sm border-[#3e5949]/15 bg-white focus:border-[#607a60] focus:ring-[#607a60]"
                    />
                    <span
                      id="wish-character-count"
                      className="text-right text-xs font-normal text-[#6f786f]"
                    >
                      {wishLength}/{WISH_CHARACTER_LIMIT} aksara
                    </span>
                  </label>
                  <p className="text-xs text-[#6f786f]">
                    Nama dan ucapan akan dipaparkan kepada tetamu lain. Maklumat
                    kehadiran adalah peribadi.
                  </p>
                  {!backendReady && !backendError && (
                    <p role="status">Sedang menyambung...</p>
                  )}
                  {backendError && (
                    <p role="alert" className="text-sm text-red-700">
                      {backendError}
                    </p>
                  )}
                  <button
                    disabled={!backendReady || saving}
                    className="mt-2 rounded-full bg-[#3e5949] px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4c6b55]"
                  >
                    {saving ? "Sedang menyimpan..." : "Hantar RSVP"}
                  </button>
                  {rsvpSent && (
                    <p className="text-center text-sm font-medium text-[#637d6d]">
                      Terima kasih. Maklum balas tuan/puan telah kami terima.
                    </p>
                  )}
                </form>
              </GardenReveal>
            </div>
          </section>

          <section
            id="ucapan"
            className={`${styles["wishes-section"]} relative scroll-mt-6 overflow-hidden border-b border-[#a79a78]/25 bg-[#fffdf8]/70 px-6`}
          >
            <GardenButterflyFlight>
              <Butterfly />
            </GardenButterflyFlight>
            <div
              className={`${styles["wishes-content"]} relative mx-auto max-w-5xl`}
            >
              <SectionTitle eyebrow="Titipan buat pengantin">
                Ucapan dan doa
              </SectionTitle>
              <p
                className={`${styles["section-intro"]} mx-auto -mt-6 mb-10 max-w-xl text-center leading-7 text-[#6f786f]`}
              >
                Setiap ucapan dan doa yang dititipkan buat Harissa dan Faiz amat
                bermakna buat kami sekeluarga.
              </p>

              {wishes.length > 0 ? (
                <GardenReveal className={styles["wishes-list"]}>
                  <WeddingWishes
                    wishes={wishes}
                    fontClassName={titleFont.className}
                  />
                </GardenReveal>
              ) : (
                <GardenReveal className="stationery-panel mx-auto max-w-xl px-5 py-6 text-center">
                  <Quote
                    className="mx-auto h-8 w-8 text-[#607a60]"
                    aria-hidden="true"
                  />
                  <p
                    className={`${titleFont.className} mt-4 text-2xl text-[#3e5949]`}
                  >
                    Belum ada ucapan dititipkan.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6f786f]">
                    Ucapan daripada borang RSVP akan dipaparkan di sini.
                  </p>
                </GardenReveal>
              )}
            </div>
          </section>

          {showGifts && (
            <section
              id="hadiah"
              className="relative scroll-mt-6 overflow-hidden px-6 py-24"
            >
              <div className="relative mx-auto max-w-3xl">
                <SectionTitle eyebrow="Dari hati, buat yang dirai">
                  Tanda Kasih
                </SectionTitle>
                <p
                  className={`${styles["section-intro"]} mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[#6f786f]`}
                >
                  Kehadiran dan doa restu anda sudah cukup bermakna. Senarai
                  hadiah ini disediakan untuk membantu tetamu mengelakkan
                  pembelian hadiah yang sama. Jika ingin menitipkan hadiah,
                  semak senarai dan tandakan pilihan anda sebelum membeli.
                </p>
                <GardenReveal>
                  <div className={registryStyles.preview}>
                    {regularGifts.slice(0, 3).map((product) => (
                      <Link
                        key={product.slug}
                        href={{
                          pathname: registryPath,
                          query: { mode, gift: product.slug },
                        }}
                        className={registryStyles["preview-card"]}
                        aria-label={product.name}
                      >
                        <div className={registryStyles["image-wrap"]}>
                          <RegistryProductImage product={product} />
                        </div>
                        <span className={titleFont.className}>
                          {product.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className={registryStyles["preview-action"]}>
                    <Link
                      href={{ pathname: registryPath, query: { mode } }}
                      className={registryStyles.primary}
                    >
                      Lihat semua hadiah <ArrowRight aria-hidden="true" />
                    </Link>
                    <p>
                      {regularGifts.length} pilihan · Semak dan pilih hadiah di
                      senarai penuh
                    </p>
                  </div>
                </GardenReveal>
              </div>
            </section>
          )}

          {showSalam && (
            <section
              id="salam-kaut"
              className="stationery-section garden-stationery-section relative scroll-mt-6 overflow-hidden border-y border-[#a79a78]/20 bg-[#eef0e8] px-6 py-24 text-[#3e5949]"
            >
              <div className="relative">
                <SectionTitle eyebrow="Tanda ingatan buat pengantin" light>
                  Salam Kaut
                </SectionTitle>
                <GardenReveal className="stationery-panel mx-auto max-w-xl p-7 text-center sm:p-10">
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fffdf8] text-[#3e5949]">
                    <QrCode className="h-10 w-10" />
                  </span>
                  <h3
                    className={`${titleFont.className} mt-6 text-4xl font-medium text-[#496851]`}
                  >
                    Sedikit tanda ingatan
                  </h3>
                  <p className="mt-4 leading-7 text-[#6f786f]">
                    Sekiranya tuan/puan berhasrat berkongsi rezeki buat pasangan
                    pengantin, silakan imbas kod DuitNow ini. Kehadiran dan doa
                    restu tuan/puan tetap menjadi hadiah yang paling bermakna.
                  </p>
                  <div className="mx-auto mt-7 w-full max-w-[260px] overflow-hidden rounded-sm border border-[#71866d]/15 bg-white p-3 shadow-lg shadow-[#3e5949]/10">
                    <img
                      src="/images/harissa-qr.jpeg"
                      alt="Kod QR DuitNow untuk Salam Kaut"
                      className="h-auto w-full"
                    />
                  </div>
                </GardenReveal>
              </div>
            </section>
          )}

          <section
            id="hubungi"
            aria-label="Hubungi kami"
            className="relative overflow-hidden border-t border-[#a79a78]/20 px-6 py-24"
          >
            <div className="relative mx-auto max-w-xl">
              <SectionTitle eyebrow="Kami sedia membantu">
                Hubungi kami
              </SectionTitle>
              <p
                className={`${styles["section-intro"]} mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[#6f786f]`}
              >
                Sebarang pertanyaan, sila hubungi kami melalui telefon atau
                WhatsApp.
              </p>
              <ul className={styles["contact-list"]}>
                {weddingContacts.map(({ name, phone }, index) => {
                  const internationalPhone = `60${phone.slice(1)}`;
                  return (
                    <li key={phone}>
                      <GardenReveal delay={index * 60}>
                        <div
                          className={`${styles["contact-card"]} stationery-panel`}
                        >
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium">{name}</h3>
                            <p className="mt-1 text-xs tracking-wide text-[#6f786f]">
                              {phone.slice(0, 3)} {phone.slice(3, 6)}{" "}
                              {phone.slice(6)}
                            </p>
                          </div>
                          <div className={styles["contact-actions"]}>
                            <a
                              href={`tel:+${internationalPhone}`}
                              aria-label={`Telefon ${name}`}
                              title={`Telefon ${name}`}
                            >
                              <Phone aria-hidden="true" />
                            </a>
                            <a
                              href={`https://wa.me/${internationalPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`WhatsApp ${name}`}
                              title={`WhatsApp ${name}`}
                            >
                              <MessageCircle aria-hidden="true" />
                            </a>
                          </div>
                        </div>
                      </GardenReveal>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <footer
            className={`${styles.closing} stationery-section garden-stationery-section relative border-t border-[#a79a78]/20 bg-[#eef0e8] px-6 py-20 text-center`}
          >
            <GardenReveal>
              <Ornament />
              <Heart className="mx-auto mt-2 h-5 w-5 fill-[#607a60] text-[#607a60]" />
              <p
                className={`${titleFont.className} mx-auto mt-5 max-w-3xl text-4xl font-medium text-[#3e5949]`}
              >
                Kehadiran tuan dan puan amat kami hargai dan kami dahulukan
                dengan ucapan ribuan terima kasih
              </p>
              {showHashtag ? (
                <p
                  className={`${styles["closing-hashtag"]} ${hashtagFont.className} mt-7 font-normal italic text-[#496851]`}
                >
                  #FaIzTheOneForHarissa
                </p>
              ) : (
                <div className="mt-7">
                  <Ornament />
                </div>
              )}
            </GardenReveal>
          </footer>
          {showDock && (
            <nav
              className={styles.dock}
              aria-label="Navigasi undangan"
              data-has-gifts={showGifts}
            >
              <a href="#lokasi">
                <MapPin aria-hidden="true" /> Lokasi
              </a>
              <a href="#rsvp">
                <Heart aria-hidden="true" /> RSVP
              </a>
              {showGifts && (
                <a href="#hadiah">
                  <Gift aria-hidden="true" /> Hadiah
                </a>
              )}
              <a href="#hubungi">
                <Phone aria-hidden="true" /> Hubungi
              </a>
              <button
                type="button"
                onClick={toggleMusic}
                disabled={openingSoundPlaying}
                aria-label={musicPlaying ? "Jeda muzik" : "Mainkan muzik"}
                aria-pressed={musicPlaying}
                title={musicPlaying ? "Jeda muzik" : "Mainkan muzik"}
              >
                {musicPlaying ? (
                  <Music2 aria-hidden="true" />
                ) : (
                  <VolumeX aria-hidden="true" />
                )}
              </button>
            </nav>
          )}
        </main>
      )}
    </>
  );
}
