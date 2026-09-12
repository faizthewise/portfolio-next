import Head from "next/head";
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

type GiftItem = {
  id: string;
  name: string;
  claimed: boolean;
  contribution?: {
    target: number;
    contributed: number;
    duitNowQr: string;
  };
};

type WeddingWish = {
  name: string;
  message: string;
};

const initialGifts: GiftItem[] = [
  { id: "air-fryer", name: "Air fryer", claimed: false },
  { id: "dinnerware", name: "Set pinggan mangkuk", claimed: false },
  { id: "vacuum", name: "Penyedut hampagas", claimed: false },
  { id: "bedding", name: "Set cadar king", claimed: false },
  {
    id: "coffee",
    name: "Mesin kopi",
    claimed: false,
    contribution: {
      target: 3000,
      contributed: 0,
      duitNowQr: "/images/duitnow-qr-placeholder.svg",
    },
  },
];

const formatRinggit = (amount: number) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(amount);

const mergeSavedGifts = (saved: GiftItem[]) => {
  const savedById = new Map(saved.map((gift) => [gift.id, gift]));
  const configuredGifts = initialGifts.map((gift) => {
    const savedGift = savedById.get(gift.id);
    if (!savedGift) return gift;

    return {
      ...gift,
      ...savedGift,
      contribution: gift.contribution
        ? { ...gift.contribution, ...(savedGift.contribution ?? {}) }
        : undefined,
    };
  });
  const customGifts = saved.filter((gift) => !initialGifts.some((item) => item.id === gift.id));

  return [...configuredGifts, ...customGifts];
};

const getWishesFromEntries = (entries: unknown): WeddingWish[] => {
  if (!Array.isArray(entries)) return [];

  return entries.reduce<WeddingWish[]>((wishes, entry) => {
    if (!entry || typeof entry !== "object") return wishes;

    const { nama, ucapan } = entry as Record<string, unknown>;
    if (typeof nama === "string" && typeof ucapan === "string" && ucapan.trim()) {
      wishes.push({ name: nama.trim() || "Tetamu", message: ucapan.trim() });
    }
    return wishes;
  }, []);
};

function WhiteFlower({ x, y, scale = 1, rotation = 0 }: { x: number; y: number; scale?: number; rotation?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      <ellipse cx="0" cy="-11" rx="7" ry="12" fill="#fffdf8" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="10.5" cy="-3.5" rx="7" ry="12" transform="rotate(72 10.5 -3.5)" fill="#fffdf8" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="6.5" cy="9" rx="7" ry="12" transform="rotate(144 6.5 9)" fill="#fffdf8" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="-6.5" cy="9" rx="7" ry="12" transform="rotate(216 -6.5 9)" fill="#fffdf8" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="-10.5" cy="-3.5" rx="7" ry="12" transform="rotate(288 -10.5 -3.5)" fill="#fffdf8" stroke="#c5ad78" strokeWidth="1" />
      <circle r="5.2" fill="#d1af63" />
      <circle r="2" fill="#8f7440" />
    </g>
  );
}

function Ornament() {
  return (
    <svg viewBox="0 0 260 80" aria-hidden="true" className="mx-auto h-16 w-56">
      <path d="M20 48c40 0 54-21 87-13M240 48c-40 0-54-21-87-13" fill="none" stroke="#879783" strokeWidth="1.4" />
      <path d="M68 39c-12-14-25-11-29-2 13-3 22 0 29 2Zm31-7c-5-15-17-20-26-13 12 3 19 8 26 13Zm93 7c12-14 25-11 29-2-13-3-22 0-29 2Zm-31-7c5-15 17-20 26-13-12 3-19 8-26 13Z" fill="#879783" opacity=".82" />
      <WhiteFlower x={108} y={37} scale={0.72} rotation={-12} />
      <WhiteFlower x={130} y={32} scale={0.92} rotation={8} />
      <WhiteFlower x={153} y={38} scale={0.68} rotation={24} />
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
        className="sealed-invitation group relative block w-full overflow-hidden text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#747d59] focus-visible:ring-offset-4 focus-visible:ring-offset-[#dfe1dc]"
        aria-label="Buka undangan perkahwinan Harissa Amani dan Muhammad Faiz"
      >
        <img
          src="/images/gatefold-cover-minimal-sage-v3.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <span className="wax-seal absolute left-1/2 top-1/2 z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center transition duration-300 group-hover:scale-105" aria-hidden="true">
          <img src="/images/wax-seal-fh-v1.png" alt="" className="wax-seal-image h-full w-full object-cover" />
        </span>
      </button>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#777d72]">Tekan mohor untuk membuka</p>
    </div>
  );
}

