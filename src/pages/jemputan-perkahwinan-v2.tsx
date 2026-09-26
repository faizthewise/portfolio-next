import Head from "next/head";
import { getWeddingGuest } from "@/lib/wedding/firebase";
import { GiftItem, WeddingWish, initialGifts, subscribeWedding, saveRsvp, reserveGift, createGift, recordContribution } from "@/lib/wedding/data";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Gift,
  Heart,
  MapPin,
  Plus,
  QrCode,
  Quote,
  Sparkles,
  X,
} from "lucide-react";

const titleFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const namesFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const wedding = {
  bride: "Harissa",
  groom: "Faiz",
  brideFullName: "Harissa Amani",
  groomFullName: "Muhammad Faiz",
  date: new Date("2026-11-28T11:30:00+08:00"),
  dateLabel: "Sabtu, 28 November 2026",
  timeLabel: "11.30 pagi",
  venue: "LeQAMR Melaka",
  mapQuery: "LeQAMR Melaka",
  hosts: "Ts. Razak & Dr Rina",
};

const formatRinggit = (amount: number) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(amount);

function GardenFlower({ x, y, scale = 1, rotation = 0, color = "#fffdf8" }: { x: number; y: number; scale?: number; rotation?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      <ellipse cx="0" cy="-11" rx="7" ry="12" fill={color} stroke="#ab9d86" strokeWidth="1" />
      <ellipse cx="10.5" cy="-3.5" rx="7" ry="12" transform="rotate(72 10.5 -3.5)" fill={color} stroke="#ab9d86" strokeWidth="1" />
      <ellipse cx="6.5" cy="9" rx="7" ry="12" transform="rotate(144 6.5 9)" fill={color} stroke="#ab9d86" strokeWidth="1" />
      <ellipse cx="-6.5" cy="9" rx="7" ry="12" transform="rotate(216 -6.5 9)" fill={color} stroke="#ab9d86" strokeWidth="1" />
      <ellipse cx="-10.5" cy="-3.5" rx="7" ry="12" transform="rotate(288 -10.5 -3.5)" fill={color} stroke="#ab9d86" strokeWidth="1" />
      <circle r="5.2" fill="#d1af63" />
      <circle r="2" fill="#8f7440" />
    </g>
  );
}

function Butterfly({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 64" aria-hidden="true" focusable="false" className={`pointer-events-none drop-shadow-[0_3px_3px_rgba(119,88,49,0.22)] ${className}`}>
      <g fill="#eacfdc" fillOpacity=".95" stroke="#99703c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M39 32C30 13 10 3 5 8C0 16 9 34 30 38C13 33 9 43 17 53C25 61 36 48 39 35Z" />
        <path fill="#ded3ee" d="M41 32C50 13 70 3 75 8C80 16 71 34 50 38C67 33 71 43 63 53C55 61 44 48 41 35Z" />
        <g fill="none" strokeOpacity=".8" strokeWidth=".85">
          <path d="M38 33L9 12M36 34L10 24M37 36L21 50M42 33L71 12M44 34L70 24M43 36L59 50" />
          <path d="M14 14Q17 27 31 32M66 14Q63 27 49 32M22 40L25 48M58 40L55 48" />
        </g>
        <path d="M40 26C38 32 39 43 40 46C41 43 42 32 40 26ZM39 27Q32 15 29 18M41 27Q48 15 51 18" fill="none" />
      </g>
    </svg>
  );
}

