import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import RegistryProductImage from "@/components/wedding/RegistryProductImage";
import { registryPath, registryProducts } from "@/lib/wedding/registry";
import { getInvitationMode } from "@/lib/wedding/invitationMode";
import registryStyles from "@/styles/WeddingRegistry.module.css";
import WeddingWishes from "@/components/wedding/WeddingWishes";
import { SongketWishesMotif } from "@/components/wedding/SongketThreadwork";
import GardenReveal from "@/components/wedding/GardenReveal";
import GardenButterflyFlight from "@/components/wedding/GardenButterflyFlight";
import MohorMagic from "@/components/wedding/MohorMagic";
import ClassicalSealRelease from "@/components/wedding/ClassicalSealRelease";
import BotanicalArtwork from "@/components/wedding/BotanicalArtwork";
import { useWeddingMusic } from "@/components/wedding/WeddingMusicProvider";
import styles from "@/styles/WeddingGarden.module.css";
import songketStyles from "@/styles/WeddingSongket.module.css";
import {
  SongketOrnament,
  SongketClosingFlourish,
  SongketCrest,
  SongketPaperBody,
} from "@/components/wedding/SongketArtwork";
import { WeddingInvitationDetails } from "@/lib/wedding/invitations";
import { createGateRenderer } from "@/lib/wedding/gateRenderer";
import { openingProfiles } from "@/lib/wedding/mohorOpening";
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
  CSSProperties,
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