function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: ReactNode; light?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-xl text-center">
      <p className={`text-[10px] font-semibold uppercase tracking-[0.34em] ${light ? "text-[#66704b]" : "text-[#7c8467]"}`}>{eyebrow}</p>
      <h2 className={`${titleFont.className} mt-3 text-4xl font-medium tracking-wide text-[#4f5843] sm:text-5xl`}>{children}</h2>
      <Ornament />
    </div>
  );
}

export default function JemputanPerkahwinan() {
  const [showSalam, setShowSalam] = useState(false);
  const [invitationOpened, setInvitationOpened] = useState(false);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>(initialGifts);
  const [newGift, setNewGift] = useState("");
  const [wishes, setWishes] = useState<WeddingWish[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionError, setContributionError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowSalam(params.get("salam") === "1");

    const savedGifts = window.localStorage.getItem("faiz-harissa-wedding-gifts");
    if (savedGifts) {
      try {
        setGifts(mergeSavedGifts(JSON.parse(savedGifts)));
      } catch {
        setGifts(initialGifts);
      }
    }

    try {
      const savedRsvp = JSON.parse(window.localStorage.getItem("faiz-harissa-wedding-rsvp") || "[]");
      setWishes(getWishesFromEntries(savedRsvp));
    } catch {
      setWishes([]);
    }
  }, []);

  useEffect(() => {
    if (!selectedGiftId) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedGiftId(null);
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

  const saveGifts = (next: GiftItem[]) => {
    setGifts(next);
    window.localStorage.setItem("faiz-harissa-wedding-gifts", JSON.stringify(next));
  };

  const toggleGift = (id: string) => {
    saveGifts(gifts.map((item) => (item.id === id ? { ...item, claimed: !item.claimed } : item)));
  };

  const selectedGift = gifts.find((gift) => gift.id === selectedGiftId);

  const openContribution = (id: string) => {
    setSelectedGiftId(id);
    setContributionAmount("");
    setContributionError("");
  };

  const closeContribution = () => {
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

    saveGifts(
      gifts.map((gift) =>
        gift.id === selectedGift.id && gift.contribution
          ? {
              ...gift,
              contribution: {
                ...gift.contribution,
                contributed: gift.contribution.contributed + amount,
              },
            }
          : gift,
      ),
    );
    closeContribution();
  };

  const addGift = (event: FormEvent) => {
    event.preventDefault();
    const name = newGift.trim();
    if (!name) return;
    saveGifts([...gifts, { id: `${Date.now()}`, name, claimed: true }]);
    setNewGift("");
  };

  const submitRsvp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let entries: unknown[] = [];
    try {
      const savedEntries = JSON.parse(window.localStorage.getItem("faiz-harissa-wedding-rsvp") || "[]");
      if (Array.isArray(savedEntries)) entries = savedEntries;
    } catch {
      entries = [];
    }
    entries.push(Object.fromEntries(form.entries()));
    window.localStorage.setItem("faiz-harissa-wedding-rsvp", JSON.stringify(entries));
    setWishes(getWishesFromEntries(entries));
    setRsvpSent(true);
    event.currentTarget.reset();
  };

  const encodedVenue = encodeURIComponent(wedding.mapQuery);
  const maps = [
    { name: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encodedVenue}` },
    { name: "Waze", href: `https://www.waze.com/ul?q=${encodedVenue}&navigate=yes` },
    { name: "Apple Maps", href: `https://maps.apple.com/?q=${encodedVenue}` },
  ];

  const openInvitation = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/malam-bulan.mp3");
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
        <title>{wedding.bride} & {wedding.groom} — Undangan Walimatulurus</title>
        <meta name="description" content={`Dengan penuh kesyukuran, ${wedding.hosts} menjemput anda ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom} pada 28 November 2026.`} />
        <meta name="theme-color" content="#dfe1dc" />
      </Head>

      {!invitationOpened ? (
        <main className="english-wedding-hero relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-center text-[#4f5843] sm:px-8 sm:py-14">
          <div className="relative z-10 mx-auto w-full max-w-xl">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.38em] text-[#777d72]">Sebuah undangan daripada keluarga pengantin perempuan</p>
            <InvitationCoverArtwork onOpen={openInvitation} />
          </div>
        </main>
      ) : (
        <main className="english-invitation-enter english-wedding-paper min-h-screen bg-[#fffdf8] text-[#4f5843] antialiased selection:bg-[#dfe3da]">
        <section className="english-wedding-hero relative grid min-h-screen place-items-center overflow-x-hidden px-5 py-20 text-center sm:px-8 sm:py-24">
          <div className="english-invitation-card relative z-10 mx-auto w-full max-w-3xl px-7 pb-28 pt-32 sm:px-16 sm:pb-36 sm:pt-44">
            <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#747b70]">Walimatulurus</p>
            <p className="mt-5 font-serif text-xl italic text-[#68776d]">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-[#68776d]">
              Dengan penuh kesyukuran ke hadrat Allah SWT, kami
            </p>
            <p className={`${titleFont.className} mt-2 text-3xl font-medium tracking-wide text-[#66704b] sm:text-4xl`}>{wedding.hosts}</p>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#68776d]">
              dengan segala hormatnya menjemput Dato&apos;, Datin, Tuan, Puan, Encik dan Cik seisi keluarga ke majlis perkahwinan puteri kami
            </p>
            <h1 className={`${namesFont.className} mt-7 text-4xl font-normal leading-[0.95] text-[#66704b] sm:text-6xl`}>
              {wedding.brideFullName}
              <span className={`${titleFont.className} mx-auto my-3 block text-xl font-normal italic text-[#9b8b65]`}>&</span>
              {wedding.groomFullName}
            </h1>
            <Ornament />
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="#lokasi" className="inline-flex items-center gap-2 rounded-full border border-[#7c8467]/25 bg-[#fffdf8]/80 px-5 py-3 text-sm font-semibold text-[#4f5843] shadow-sm transition hover:-translate-y-0.5 hover:border-[#747d59]">
                <MapPin className="h-4 w-4" /> Lokasi
              </a>
              <a href="#rsvp" className="inline-flex items-center gap-2 rounded-full bg-[#5f684d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#4f5843]">
                <Heart className="h-4 w-4" /> RSVP
              </a>
              <a href="#hadiah" className="inline-flex items-center gap-2 rounded-full border border-[#4f5843]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[#4f5843] shadow-sm transition hover:-translate-y-0.5 hover:border-[#747d59]">
                <Gift className="h-4 w-4" /> Hadiah
              </a>
              {showSalam && (
                <a href="#salam-kaut" className="inline-flex items-center gap-2 rounded-full border border-[#747d59]/30 bg-[#747d59] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#5d664b]">
                  <QrCode className="h-4 w-4" /> Salam Kaut
                </a>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-[#4f5843]">
              <span>{wedding.dateLabel}</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#747d59] sm:block" />
              <span>{wedding.timeLabel}</span>
            </div>
            <a href="#butiran" className="mx-auto mt-9 grid h-12 w-12 place-items-center rounded-full border border-[#747d59]/40 text-[#747d59] transition hover:-translate-y-1 hover:bg-white/60" aria-label="Lihat butiran majlis">
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>
        </section>

        <section id="butiran" className="stationery-section relative overflow-hidden border-y border-[#a79a78]/20 bg-[#efefeb] px-6 py-24 text-[#4f5843]">
          <div className="relative">
            <SectionTitle eyebrow="Dengan segala hormatnya" light>Majlis perkahwinan puteri kami</SectionTitle>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
              {[["Hari", countdown.hari], ["Jam", countdown.jam], ["Minit", countdown.minit]].map(([label, value]) => (
                <div key={label} className="stationery-panel p-7 text-center">
                  <strong className={`${titleFont.className} block text-6xl font-medium text-[#66704b]`}>{value}</strong>
                  <span className="mt-2 block text-xs uppercase tracking-[0.25em] text-[#777d72]">{label}</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
              {[
                { icon: CalendarDays, label: wedding.dateLabel },
                { icon: Sparkles, label: wedding.timeLabel },
                { icon: MapPin, label: wedding.venue },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="stationery-panel flex items-center gap-4 p-5 text-[#4f5843]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e4e5dc]"><Icon className="h-5 w-5" /></span>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Majlis Perkahwinan ${wedding.bride} & ${wedding.groom}`)}&dates=20261128T113000/20261128T123000&ctz=Asia%2FKuala_Lumpur&location=${encodeURIComponent(wedding.venue)}&details=${encodeURIComponent(`Dengan penuh kesyukuran, ${wedding.hosts} menjemput tuan/puan ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#5f684d] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#4f5843]/10 transition hover:-translate-y-0.5 hover:bg-[#4f5843]"
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
                  <MapPin className="h-9 w-9 text-[#747d59]" />
                  <h3 className={`${titleFont.className} mt-4 text-4xl font-medium text-[#4f5843]`}>{wedding.venue}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-[#6f786f]">Kami berdua dan sekeluarga berbesar hati menyambut kehadiran tuan/puan. Pilih aplikasi navigasi untuk mendapatkan arah ke lokasi majlis.</p>
                </div>
                <div className="grid gap-3">
                  {maps.map((map) => (
                    <a key={map.name} href={map.href} target="_blank" rel="noreferrer" className="flex min-w-[190px] items-center justify-between rounded-full border border-[#4f5843]/15 bg-white px-5 py-3 font-medium transition hover:-translate-y-0.5 hover:border-[#747d59]">
                      {map.name}<ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="rsvp" className="english-wedding-blush stationery-section relative scroll-mt-6 overflow-hidden border-y border-[#a79a78]/20 bg-[#efefeb] px-6 py-24">
          <div className="relative">
            <SectionTitle eyebrow="Mohon maklum balas">Khabarkan kehadiran tuan dan puan</SectionTitle>
            <p className="mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[#6f786f]">Bagi membantu kami membuat persiapan, mohon sahkan kehadiran sebelum hari majlis.</p>
            <form onSubmit={submitRsvp} className="stationery-panel mx-auto grid max-w-2xl gap-5 p-6 sm:p-10">
            <label className="grid gap-2 text-sm font-semibold">Nama
              <input name="nama" required placeholder="Nama anda" className="rounded-sm border-[#4f5843]/15 bg-white focus:border-[#747d59] focus:ring-[#747d59]" />
            </label>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Kehadiran</legend>
              <div className="grid grid-cols-2 gap-3">
                {["Hadir, insya-Allah", "Maaf, tidak dapat hadir"].map((answer, index) => (
                  <label key={answer} className="flex cursor-pointer items-center gap-3 rounded-sm border border-[#4f5843]/15 bg-white p-4 text-sm">
                    <input type="radio" name="kehadiran" value={answer} required defaultChecked={index === 0} className="text-[#747d59] focus:ring-[#747d59]" />{answer}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-semibold">Jumlah tetamu
              <select name="tetamu" className="rounded-sm border-[#4f5843]/15 bg-white focus:border-[#747d59] focus:ring-[#747d59]">
                {[1, 2, 3, 4, 5].map((count) => <option key={count}>{count}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Ucapan dan doa buat pasangan pengantin
              <textarea name="ucapan" rows={4} placeholder="Titipkan doa dan ucapan buat pengantin..." className="rounded-sm border-[#4f5843]/15 bg-white focus:border-[#747d59] focus:ring-[#747d59]" />
            </label>
            <button className="mt-2 rounded-full bg-[#4f5843] px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#5f684d]">Hantar RSVP</button>
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
                    <Quote className="h-8 w-8 fill-[#dfe3da] text-[#747d59]" aria-hidden="true" />
                    <p className={`${titleFont.className} mt-4 text-2xl leading-9 text-[#4f5843]`}>&ldquo;{wish.message}&rdquo;</p>
                    <footer className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#747d59]">— {wish.name}</footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <div className="stationery-panel mx-auto max-w-xl px-6 py-10 text-center">
                <Quote className="mx-auto h-8 w-8 text-[#747d59]" aria-hidden="true" />
                <p className={`${titleFont.className} mt-4 text-2xl text-[#4f5843]`}>Belum ada ucapan dititipkan.</p>
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
                    <div key={item.id} className={`rounded-lg border p-5 transition ${fullyFunded ? "border-[#93a38e]/40 bg-[#e4ebe1]" : "border-[#747d59]/15 bg-white/70"}`}>
                      <div className="flex items-center gap-4">
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${fullyFunded ? "bg-[#778b78] text-white" : "bg-[#e5e8df] text-[#5d664b]"}`}>
                          {fullyFunded ? <Check className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#4f5843]">{item.name}</p>
                          <p className="mt-0.5 text-xs text-[#777e78]">{fullyFunded ? "Sasaran sumbangan telah dicapai" : "Terbuka untuk sumbangan bersama"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openContribution(item.id)}
                          disabled={fullyFunded}
                          className="rounded-full bg-[#4f5843] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#5f684d] disabled:cursor-not-allowed disabled:bg-[#778b78]"
                        >
                          {fullyFunded ? "Lengkap" : "Sumbang"}
                        </button>
                      </div>
                      <div className="mt-5">
                        <div className="mb-2 flex items-end justify-between gap-4 text-xs">
                          <span className="font-semibold text-[#4f5843]">
                            {formatRinggit(item.contribution.contributed)} / {formatRinggit(item.contribution.target)}
                          </span>
                          <span className="font-bold text-[#747d59]">{percentage.toFixed(1)}%</span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-[#e7dfd4]"
                          role="progressbar"
                          aria-label={`Kemajuan sumbangan untuk ${item.name}`}
                          aria-valuemin={0}
                          aria-valuemax={item.contribution.target}
                          aria-valuenow={item.contribution.contributed}
                        >
                          <div className="h-full rounded-full bg-[#747d59] transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className={`flex items-center gap-4 rounded-lg border p-4 transition ${item.claimed ? "border-[#93a38e]/40 bg-[#e4ebe1]" : "border-[#747d59]/15 bg-white/70"}`}>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.claimed ? "bg-[#778b78] text-white" : "bg-[#e5e8df] text-[#5d664b]"}`}>
                      {item.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${item.claimed ? "text-[#718077] line-through" : "text-[#4f5843]"}`}>{item.name}</p>
                      <p className="mt-0.5 text-xs text-[#777e78]">{item.claimed ? "Sudah dipilih oleh tetamu" : "Masih tersedia"}</p>
                    </div>
                    <button type="button" onClick={() => toggleGift(item.id)} className="rounded-full border border-[#4f5843]/15 px-4 py-2 text-xs font-bold">
                      {item.claimed ? "Batalkan" : "Saya pilih"}
                    </button>
                  </div>
                );
              })}
            </div>
            <form onSubmit={addGift} className="mt-6 flex gap-3 rounded-lg border border-dashed border-[#747d59]/40 bg-white/40 p-3">
              <input value={newGift} onChange={(event) => setNewGift(event.target.value)} placeholder="Hadiah lain yang anda ingin berikan" aria-label="Hadiah lain yang anda ingin berikan" className="min-w-0 flex-1 border-0 bg-transparent focus:ring-0" />
              <button aria-label="Simpan pilihan hadiah" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#747d59] text-white"><Plus className="h-5 w-5" /></button>
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
                className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-[#e9ebe4] text-[#4f5843] transition hover:bg-[#e2d8ca]"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#747d59]">Sumbangan hadiah</p>
              <h2 id="contribution-title" className={`${titleFont.className} mt-2 pr-12 text-4xl font-medium text-[#4f5843]`}>{selectedGift.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6f786f]">Sekiranya tuan/puan ingin menyumbang buat hadiah pengantin, imbas kod DuitNow, buat pembayaran, kemudian catat jumlah sumbangan.</p>

              <div className="mx-auto mt-6 w-full max-w-[240px] overflow-hidden rounded-lg border border-[#4f5843]/10 bg-white p-3 shadow-sm">
                <img src={selectedGift.contribution.duitNowQr} alt="Kod QR DuitNow untuk sumbangan hadiah" className="aspect-square h-auto w-full" />
              </div>

              <form onSubmit={submitContribution} className="mt-6">
                <label htmlFor="contribution-amount" className="text-sm font-semibold text-[#4f5843]">Jumlah yang telah disumbangkan</label>
                <div className="mt-2 flex overflow-hidden rounded-sm border border-[#4f5843]/15 bg-white focus-within:border-[#747d59] focus-within:ring-1 focus-within:ring-[#747d59]">
                  <span className="grid place-items-center border-r border-[#4f5843]/10 px-4 text-sm font-bold text-[#68776d]">RM</span>
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
                <button className="mt-5 w-full rounded-full bg-[#747d59] px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#5d664b]">
                  Saya telah menyumbang
                </button>
              </form>
            </div>
          </div>
        )}

        {showSalam && (
          <section id="salam-kaut" className="stationery-section relative scroll-mt-6 overflow-hidden border-y border-[#a79a78]/20 bg-[#efefeb] px-6 py-24 text-[#4f5843]">
            <div className="relative">
              <SectionTitle eyebrow="Tanda ingatan buat pengantin" light>Salam Kaut</SectionTitle>
              <div className="stationery-panel mx-auto max-w-xl p-7 text-center sm:p-10">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fffdf8] text-[#4f5843]"><QrCode className="h-10 w-10" /></span>
                <h3 className={`${titleFont.className} mt-6 text-4xl font-medium text-[#66704b]`}>Sedikit tanda ingatan</h3>
                <p className="mt-4 leading-7 text-[#6f786f]">Sekiranya tuan/puan berhasrat berkongsi rezeki buat pasangan pengantin, silakan imbas kod DuitNow ini. Kehadiran dan doa restu tuan/puan tetap menjadi hadiah yang paling bermakna.</p>
                <div className="mx-auto mt-7 w-full max-w-[260px] overflow-hidden rounded-sm border border-[#7c8467]/15 bg-white p-3 shadow-lg shadow-[#4f5843]/10">
                  <img src="/images/duitnow-qr-placeholder.svg" alt="Kod QR DuitNow untuk Salam Kaut" className="aspect-square h-auto w-full" />
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="stationery-section border-t border-[#a79a78]/20 bg-[#efefeb] px-6 py-20 text-center">
          <Ornament />
          <Heart className="mx-auto mt-2 h-5 w-5 fill-[#747d59] text-[#747d59]" />
          <p className={`${titleFont.className} mt-5 text-4xl font-medium text-[#4f5843]`}>Kehadiran tuan dan puan amat kami hargai.</p>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#6f786f]">Dengan ingatan tulus daripada {wedding.hosts}.</p>
          <p className={`${namesFont.className} mt-7 text-5xl text-[#66704b]`}>{wedding.bride} & {wedding.groom}</p>
        </footer>
        </main>
      )}
    </>
  );
}