function Ornament() {
  return (
    <svg viewBox="0 0 260 80" aria-hidden="true" className="mx-auto h-16 w-56">
      <path d="M20 48c40 0 54-21 87-13M240 48c-40 0-54-21-87-13" fill="none" stroke="#6e896b" strokeWidth="1.4" />
      <path d="M68 39c-12-14-25-11-29-2 13-3 22 0 29 2Zm31-7c-5-15-17-20-26-13 12 3 19 8 26 13Zm93 7c12-14 25-11 29-2-13-3-22 0-29 2Zm-31-7c5-15 17-20 26-13-12 3-19 8-26 13Z" fill="#6e896b" opacity=".82" />
      <GardenFlower color="#e8c7d3" x={108} y={37} scale={0.72} rotation={-12} />
      <GardenFlower color="#ddd4ed" x={130} y={32} scale={0.92} rotation={8} />
      <GardenFlower color="#cfdeeb" x={153} y={38} scale={0.68} rotation={24} />
      <path d="M112 62h36" stroke="#a79a78" strokeWidth="1.4" />
      <circle cx="104" cy="62" r="2" fill="#a79a78" />
      <circle cx="156" cy="62" r="2" fill="#a79a78" />
    </svg>
  );
}

function InvitationCoverArtwork({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <button
        type="button"
        onClick={onOpen}
        className="sealed-invitation group relative block w-full overflow-hidden text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#607a60] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e4e9df]"
        aria-label="Buka undangan perkahwinan Harissa Amani dan Muhammad Faiz"
      >
        <img
          src="/images/gatefold-cover-garden-v1.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <Butterfly className="absolute right-[6%] top-[39%] w-20 -rotate-[22deg] sm:w-24" />
        <span className="wax-seal absolute left-1/2 top-1/2 z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center transition duration-300 group-hover:scale-105" aria-hidden="true">
          <img src="/images/wax-seal-fh-v1.png" alt="" className="wax-seal-image h-full w-full object-cover" />
        </span>
      </button>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6e7b70]">Tekan mohor untuk membuka</p>
    </div>
  );
}

function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: ReactNode; light?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-xl text-center">
      <p className={`text-[10px] font-semibold uppercase tracking-[0.34em] ${light ? "text-[#496851]" : "text-[#71866d]"}`}>{eyebrow}</p>
      <h2 className={`${titleFont.className} mt-3 text-4xl font-medium tracking-wide text-[#3e5949] sm:text-5xl`}>{children}</h2>
      <Ornament />
    </div>
  );
}