function CoupleName({ fullName }: { fullName: string }) {
  const parts = fullName.match(/^(.+?)\s+((?:bin|binti)\s+.+)$/);
  return (
    <span data-part="couple-name" className={styles["couple-name"]}>
      {parts ? parts[1] : fullName}
      {parts && (
        <span
          data-part="couple-lineage"
          className={`${styles["couple-lineage"]} ${titleFont.className}`}
        >
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
  songket,
}: {
  onOpen: () => void;
  opening: boolean;
  revealing: boolean;
  songket: boolean;
}) {
  const coverRef = useRef<HTMLButtonElement>(null);
  const renderer = useRef(createGateRenderer());
  const openingRenderer = useRef<boolean | null>(null);
  const [alphaGates, setAlphaGates] = useState(false);
  useEffect(() => {
    if (!songket) return;
    const session = createGateRenderer();
    renderer.current = session;
    const images = Array.from(
      coverRef.current?.querySelectorAll<HTMLImageElement>(
        "[data-part='cover-leaf'] img"
      ) ?? []
    );
    const listeners = images.map((image) => {
      const loaded = () => {
        void session.prepare(image);
      };
      const failed = () => {
        session.unavailable(image);
      };
      image.addEventListener("load", loaded);
      image.addEventListener("error", failed);
      if (image.complete && image.naturalWidth > 0) loaded();
      return () => {
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
      };
    });
    return () => {
      session.dispose();
      listeners.forEach((remove) => remove());
    };
  }, [songket]);
  const activate = () => {
    if (openingRenderer.current !== null || opening) return;
    const images = Array.from(
      coverRef.current?.querySelectorAll<HTMLImageElement>(
        "[data-part='cover-leaf'] img"
      ) ?? []
    );
    const ready = songket && renderer.current.choose(images);
    // The renderer is chosen once, without waiting for the network or decoding.
    openingRenderer.current = ready;
    setAlphaGates(ready);
    onOpen();
  };
  return (
    <div
      data-part="cover-book"
      className={`${styles["cover-book"]} ${opening ? styles.enchanting : ""} ${
        revealing ? styles.opening : ""
      } mx-auto w-full`}
    >
      <button
        ref={coverRef}
        type="button"
        onClick={activate}
        disabled={opening}
        aria-busy={opening}
        data-opening={opening}
        data-revealing={revealing}
        className={`${styles.envelope} sealed-invitation group relative block w-full text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--wedding-rgb-607a60))] focus-visible:ring-offset-4 focus-visible:ring-offset-[rgb(var(--wedding-rgb-e4e9df))]`}
        data-part="envelope"
        data-gates-ready={alphaGates}
        aria-label={
          songket
            ? "Buka undangan perkahwinan Muhammad Faiz dan Harissa Amani"
            : "Buka undangan perkahwinan Harissa Amani dan Muhammad Faiz"
        }
      >
        {songket && (
          <span className={songketStyles["cover-lining"]} aria-hidden="true" />
        )}
        <span
          data-part="cover-leaf"
          data-side="left"
          className={`${styles["cover-leaf"]} ${styles["leaf-left"]}`}
          aria-hidden="true"
        >
          {songket && (
            <img
              src="/images/songket-gate-left-v1.webp"
              width={1038}
              height={1516}
              alt=""
              {...{ fetchpriority: "low" }}
            />
          )}
        </span>
        <span
          data-part="cover-leaf"
          data-side="right"
          className={`${styles["cover-leaf"]} ${styles["leaf-right"]}`}
          aria-hidden="true"
        >
          {songket && (
            <img
              src="/images/songket-gate-right-v1.webp"
              width={1038}
              height={1516}
              alt=""
              {...{ fetchpriority: "low" }}
            />
          )}
        </span>

        {!songket && (
          <Butterfly className="absolute right-[6%] top-[39%] w-20 -rotate-[22deg] sm:w-24" />
        )}
        <span
          data-part="seal"
          className={`${styles.seal} wax-seal absolute left-1/2 top-1/2 z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center transition duration-300 group-hover:scale-105`}
          aria-hidden="true"
        >
          <img
            src={
              songket
                ? "/images/wax-seal-fh-burgundy-v2.webp"
                : "/images/wax-seal-fh-v1.png"
            }
            width={256}
            height={256}
            alt=""
            className="wax-seal-image h-full w-full object-cover"
          />
        </span>
        {opening && songket && <ClassicalSealRelease />}
        {opening && !songket && <MohorMagic fading={revealing} />}
      </button>
      <p
        data-part="cover-hint"
        className={`${styles["cover-hint"]} ${
          songket ? "" : namesFont.className
        } mt-6 text-[rgb(var(--wedding-rgb-536858))]`}
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
  songket = false,
  wishes = false,
}: {
  eyebrow: string;
  children: ReactNode;
  light?: boolean;
  songket?: boolean;
  wishes?: boolean;
}) {
  return (
    <GardenReveal
      dataPart="section-title"
      enabled={!songket || !wishes}
      className={`${styles["section-title"]} mx-auto mb-10 max-w-xl text-center`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.34em] ${
          light
            ? "text-[rgb(var(--wedding-rgb-496851))]"
            : "text-[rgb(var(--wedding-rgb-71866d))]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`${titleFont.className} mt-3 text-4xl font-medium tracking-wide text-[rgb(var(--wedding-rgb-3e5949))] sm:text-5xl`}
      >
        {children}
      </h2>
      {songket ? (
        wishes ? (
          <SongketWishesMotif />
        ) : (
          <SongketOrnament />
        )
      ) : (
        <Ornament />
      )}
    </GardenReveal>
  );
}

export default function WeddingInvitation({
  wedding,
}: {
  wedding: WeddingInvitationDetails;
}) {
  const songket = wedding.theme === "songket";
  const child = wedding.side === "groom" ? "putera" : "puteri";
  const firstName =
    wedding.side === "groom" ? wedding.groomFullName : wedding.brideFullName;
  const secondName =
    wedding.side === "groom" ? wedding.brideFullName : wedding.groomFullName;
  const couple =
    wedding.side === "groom"
      ? `${wedding.groom} & ${wedding.bride}`
      : `${wedding.bride} & ${wedding.groom}`;
  const router = useRouter();
  const mode = getInvitationMode(router.query.mode);
  const registryQuery = {
    mode,
    ...(wedding.side === "groom" ? { invitation: "groom" } : {}),
  };
  const showGifts =
    router.isReady && mode !== "family" && mode !== "sekeluarga";
  const showHashtag = router.isReady && mode === "friend";
  const regularGifts = registryProducts.filter(
    (product) => !product.contribution
  );
  const [showSalam, setShowSalam] = useState(
    router.isReady && router.query.salam === "1"
  );
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
  const [wishesStatus, setWishesStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [backendError, setBackendError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const openingCleanup = useRef<(() => void) | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  const invitationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!songket || !opening || invitationOpened) return;
    // The invitation is already rendered beneath the opening cover.
    const invitation = invitationRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    invitation?.setAttribute("inert", "");
    return () => {
      document.body.style.overflow = previousOverflow;
      invitation?.removeAttribute("inert");
    };
  }, [songket, opening, invitationOpened]);

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
            setWishesStatus("ready");
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
            if (source === "wishes") setWishesStatus("error");
            failed = true;
            setBackendReady(false);
            setBackendError(
              "Tidak dapat memuatkan data. Sila muat semula halaman dan cuba lagi."
            );
          },
          wedding.eventId
        );
      })
      .catch((error) => {
        if (disposed) return;
        setWishesStatus("error");
        console.error("[Wedding Firebase] Connection failed", error);
        setBackendError(
          "Tidak dapat menyambung. Sila muat semula halaman dan cuba lagi."
        );
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [setInvitationOpened, wedding.eventId]);

  const countdown = useMemo(() => {
    if (now === null) return { hari: "—", jam: "—", minit: "—" };
    const distance = Math.max(0, wedding.date.getTime() - now);
    return {
      hari: Math.floor(distance / 86_400_000),
      jam: Math.floor((distance / 3_600_000) % 24),
      minit: Math.floor((distance / 60_000) % 60),
    };
  }, [now, wedding.date]);

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
      await saveRsvp(form, wedding.eventId);
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

  const countdownPanel = (
    <div
      ref={countdownRef}
      data-part="countdown"
      className={`${styles.countdown} mx-auto grid grid-cols-3`}
    >
      {songket && now !== null && now >= wedding.date.getTime() ? (
        <p role="status" className="col-span-3 text-center">
          {now < wedding.date.getTime() + 86400000
            ? "Hari yang dinanti telah tiba."
            : "Terima kasih atas doa dan ingatan buat kami."}
        </p>
      ) : (
        [
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
              className={`${titleFont.className} block text-6xl font-medium text-[rgb(var(--wedding-rgb-496851))]`}
            >
              {value}
            </strong>
            <span className="mt-2 block text-xs uppercase tracking-[0.25em] text-[rgb(var(--wedding-rgb-6e7b70))]">
              {label}
            </span>
          </GardenReveal>
        ))
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>{`${couple} — Undangan Walimatulurus`}</title>
        <meta
          name="description"
          content={`Dengan penuh kesyukuran, ${wedding.hosts} menjemput anda ke majlis perkahwinan ${child} mereka, ${firstName}, bersama ${secondName} pada ${wedding.dateLabel}.`}
        />
        <meta name="theme-color" content={songket ? "#411924" : "#e4e9df"} />
        <link
          rel="preload"
          as="image"
          href={
            songket
              ? "/images/songket-closed-composite-v4.webp"
              : "/images/gatefold-cover-garden-v1.webp"
          }
        />
      </Head>

      {!invitationOpened && (
        <main
          data-invitation-stage="cover"
          data-opening={opening}
          data-revealing={revealing}
          style={
            songket
              ? ({
                  "--seal-release-duration": `${openingProfiles.classical.revealDelay}ms`,
                  "--gate-opening-duration": `${openingProfiles.classical.openingDuration}ms`,
                } as CSSProperties)
              : undefined
          }
          className={`${styles.cover} ${
            songket ? songketStyles.theme : ""
          } relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-center text-[rgb(var(--wedding-rgb-3e5949))] sm:px-8 sm:py-14`}
        >
          <div
            className={`${styles["cover-content"]} relative z-10 mx-auto w-full max-w-xl`}
          >
            <p
              data-part="cover-label"
              className={`${styles["cover-label"]} ${
                songket ? titleFont.className : namesFont.className
              } mb-7 text-[rgb(var(--wedding-rgb-536858))]`}
            >
              Jemputan ke Walimatulurus
            </p>
            <InvitationCoverArtwork
              onOpen={openInvitation}
              opening={opening}
              revealing={revealing}
              songket={songket}
            />
            <p
              data-part="cover-date"
              className={`${titleFont.className} mt-7 text-sm tracking-[0.3em] text-[rgb(var(--wedding-rgb-8e7956))]`}
            >
              {wedding.coverDate}
            </p>
          </div>
        </main>
      )}
      {(invitationOpened || (songket && opening)) && (
        <main
          ref={invitationRef}
          tabIndex={-1}
          aria-label={`Undangan perkahwinan ${couple}`}
          aria-hidden={!invitationOpened || undefined}
          data-invitation-stage="content"
          data-opened={invitationOpened}
          className={`${styles.page} ${
            songket ? songketStyles.theme : ""
          } english-invitation-enter english-wedding-paper garden-english-wedding-paper min-h-screen bg-[rgb(var(--wedding-rgb-fffdf8))] text-[rgb(var(--wedding-rgb-3e5949))] antialiased selection:bg-[rgb(var(--wedding-rgb-eacfdc))] focus:outline-none`}
        >
          <div
            ref={progressRef}
            className={styles.progress}
            aria-hidden="true"
          />
          <section
            data-part="hero"
            className={`${styles.hero} relative grid min-h-screen place-items-center overflow-x-hidden px-5 text-center sm:px-8`}
          >
            <div
              data-part="hero-card"
              className={`${styles["hero-card"]} english-invitation-card garden-english-invitation-card relative z-10 mx-auto w-full px-7 pb-28 pt-32 sm:px-16 sm:pb-36 sm:pt-44`}
            >
              {songket ? (
                <SongketCrest edge="top" opened={invitationOpened} />
              ) : (
                <>
                  <BotanicalArtwork />
                  <Butterfly className="garden-butterfly-accent right-[18%] top-[5%] w-20 rotate-[18deg] sm:w-24" />
                </>
              )}
              {songket && invitationOpened && !showDock && (
                <button
                  type="button"
                  data-part="early-music"
                  onClick={toggleMusic}
                  aria-pressed={musicPlaying}
                  aria-label={musicPlaying ? "Jeda muzik" : "Mainkan muzik"}
                  title={musicPlaying ? "Jeda muzik" : "Mainkan muzik"}
                  className={songketStyles["early-music"]}
                >
                  {musicPlaying ? (
                    <Music2 aria-hidden="true" />
                  ) : (
                    <VolumeX aria-hidden="true" />
                  )}
                </button>
              )}
              <SongketPaperBody enabled={songket}>
                <GardenReveal enabled={!songket || invitationOpened}>
                  <p
                    className={`${styles["hero-label"]} font-semibold uppercase text-[rgb(var(--wedding-rgb-8e7956))]`}
                  >
                    Walimatulurus
                  </p>
                </GardenReveal>
                <GardenReveal
                  delay={0}
                  enabled={!songket || invitationOpened}
                  className={styles["hero-copy"]}
                >
                  <p
                    className={`${styles["hero-blessing"]} font-serif italic text-[rgb(var(--wedding-rgb-68776d))]`}
                    lang="ar"
                    dir="rtl"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                  </p>
                  <p
                    data-part="invitation-prose"
                    className={`${songket ? titleFont.className : ""} ${
                      styles["hero-invitation"]
                    } mx-auto mt-6 max-w-lg text-[rgb(var(--wedding-rgb-68776d))]`}
                  >
                    Dengan penuh kesyukuran ke hadrat Allah SWT, kami
                  </p>
                  <p
                    data-part="hosts"
                    className={`${styles["hero-hosts"]} ${titleFont.className} mt-2 font-medium text-[rgb(var(--wedding-rgb-496851))]`}
                  >
                    {wedding.hosts.split(" & ").map((host, index) => (
                      <span key={host} className={styles["host-name"]}>
                        {index > 0 && (
                          <span className={styles["host-separator"]}>
                            &amp;
                          </span>
                        )}
                        {host}
                      </span>
                    ))}
                  </p>
                  <p
                    data-part="invitation-prose"
                    className={`${songket ? titleFont.className : ""} ${
                      styles["hero-invitation"]
                    } mx-auto mt-5 max-w-lg text-[rgb(var(--wedding-rgb-68776d))]`}
                  >
                    dengan segala hormatnya menjemput Dato&apos; / Datin / Tuan
                    / Puan / Encik / Cik bersama{" "}
                    {mode === "sekeluarga" ? "keluarga" : "pasangan"} ke majlis
                    perkahwinan {child} kami
                  </p>
                </GardenReveal>
                <GardenReveal
                  delay={100}
                  enabled={!songket || invitationOpened}
                >
                  {songket ? (
                    <h1
                      data-part="couple-names"
                      className={coupleNamesFont.className}
                    >
                      <CoupleName fullName={firstName} />
                      <span
                        className={`${songketStyles.connector} ${titleFont.className}`}
                      >
                        {" dan "}
                      </span>
                      <CoupleName fullName={secondName} />
                    </h1>
                  ) : (
                    <h1
                      className={`${coupleNamesFont.className} font-normal focus:outline-none`}
                    >
                      <CoupleName fullName={firstName} />
                      <span
                        className={`${styles["couple-connector"]} ${namesFont.className} mx-auto block font-normal italic text-[rgb(var(--wedding-rgb-9b8b65))]`}
                      >
                        dan pilihan hatinya
                      </span>
                      <CoupleName fullName={secondName} />
                    </h1>
                  )}
                  {songket ? <SongketOrnament /> : <Ornament />}
                  <p
                    data-part="hero-date"
                    className={`${styles["hero-date"]} ${titleFont.className}`}
                  >
                    {wedding.heroDate}
                  </p>
                  <p
                    data-part="hero-venue"
                    className={`${styles["hero-venue"]} ${
                      songket ? titleFont.className : ""
                    }`}
                  >
                    {wedding.venue}
                  </p>
                  {songket && (
                    <p data-part="hero-time" className={titleFont.className}>
                      {wedding.timeLabel}
                    </p>
                  )}
                </GardenReveal>
                <div>
                  <GardenReveal
                    delay={200}
                    enabled={!songket || invitationOpened}
                  >
                    <div
                      data-part="hero-links"
                      className={`${styles["hero-links"]} mt-7 flex flex-wrap justify-center gap-3`}
                    >
                      <a
                        href="#lokasi"
                        className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--wedding-rgb-71866d))]/25 bg-[rgb(var(--wedding-rgb-fffdf8))]/80 px-5 py-3 text-sm font-semibold text-[rgb(var(--wedding-rgb-3e5949))] shadow-sm transition hover:-translate-y-0.5 hover:border-[rgb(var(--wedding-rgb-607a60))]"
                      >
                        <MapPin className="h-4 w-4" /> Lokasi
                      </a>
                      <a
                        href="#rsvp"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--wedding-rgb-4c6b55))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[rgb(var(--wedding-rgb-3e5949))]"
                      >
                        <Heart className="h-4 w-4" /> RSVP
                      </a>
                      {showGifts && (
                        <a
                          href="#hadiah"
                          className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--wedding-rgb-3e5949))]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[rgb(var(--wedding-rgb-3e5949))] shadow-sm transition hover:-translate-y-0.5 hover:border-[rgb(var(--wedding-rgb-607a60))]"
                        >
                          <Gift className="h-4 w-4" /> Hadiah
                        </a>
                      )}
                      {showSalam && (
                        <a
                          href="#salam-kaut"
                          className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--wedding-rgb-607a60))]/30 bg-[rgb(var(--wedding-rgb-607a60))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[rgb(var(--wedding-rgb-4f7058))]"
                        >
                          <QrCode className="h-4 w-4" /> Salam Kaut
                        </a>
                      )}
                    </div>
                  </GardenReveal>
                  {!songket && (
                    <div
                      data-part="hero-schedule"
                      className={`${styles["hero-schedule"]} ${titleFont.className} mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[rgb(var(--wedding-rgb-3e5949))]`}
                    >
                      {!songket && <span>{wedding.dateLabel}</span>}
                      {!songket && (
                        <span className="hidden h-1 w-1 rounded-full bg-[rgb(var(--wedding-rgb-607a60))] sm:block" />
                      )}
                      <span>{wedding.timeLabel}</span>
                    </div>
                  )}
                  <div>
                    <a
                      href="#butiran"
                      data-part="scroll-cue"
                      className={`${styles["scroll-cue"]} mx-auto mt-9 grid h-12 w-12 place-items-center rounded-full border border-[rgb(var(--wedding-rgb-a48b60))]/40 text-[rgb(var(--wedding-rgb-8e7956))] transition hover:-translate-y-1 hover:bg-white/60`}
                      aria-label="Lihat butiran majlis"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </SongketPaperBody>
              {songket && (
                <SongketCrest edge="bottom" opened={invitationOpened} />
              )}
            </div>
          </section>

          {songket ? (
            <section data-part="quotation">
              <GardenReveal className={songketStyles["quotation-inner"]}>
                <blockquote className={titleFont.className}>
                  &ldquo;Dan Kami menciptakan kamu berpasang-pasangan.&rdquo;
                  <cite>Surah An-Naba · 78:8</cite>
                </blockquote>
              </GardenReveal>
            </section>
          ) : (
            <GardenReveal className={styles.interlude} dataPart="quotation">
              <blockquote className={titleFont.className}>
                &ldquo;Dan Kami menciptakan kamu berpasang-pasangan.&rdquo;
                <cite>Surah An-Naba · 78:8</cite>
              </blockquote>
            </GardenReveal>
          )}

          <section
            id="butiran"
            className="stationery-section garden-stationery-section relative overflow-hidden border-y border-[rgb(var(--wedding-rgb-a79a78))]/20 bg-[rgb(var(--wedding-rgb-eef0e8))] px-6 py-24 text-[rgb(var(--wedding-rgb-3e5949))]"
          >
            <div className="relative">
              <SectionTitle
                songket={songket}
                eyebrow="Dengan segala hormatnya"
                light
              >
                Majlis perkahwinan {child} kami
              </SectionTitle>
              {!songket && countdownPanel}
              <div
                data-part="event-grid"
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
                      data-part="event-detail"
                      className={`${styles["detail-card"]} stationery-panel flex items-center gap-4 text-[rgb(var(--wedding-rgb-3e5949))]`}
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgb(var(--wedding-rgb-e3e9de))]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-medium">{label}</span>
                    </div>
                  </GardenReveal>
                ))}
              </div>
              {songket && countdownPanel}
              <div
                data-part="calendar-action"
                className={`${styles["calendar-action"]} mt-8 text-center`}
              >
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    `Majlis Perkahwinan ${wedding.bride} & ${wedding.groom}`
                  )}&dates=${
                    wedding.calendarDates
                  }&ctz=Asia%2FKuala_Lumpur&location=${encodeURIComponent(
                    wedding.venue
                  )}&details=${encodeURIComponent(
                    `Dengan penuh kesyukuran, ${wedding.hosts} menjemput tuan/puan ke majlis perkahwinan ${child} mereka, ${firstName}, bersama ${secondName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--wedding-rgb-4c6b55))] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[rgb(var(--wedding-rgb-3e5949))]/10 transition hover:-translate-y-0.5 hover:bg-[rgb(var(--wedding-rgb-3e5949))]"
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
              <SectionTitle
                songket={songket}
                eyebrow="Tempat berlangsungnya majlis"
              >
                Kami menanti kehadiran tuan dan puan
              </SectionTitle>
              <GardenReveal direction="left" className="mx-auto max-w-4xl">
                <div
                  data-part="venue-card"
                  className={`${styles["venue-card"]} stationery-panel`}
                >
                  <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <MapPin className="h-9 w-9 text-[rgb(var(--wedding-rgb-607a60))]" />
                      <h3
                        className={`${titleFont.className} mt-4 text-4xl font-medium text-[rgb(var(--wedding-rgb-3e5949))]`}
                      >
                        {wedding.venue}
                      </h3>
                      <p className="mt-3 max-w-lg leading-7 text-[rgb(var(--wedding-rgb-6f786f))]">
                        Kami sekeluarga berbesar hati menyambut kehadiran
                        tuan/puan. Pilih aplikasi navigasi untuk mendapatkan
                        arah ke lokasi majlis.
                      </p>
                    </div>
                    <div className={`${styles["map-links"]} grid gap-3`}>
                      {maps.map((map) => (
                        <a
                          key={map.name}
                          href={map.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-[190px] items-center justify-between rounded-full border border-[rgb(var(--wedding-rgb-3e5949))]/15 bg-white px-5 py-3 font-medium transition hover:-translate-y-0.5 hover:border-[rgb(var(--wedding-rgb-607a60))]"
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
            className={`${styles["rsvp-section"]} english-wedding-blush garden-english-wedding-blush stationery-section garden-stationery-section relative scroll-mt-6 overflow-hidden border-y border-[rgb(var(--wedding-rgb-a79a78))]/20 bg-[rgb(var(--wedding-rgb-eef0e8))] px-6 py-24`}
          >
            <div className="relative">
              <SectionTitle songket={songket} eyebrow="Mohon maklum balas">
                Khabarkan kehadiran tuan dan puan
              </SectionTitle>
              <p
                data-part="section-intro"
                className={`${styles["section-intro"]} mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[rgb(var(--wedding-rgb-6f786f))]`}
              >
                {wedding.rsvpDeadline
                  ? `Bagi membantu kami membuat persiapan, mohon sahkan kehadiran anda sebelum ${wedding.rsvpDeadline}.`
                  : "Mohon sahkan kehadiran anda bagi membantu persiapan majlis."}
              </p>
              <GardenReveal className="mx-auto max-w-2xl">
                <form
                  onSubmit={submitRsvp}
                  data-part="rsvp-form"
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
                      className="rounded-sm border-[rgb(var(--wedding-rgb-3e5949))]/15 bg-white focus:border-[rgb(var(--wedding-rgb-607a60))] focus:ring-[rgb(var(--wedding-rgb-607a60))]"
                    />
                  </label>
                  <label
                    className={`${styles["rsvp-guests"]} grid gap-2 text-sm font-semibold`}
                  >
                    Jumlah tetamu
                    <select
                      name="tetamu"
                      className="rounded-sm border-[rgb(var(--wedding-rgb-3e5949))]/15 bg-white focus:border-[rgb(var(--wedding-rgb-607a60))] focus:ring-[rgb(var(--wedding-rgb-607a60))]"
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
                            className="flex cursor-pointer items-center gap-3 rounded-sm border border-[rgb(var(--wedding-rgb-3e5949))]/15 bg-white p-4 text-sm"
                          >
                            <input
                              type="radio"
                              name="kehadiran"
                              value={answer}
                              required
                              defaultChecked={index === 0}
                              className="text-[rgb(var(--wedding-rgb-607a60))] focus:ring-[rgb(var(--wedding-rgb-607a60))]"
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
                      className="rounded-sm border-[rgb(var(--wedding-rgb-3e5949))]/15 bg-white focus:border-[rgb(var(--wedding-rgb-607a60))] focus:ring-[rgb(var(--wedding-rgb-607a60))]"
                    />
                    <span
                      id="wish-character-count"
                      className="text-right text-xs font-normal text-[rgb(var(--wedding-rgb-6f786f))]"
                    >
                      {wishLength}/{WISH_CHARACTER_LIMIT} aksara
                    </span>
                  </label>
                  <p className="text-xs text-[rgb(var(--wedding-rgb-6f786f))]">
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
                    className="mt-2 rounded-full bg-[rgb(var(--wedding-rgb-3e5949))] px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[rgb(var(--wedding-rgb-4c6b55))]"
                  >
                    {saving ? "Sedang menyimpan..." : "Hantar RSVP"}
                  </button>
                  {rsvpSent && (
                    <p
                      role="status"
                      className="text-center text-sm font-medium text-[rgb(var(--wedding-rgb-637d6d))]"
                    >
                      Terima kasih. Maklum balas tuan/puan telah kami terima.
                    </p>
                  )}
                </form>
              </GardenReveal>
            </div>
          </section>

          <section
            id="ucapan"
            className={`${styles["wishes-section"]} relative scroll-mt-6 overflow-hidden border-b border-[rgb(var(--wedding-rgb-a79a78))]/25 bg-[rgb(var(--wedding-rgb-fffdf8))]/70 px-6`}
          >
            {!songket && (
              <GardenButterflyFlight>
                <Butterfly />
              </GardenButterflyFlight>
            )}
            <div
              className={`${styles["wishes-content"]} relative mx-auto max-w-5xl`}
            >
              <SectionTitle
                songket={songket}
                wishes
                eyebrow="Titipan buat pengantin"
              >
                Ucapan dan doa
              </SectionTitle>
              <p
                data-part="section-intro"
                className={`${styles["section-intro"]} mx-auto -mt-6 mb-10 max-w-xl text-center leading-7 text-[rgb(var(--wedding-rgb-6f786f))]`}
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
                    className="mx-auto h-8 w-8 text-[rgb(var(--wedding-rgb-607a60))]"
                    aria-hidden="true"
                  />
                  <p
                    className={`${titleFont.className} mt-4 text-2xl text-[rgb(var(--wedding-rgb-3e5949))]`}
                  >
                    {wishesStatus === "loading"
                      ? "Sedang memuatkan ucapan…"
                      : wishesStatus === "error"
                      ? "Ucapan belum dapat dimuatkan."
                      : "Belum ada ucapan dititipkan."}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--wedding-rgb-6f786f))]">
                    {wishesStatus === "error"
                      ? "Sila muat semula halaman untuk mencuba lagi."
                      : "Ucapan daripada borang RSVP akan dipaparkan di sini."}
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
                <SectionTitle
                  songket={songket}
                  eyebrow="Dari hati, buat yang dirai"
                >
                  Tanda Kasih
                </SectionTitle>
                <p
                  data-part="section-intro"
                  className={`${styles["section-intro"]} mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[rgb(var(--wedding-rgb-6f786f))]`}
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
                          query: { ...registryQuery, gift: product.slug },
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
                      href={{ pathname: registryPath, query: registryQuery }}
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
              className="stationery-section garden-stationery-section relative scroll-mt-6 overflow-hidden border-y border-[rgb(var(--wedding-rgb-a79a78))]/20 bg-[rgb(var(--wedding-rgb-eef0e8))] px-6 py-24 text-[rgb(var(--wedding-rgb-3e5949))]"
            >
              <div className="relative">
                <SectionTitle
                  songket={songket}
                  eyebrow="Tanda ingatan buat pengantin"
                  light
                >
                  Salam Kaut
                </SectionTitle>
                <GardenReveal className="stationery-panel mx-auto max-w-xl p-7 text-center sm:p-10">
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[rgb(var(--wedding-rgb-fffdf8))] text-[rgb(var(--wedding-rgb-3e5949))]">
                    <QrCode className="h-10 w-10" />
                  </span>
                  <h3
                    className={`${titleFont.className} mt-6 text-4xl font-medium text-[rgb(var(--wedding-rgb-496851))]`}
                  >
                    Sedikit tanda ingatan
                  </h3>
                  <p className="mt-4 leading-7 text-[rgb(var(--wedding-rgb-6f786f))]">
                    Sekiranya tuan/puan berhasrat berkongsi rezeki buat pasangan
                    pengantin, silakan imbas kod DuitNow ini. Kehadiran dan doa
                    restu tuan/puan tetap menjadi hadiah yang paling bermakna.
                  </p>
                  <div className="mx-auto mt-7 w-full max-w-[260px] overflow-hidden rounded-sm border border-[rgb(var(--wedding-rgb-71866d))]/15 bg-white p-3 shadow-lg shadow-[rgb(var(--wedding-rgb-3e5949))]/10">
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

          {wedding.contacts.length > 0 && (
            <section
              id="hubungi"
              aria-label="Hubungi kami"
              className="relative overflow-hidden border-t border-[rgb(var(--wedding-rgb-a79a78))]/20 px-6 py-24"
            >
              <div className="relative mx-auto max-w-xl">
                <SectionTitle songket={songket} eyebrow="Kami sedia membantu">
                  Hubungi kami
                </SectionTitle>
                <p
                  data-part="section-intro"
                  className={`${styles["section-intro"]} mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[rgb(var(--wedding-rgb-6f786f))]`}
                >
                  Sebarang pertanyaan, sila hubungi kami melalui telefon atau
                  WhatsApp.
                </p>
                <ul className={styles["contact-list"]}>
                  {wedding.contacts.map(({ name, phone }, index) => {
                    const internationalPhone = `60${phone.slice(1)}`;
                    return (
                      <li key={phone}>
                        <GardenReveal delay={index * 60}>
                          <div
                            data-part="contact-card"
                            className={`${styles["contact-card"]} stationery-panel`}
                          >
                            <div className="min-w-0">
                              <h3 className="text-sm font-medium">{name}</h3>
                              <p className="mt-1 text-xs tracking-wide text-[rgb(var(--wedding-rgb-6f786f))]">
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
          )}

          <footer
            data-part="closing"
            className={`${styles.closing} stationery-section garden-stationery-section relative border-t border-[rgb(var(--wedding-rgb-a79a78))]/20 bg-[rgb(var(--wedding-rgb-eef0e8))] px-6 py-20 text-center`}
          >
            <GardenReveal>
              {songket ? <SongketClosingFlourish /> : <Ornament />}
              {!songket && (
                <Heart className="mx-auto mt-2 h-5 w-5 fill-[rgb(var(--wedding-rgb-607a60))] text-[rgb(var(--wedding-rgb-607a60))]" />
              )}
              <p
                className={`${titleFont.className} mx-auto mt-5 max-w-3xl text-4xl font-medium text-[rgb(var(--wedding-rgb-3e5949))]`}
              >
                Kehadiran tuan dan puan amat kami hargai dan didahului dengan
                ucapan ribuan terima kasih
              </p>
              {showHashtag ? (
                <p
                  className={`${styles["closing-hashtag"]} ${
                    songket ? titleFont.className : hashtagFont.className
                  } mt-7 font-normal italic text-[rgb(var(--wedding-rgb-496851))]`}
                >
                  #FaIzTheOneForHarissa
                </p>
              ) : (
                <div className="mt-7">{!songket && <Ornament />}</div>
              )}
            </GardenReveal>
          </footer>
          {showDock && (
            <nav
              data-part="dock"
              className={styles.dock}
              aria-label="Navigasi undangan"
              data-has-gifts={showGifts}
              data-has-contacts={wedding.contacts.length > 0}
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
              {wedding.contacts.length > 0 && (
                <a href="#hubungi">
                  <Phone aria-hidden="true" /> Hubungi
                </a>
              )}
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