export default function JemputanPerkahwinanV2() {
  const [showSalam, setShowSalam] = useState(false);
  const [invitationOpened, setInvitationOpened] = useState(false);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>(initialGifts);
  const [newGift, setNewGift] = useState("");
  const [wishes, setWishes] = useState<WeddingWish[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionError, setContributionError] = useState("");
  const [guestId, setGuestId] = useState("");
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const contributionId = useRef("");
  const customGiftId = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowSalam(params.get("salam") === "1");

    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void getWeddingGuest().then((uid) => {
      if (disposed) return;
      setGuestId(uid);
      let giftsLoaded = false;
      let wishesLoaded = false;
      let failed = false;
      unsubscribe = subscribeWedding(
        (items) => { setGifts(items); giftsLoaded = true; setBackendReady(!failed && giftsLoaded && wishesLoaded); },
        (items) => { setWishes(items); wishesLoaded = true; setBackendReady(!failed && giftsLoaded && wishesLoaded); },
        (error, source) => {
          if (disposed) return;
          console.error(`[Wedding Firebase] ${source} read failed`, error.code, error.message);
          failed = true;
          setBackendReady(false);
          setBackendError("Tidak dapat memuatkan data. Sila muat semula halaman dan cuba lagi.");
        },
      );
    }).catch((error) => {
      if (disposed) return;
      console.error("[Wedding Firebase] Connection failed", error);
      setBackendError("Tidak dapat menyambung. Sila muat semula halaman dan cuba lagi.");
    });
    return () => { disposed = true; unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!selectedGiftId) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingRef.current) setSelectedGiftId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedGiftId]);

  const countdown = useMemo(() => {
    const distance = Math.max(0, wedding.date.getTime() - Date.now());
    return {
      hari: Math.floor(distance / 86_400_000),
      jam: Math.floor((distance / 3_600_000) % 24),
      minit: Math.floor((distance / 60_000) % 60),
    };
  }, []);

  const performSave = async (action: () => Promise<void>) => {
    if (savingRef.current || !backendReady) return;
    savingRef.current = true;
    setSaving(true);
    setBackendError("");
    try {
      await action();
    } catch (error) {
      setBackendError(error instanceof Error && !error.message.includes("Firebase")
        ? error.message : "Maklumat belum disimpan. Sila cuba lagi.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const toggleGift = (id: string) => {
    const gift = gifts.find((item) => item.id === id);
    if (gift) void performSave(() => reserveGift(gift));
  };

  const selectedGift = gifts.find((gift) => gift.id === selectedGiftId);

  const openContribution = (id: string) => {
    contributionId.current = crypto.randomUUID();
    setSelectedGiftId(id);
    setContributionAmount("");
    setContributionError("");
  };

  const closeContribution = () => {
    if (savingRef.current) return;
    setSelectedGiftId(null);
    setContributionAmount("");
    setContributionError("");
  };

  const submitContribution = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGift?.contribution) return;

    const amount = Number(contributionAmount);
    const remaining = Math.max(0, selectedGift.contribution.target - selectedGift.contribution.contributed);
    if (!Number.isFinite(amount) || amount <= 0) {
      setContributionError("Masukkan jumlah sumbangan yang sah.");
      return;
    }
    if (amount > remaining) {
      setContributionError(`Jumlah maksimum yang masih diperlukan ialah ${formatRinggit(remaining)}.`);
      return;
    }

    void performSave(async () => {
      try {
        await recordContribution(amount, contributionId.current);
        setSelectedGiftId(null);
        setContributionAmount("");
      } catch (error) {
        setContributionError(error instanceof Error && !error.message.includes("Firebase")
          ? error.message : "Sumbangan belum direkodkan. Sila cuba lagi.");
      }
    });
  };

  const addGift = (event: FormEvent) => {
    event.preventDefault();
    const name = newGift.trim();
    if (!name) return;
    if (!customGiftId.current) customGiftId.current = `custom-${crypto.randomUUID()}`;
    void performSave(async () => {
      await createGift(name, customGiftId.current);
      customGiftId.current = "";
      setNewGift("");
    });
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
    });
  };

  const encodedVenue = encodeURIComponent(wedding.mapQuery);
  const maps = [
    { name: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encodedVenue}` },
    { name: "Waze", href: `https://www.waze.com/ul?q=${encodedVenue}&navigate=yes` },
    { name: "Apple Maps", href: `https://maps.apple.com/?q=${encodedVenue}` },
  ];

  const openInvitation = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/terukir-di-bintang-v2.mp3");
      audioRef.current.loop = true;
      audioRef.current.preload = "auto";
    }
    audioRef.current.volume = 0.55;
    void audioRef.current.play().catch(() => undefined);
    window.scrollTo({ top: 0 });
    setInvitationOpened(true);
  };

  return (
    <>
      <Head>
        <title>{`${wedding.bride} & ${wedding.groom} — Undangan Walimatulurus`}</title>
        <meta name="description" content={`Dengan penuh kesyukuran, ${wedding.hosts} menjemput anda ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom} pada 28 November 2026.`} />
        <meta name="theme-color" content="#e4e9df" />
      </Head>

      {!invitationOpened ? (
        <main className="english-wedding-hero garden-english-wedding-hero relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-center text-[#3e5949] sm:px-8 sm:py-14">
          <div className="relative z-10 mx-auto w-full max-w-xl">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.38em] text-[#6e7b70]">Sebuah undangan daripada keluarga pengantin perempuan</p>
            <InvitationCoverArtwork onOpen={openInvitation} />
          </div>
        </main>
      ) : (
        <main className="english-invitation-enter english-wedding-paper garden-english-wedding-paper min-h-screen bg-[#fffdf8] text-[#3e5949] antialiased selection:bg-[#dfe3da]">
        <section className="english-wedding-hero garden-english-wedding-hero relative grid min-h-screen place-items-center overflow-x-hidden px-5 py-20 text-center sm:px-8 sm:py-24">
          <div className="english-invitation-card garden-english-invitation-card relative z-10 mx-auto w-full max-w-3xl px-7 pb-28 pt-32 sm:px-16 sm:pb-36 sm:pt-44">
            <Butterfly className="garden-butterfly-accent right-[18%] top-[5%] w-20 rotate-[18deg] sm:w-24" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#747b70]">Walimatulurus</p>
            <p className="mt-5 font-serif text-xl italic text-[#68776d]">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-[#68776d]">
              Dengan penuh kesyukuran ke hadrat Allah SWT, kami
            </p>
            <p className={`${titleFont.className} mt-2 text-3xl font-medium tracking-wide text-[#496851] sm:text-4xl`}>{wedding.hosts}</p>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#68776d]">
              dengan segala hormatnya menjemput Dato&apos;, Datin, Tuan, Puan, Encik dan Cik dan pasangan ke majlis perkahwinan puteri kami
            </p>
            <h1 className={`${namesFont.className} mt-7 text-4xl font-normal leading-[0.95] text-[#496851] sm:text-6xl`}>
              {wedding.brideFullName}
              <span className={`${titleFont.className} mx-auto my-3 block text-xl font-normal italic text-[#9b8b65]`}>&</span>
              {wedding.groomFullName}
            </h1>
            <Ornament />
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="#lokasi" className="inline-flex items-center gap-2 rounded-full border border-[#71866d]/25 bg-[#fffdf8]/80 px-5 py-3 text-sm font-semibold text-[#3e5949] shadow-sm transition hover:-translate-y-0.5 hover:border-[#607a60]">
                <MapPin className="h-4 w-4" /> Lokasi
              </a>
              <a href="#rsvp" className="inline-flex items-center gap-2 rounded-full bg-[#4c6b55] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#3e5949]">
                <Heart className="h-4 w-4" /> RSVP
              </a>
              <a href="#hadiah" className="inline-flex items-center gap-2 rounded-full border border-[#3e5949]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[#3e5949] shadow-sm transition hover:-translate-y-0.5 hover:border-[#607a60]">
                <Gift className="h-4 w-4" /> Hadiah
              </a>
              {showSalam && (
                <a href="#salam-kaut" className="inline-flex items-center gap-2 rounded-full border border-[#607a60]/30 bg-[#607a60] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#4f7058]">
                  <QrCode className="h-4 w-4" /> Salam Kaut
                </a>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-[#3e5949]">
              <span>{wedding.dateLabel}</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#607a60] sm:block" />
              <span>{wedding.timeLabel}</span>
            </div>
            <a href="#butiran" className="mx-auto mt-9 grid h-12 w-12 place-items-center rounded-full border border-[#607a60]/40 text-[#607a60] transition hover:-translate-y-1 hover:bg-white/60" aria-label="Lihat butiran majlis">
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>
        </section>

        <section id="butiran" className="stationery-section garden-stationery-section relative overflow-hidden border-y border-[#a79a78]/20 bg-[#eef0e8] px-6 py-24 text-[#3e5949]">
          <div className="relative">
            <SectionTitle eyebrow="Dengan segala hormatnya" light>Majlis perkahwinan puteri kami</SectionTitle>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
              {[["Hari", countdown.hari], ["Jam", countdown.jam], ["Minit", countdown.minit]].map(([label, value]) => (
                <div key={label} className="stationery-panel p-7 text-center">
                  <strong className={`${titleFont.className} block text-6xl font-medium text-[#496851]`}>{value}</strong>
                  <span className="mt-2 block text-xs uppercase tracking-[0.25em] text-[#6e7b70]">{label}</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
              {[
                { icon: CalendarDays, label: wedding.dateLabel },
                { icon: Sparkles, label: wedding.timeLabel },
                { icon: MapPin, label: wedding.venue },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="stationery-panel flex items-center gap-4 p-5 text-[#3e5949]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e3e9de]"><Icon className="h-5 w-5" /></span>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Majlis Perkahwinan ${wedding.bride} & ${wedding.groom}`)}&dates=20261128T113000/20261128T123000&ctz=Asia%2FKuala_Lumpur&location=${encodeURIComponent(wedding.venue)}&details=${encodeURIComponent(`Dengan penuh kesyukuran, ${wedding.hosts} menjemput tuan/puan ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#4c6b55] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#3e5949]/10 transition hover:-translate-y-0.5 hover:bg-[#3e5949]"
              >
                <CalendarDays className="h-4 w-4" /> Tambah ke Google Calendar
              </a>
            </div>
          </div>
        </section>

        <section id="lokasi" className="relative scroll-mt-6 overflow-hidden px-6 py-24">
          <div className="relative">
            <SectionTitle eyebrow="Tempat berlangsungnya majlis">Kami menanti kehadiran tuan dan puan</SectionTitle>
            <div className="stationery-panel mx-auto max-w-4xl p-6 sm:p-10">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <MapPin className="h-9 w-9 text-[#607a60]" />
                  <h3 className={`${titleFont.className} mt-4 text-4xl font-medium text-[#3e5949]`}>{wedding.venue}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-[#6f786f]">Kami berdua dan sekeluarga berbesar hati menyambut kehadiran tuan/puan. Pilih aplikasi navigasi untuk mendapatkan arah ke lokasi majlis.</p>
                </div>
                <div className="grid gap-3">
                  {maps.map((map) => (
                    <a key={map.name} href={map.href} target="_blank" rel="noreferrer" className="flex min-w-[190px] items-center justify-between rounded-full border border-[#3e5949]/15 bg-white px-5 py-3 font-medium transition hover:-translate-y-0.5 hover:border-[#607a60]">
                      {map.name}<ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="rsvp" className="english-wedding-blush garden-english-wedding-blush stationery-section garden-stationery-section relative scroll-mt-6 overflow-hidden border-y border-[#a79a78]/20 bg-[#eef0e8] px-6 py-24">
          <div className="relative">
            <SectionTitle eyebrow="Mohon maklum balas">Khabarkan kehadiran tuan dan puan</SectionTitle>
            <p className="mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[#6f786f]">Bagi membantu kami membuat persiapan, mohon sahkan kehadiran sebelum hari majlis.</p>
            <form onSubmit={submitRsvp} className="stationery-panel mx-auto grid max-w-2xl gap-5 p-6 sm:p-10">
            <label className="grid gap-2 text-sm font-semibold">Nama
              <input name="nama" maxLength={100} required placeholder="Nama anda" className="rounded-sm border-[#3e5949]/15 bg-white focus:border-[#607a60] focus:ring-[#607a60]" />
            </label>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Kehadiran</legend>
              <div className="grid grid-cols-2 gap-3">
                {["Hadir, insya-Allah", "Maaf, tidak dapat hadir"].map((answer, index) => (
                  <label key={answer} className="flex cursor-pointer items-center gap-3 rounded-sm border border-[#3e5949]/15 bg-white p-4 text-sm">
                    <input type="radio" name="kehadiran" value={answer} required defaultChecked={index === 0} className="text-[#607a60] focus:ring-[#607a60]" />{answer}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-semibold">Jumlah tetamu
              <select name="tetamu" className="rounded-sm border-[#3e5949]/15 bg-white focus:border-[#607a60] focus:ring-[#607a60]">
                {[1, 2, 3, 4, 5].map((count) => <option key={count}>{count}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Ucapan dan doa buat pasangan pengantin
              <textarea name="ucapan" maxLength={2000} rows={4} placeholder="Titipkan doa dan ucapan buat pengantin..." className="rounded-sm border-[#3e5949]/15 bg-white focus:border-[#607a60] focus:ring-[#607a60]" />
            </label>
            <p className="text-xs text-[#6f786f]">Nama dan ucapan akan dipaparkan kepada tetamu lain. Maklumat kehadiran adalah peribadi.</p>
            {!backendReady && !backendError && <p role="status">Sedang menyambung...</p>}
            {backendError && <p role="alert" className="text-sm text-red-700">{backendError}</p>}
            <button disabled={!backendReady || saving} className="mt-2 rounded-full bg-[#3e5949] px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4c6b55]">{saving ? "Sedang menyimpan..." : "Hantar RSVP"}</button>
            {rsvpSent && <p className="text-center text-sm font-medium text-[#637d6d]">Terima kasih. Maklum balas tuan/puan telah kami terima.</p>}
            </form>
          </div>
        </section>

        <section id="ucapan" className="relative scroll-mt-6 overflow-hidden border-b border-[#a79a78]/25 bg-[#fffdf8]/70 px-6 py-24">
          <div className="relative mx-auto max-w-5xl">
            <SectionTitle eyebrow="Titipan buat pengantin">Ucapan dan doa</SectionTitle>
            <p className="mx-auto -mt-6 mb-10 max-w-xl text-center leading-7 text-[#6f786f]">
              Setiap ucapan dan doa yang dititipkan buat Harissa dan Faiz amat bermakna buat kami sekeluarga.
            </p>

            {wishes.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {wishes.slice().reverse().map((wish, index) => (
                  <blockquote key={`${wish.name}-${index}`} className="stationery-panel relative p-6 sm:p-8">
                    <Quote className="h-8 w-8 fill-[#dfe3da] text-[#607a60]" aria-hidden="true" />
                    <p className={`${titleFont.className} mt-4 text-2xl leading-9 text-[#3e5949]`}>&ldquo;{wish.message}&rdquo;</p>
                    <footer className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#607a60]">— {wish.name}</footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <div className="stationery-panel mx-auto max-w-xl px-6 py-10 text-center">
                <Quote className="mx-auto h-8 w-8 text-[#607a60]" aria-hidden="true" />
                <p className={`${titleFont.className} mt-4 text-2xl text-[#3e5949]`}>Belum ada ucapan dititipkan.</p>
                <p className="mt-2 text-sm leading-6 text-[#6f786f]">Ucapan daripada borang RSVP akan dipaparkan di sini.</p>
              </div>
            )}
          </div>
        </section>

        <section id="hadiah" className="relative scroll-mt-6 overflow-hidden px-6 py-24">
          <div className="relative">
            <SectionTitle eyebrow="Buat pasangan pengantin">Senarai hadiah pengantin</SectionTitle>
            <div className="mx-auto max-w-3xl">
            <p className="mx-auto -mt-6 mb-10 max-w-xl text-center leading-7 text-[#6f786f]">
              Kehadiran dan doa restu tuan/puan buat Harissa dan Faiz sudah cukup bermakna. Senarai ini disediakan sekiranya tuan/puan berhasrat memberi hadiah, agar hadiah yang sama tidak dibeli lebih daripada sekali.
            </p>
            <div className="grid gap-3">
              {gifts.map((item) => {
                if (item.contribution) {
                  const percentage = Math.min(100, (item.contribution.contributed / item.contribution.target) * 100);
                  const fullyFunded = percentage >= 100;

                  return (
                    <div key={item.id} className={`rounded-lg border p-5 transition ${fullyFunded ? "border-[#93a38e]/40 bg-[#e4ebe1]" : "border-[#607a60]/15 bg-white/70"}`}>
                      <div className="flex items-center gap-4">
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${fullyFunded ? "bg-[#778b78] text-white" : "bg-[#e4ebe1] text-[#4f7058]"}`}>
                          {fullyFunded ? <Check className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#3e5949]">{item.name}</p>
                          <p className="mt-0.5 text-xs text-[#777e78]">{fullyFunded ? "Sasaran laporan sumbangan telah dicapai" : "Sumbangan dilaporkan oleh tetamu"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openContribution(item.id)}
                          disabled={fullyFunded || !backendReady || saving}
                          className="rounded-full bg-[#3e5949] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#4c6b55] disabled:cursor-not-allowed disabled:bg-[#778b78]"
                        >
                          {fullyFunded ? "Lengkap" : "Sumbang"}
                        </button>
                      </div>
                      <div className="mt-5">
                        <div className="mb-2 flex items-end justify-between gap-4 text-xs">
                          <span className="font-semibold text-[#3e5949]">
                            {formatRinggit(item.contribution.contributed)} / {formatRinggit(item.contribution.target)}
                          </span>
                          <span className="font-bold text-[#607a60]">{percentage.toFixed(1)}%</span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-[#e9e1e8]"
                          role="progressbar"
                          aria-label={`Kemajuan sumbangan untuk ${item.name}`}
                          aria-valuemin={0}
                          aria-valuemax={item.contribution.target}
                          aria-valuenow={item.contribution.contributed}
                        >
                          <div className="h-full rounded-full bg-[#607a60] transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className={`flex items-center gap-4 rounded-lg border p-4 transition ${item.claimed ? "border-[#93a38e]/40 bg-[#e4ebe1]" : "border-[#607a60]/15 bg-white/70"}`}>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.claimed ? "bg-[#778b78] text-white" : "bg-[#e4ebe1] text-[#4f7058]"}`}>
                      {item.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${item.claimed ? "text-[#718077] line-through" : "text-[#3e5949]"}`}>{item.name}</p>
                      <p className="mt-0.5 text-xs text-[#777e78]">{item.claimed ? "Sudah dipilih oleh tetamu" : "Masih tersedia"}</p>
                    </div>
                    <button disabled={!backendReady || saving || (item.claimed && item.claimedBy !== guestId)} type="button" onClick={() => toggleGift(item.id)} className="rounded-full border border-[#3e5949]/15 px-4 py-2 text-xs font-bold">
                      {item.claimed ? (item.claimedBy === guestId ? "Batalkan" : "Sudah dipilih") : "Saya pilih"}
                    </button>
                  </div>
                );
              })}
            </div>
            {backendError && <p role="alert" className="mt-3 text-sm text-red-700">{backendError}</p>}
            <form onSubmit={addGift} className="mt-6 flex gap-3 rounded-lg border border-dashed border-[#607a60]/40 bg-white/40 p-3">
              <input maxLength={100} value={newGift} onChange={(event) => setNewGift(event.target.value)} placeholder="Hadiah lain yang anda ingin berikan" aria-label="Hadiah lain yang anda ingin berikan" className="min-w-0 flex-1 border-0 bg-transparent focus:ring-0" />
              <button disabled={!backendReady || saving} aria-label="Simpan pilihan hadiah" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#607a60] text-white"><Plus className="h-5 w-5" /></button>
            </form>
            <p className="mt-3 text-center text-xs leading-5 text-[#777e78]">Jika hadiah anda tiada dalam senarai, masukkan namanya di atas. Ia akan terus ditandakan sebagai sudah dipilih.</p>
            </div>
          </div>
        </section>

        {selectedGift?.contribution && (
          <div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#24342c]/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribution-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeContribution();
            }}
          >
            <div className="stationery-panel relative my-6 w-full max-w-md p-6 shadow-2xl sm:p-8">
              <button
                type="button"
                onClick={closeContribution}
                aria-label="Tutup"
                className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-[#e9ebe4] text-[#3e5949] transition hover:bg-[#e2d8ca]"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#607a60]">Sumbangan hadiah</p>
              <h2 id="contribution-title" className={`${titleFont.className} mt-2 pr-12 text-4xl font-medium text-[#3e5949]`}>{selectedGift.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6f786f]">Sekiranya tuan/puan ingin menyumbang buat hadiah pengantin, imbas kod DuitNow, buat pembayaran, kemudian catat jumlah sumbangan. Catatan ini bukan pengesahan pembayaran oleh bank.</p>

              <div className="mx-auto mt-6 w-full max-w-[240px] overflow-hidden rounded-lg border border-[#3e5949]/10 bg-white p-3 shadow-sm">
                <img src={selectedGift.contribution.duitNowQr} alt="Kod QR DuitNow untuk sumbangan hadiah" className="aspect-square h-auto w-full" />
              </div>

              <form onSubmit={submitContribution} className="mt-6">
                <label htmlFor="contribution-amount" className="text-sm font-semibold text-[#3e5949]">Jumlah yang telah disumbangkan</label>
                <div className="mt-2 flex overflow-hidden rounded-sm border border-[#3e5949]/15 bg-white focus-within:border-[#607a60] focus-within:ring-1 focus-within:ring-[#607a60]">
                  <span className="grid place-items-center border-r border-[#3e5949]/10 px-4 text-sm font-bold text-[#68776d]">RM</span>
                  <input
                    id="contribution-amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    max={Math.max(0, selectedGift.contribution.target - selectedGift.contribution.contributed)}
                    required
                    autoFocus
                    value={contributionAmount}
                    onChange={(event) => {
                      setContributionAmount(event.target.value);
                      setContributionError("");
                    }}
                    placeholder="100.00"
                    className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 focus:ring-0"
                  />
                </div>
                {contributionError && <p className="mt-2 text-xs font-medium text-red-700">{contributionError}</p>}
                <p className="mt-2 text-xs text-[#777e78]">
                  Baki diperlukan: {formatRinggit(Math.max(0, selectedGift.contribution.target - selectedGift.contribution.contributed))}
                </p>
                <button disabled={!backendReady || saving} className="mt-5 w-full rounded-full bg-[#607a60] px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4f7058]">
                  Saya telah menyumbang
                </button>
              </form>
            </div>
          </div>
        )}

        {showSalam && (
          <section id="salam-kaut" className="stationery-section garden-stationery-section relative scroll-mt-6 overflow-hidden border-y border-[#a79a78]/20 bg-[#eef0e8] px-6 py-24 text-[#3e5949]">
            <div className="relative">
              <SectionTitle eyebrow="Tanda ingatan buat pengantin" light>Salam Kaut</SectionTitle>
              <div className="stationery-panel mx-auto max-w-xl p-7 text-center sm:p-10">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fffdf8] text-[#3e5949]"><QrCode className="h-10 w-10" /></span>
                <h3 className={`${titleFont.className} mt-6 text-4xl font-medium text-[#496851]`}>Sedikit tanda ingatan</h3>
                <p className="mt-4 leading-7 text-[#6f786f]">Sekiranya tuan/puan berhasrat berkongsi rezeki buat pasangan pengantin, silakan imbas kod DuitNow ini. Kehadiran dan doa restu tuan/puan tetap menjadi hadiah yang paling bermakna.</p>
                <div className="mx-auto mt-7 w-full max-w-[260px] overflow-hidden rounded-sm border border-[#71866d]/15 bg-white p-3 shadow-lg shadow-[#3e5949]/10">
                  <img src="/images/duitnow-qr-placeholder.svg" alt="Kod QR DuitNow untuk Salam Kaut" className="aspect-square h-auto w-full" />
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="stationery-section garden-stationery-section relative border-t border-[#a79a78]/20 bg-[#eef0e8] px-6 py-20 text-center">
          <Butterfly className="absolute right-[8%] top-4 w-20 -rotate-[20deg] sm:right-[22%] sm:w-24" />
          <Ornament />
          <Heart className="mx-auto mt-2 h-5 w-5 fill-[#607a60] text-[#607a60]" />
          <p className={`${titleFont.className} mt-5 text-4xl font-medium text-[#3e5949]`}>Kehadiran tuan dan puan amat kami hargai.</p>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#6f786f]">Dengan ingatan tulus daripada {wedding.hosts}.</p>
          <p className={`${namesFont.className} mt-7 text-5xl text-[#496851]`}>{wedding.bride} & {wedding.groom}</p>
        </footer>
        </main>
      )}
    </>
  );
}
