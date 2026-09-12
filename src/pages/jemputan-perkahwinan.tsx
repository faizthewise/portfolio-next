import Head from "next/head";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
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
      <ellipse cx="0" cy="-11" rx="7" ry="12" fill="#fff8ef" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="10.5" cy="-3.5" rx="7" ry="12" transform="rotate(72 10.5 -3.5)" fill="#fff8ef" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="6.5" cy="9" rx="7" ry="12" transform="rotate(144 6.5 9)" fill="#fff8ef" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="-6.5" cy="9" rx="7" ry="12" transform="rotate(216 -6.5 9)" fill="#fff8ef" stroke="#c5ad78" strokeWidth="1" />
      <ellipse cx="-10.5" cy="-3.5" rx="7" ry="12" transform="rotate(288 -10.5 -3.5)" fill="#fff8ef" stroke="#c5ad78" strokeWidth="1" />
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
      <path d="M112 62h36" stroke="#b7a16e" strokeWidth="1.4" />
      <circle cx="104" cy="62" r="2" fill="#b7a16e" />
      <circle cx="156" cy="62" r="2" fill="#b7a16e" />
    </svg>
  );
}

function BotanicalCorner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 260 300" aria-hidden="true" className={className}>
      <path d="M17 286C36 215 73 171 132 131c42-28 74-60 105-112" fill="none" stroke="#879783" strokeWidth="2" />
      <path d="M48 248c33-5 54-22 69-51m-7-34c30-5 51-19 68-43m-30-2c31-3 52-15 69-36M29 272c18-35 19-62 16-87" fill="none" stroke="#879783" strokeWidth="1.4" />
      <path d="M57 221c-7-33 12-56 40-57-2 27-15 47-40 57Zm49-63c-1-31 20-50 46-46-6 24-21 41-46 46Zm53-50c5-27 26-40 48-32-9 20-25 32-48 32ZM39 250c29-4 48 12 50 36-25 0-42-11-50-36Zm43-65c27-7 49 6 54 30-24 3-42-6-54-30Zm54-57c24-10 46 0 54 21-21 6-39 0-54-21Z" fill="#879783" opacity=".8" />
      <path d="M30 211c-12-18-3-35 13-39 6 17 1 30-13 39Zm70-17c16-18 35-14 43 0-14 10-29 10-43 0Zm33-68c-8-20 4-35 21-36 3 17-4 29-21 36Zm58-28c16-16 34-11 40 4-15 8-28 7-40-4Z" fill="#aab6a5" opacity=".9" />
      <WhiteFlower x={51} y={231} scale={1.2} rotation={-8} />
      <WhiteFlower x={92} y={192} scale={0.82} rotation={22} />
      <WhiteFlower x={118} y={161} scale={1.05} rotation={-18} />
      <WhiteFlower x={153} y={126} scale={0.78} rotation={12} />
      <WhiteFlower x={183} y={86} scale={1.12} rotation={-4} />
      <WhiteFlower x={218} y={43} scale={0.72} rotation={28} />
      <WhiteFlower x={38} y={269} scale={0.7} rotation={16} />
      <g fill="#ad7180" stroke="#8d5362" strokeWidth="1">
        <circle cx="76" cy="215" r="11" />
        <circle cx="69" cy="207" r="7" />
        <circle cx="84" cy="205" r="7" />
      </g>
      <circle cx="76" cy="208" r="4" fill="#e7cfd4" />
    </svg>
  );
}

function InvitationEnvelope() {
  return (
    <svg viewBox="0 0 520 360" aria-hidden="true" className="mx-auto w-full max-w-lg drop-shadow-2xl">
      <rect x="45" y="64" width="430" height="250" rx="5" fill="#fff8ef" stroke="#b4934f" strokeWidth="2" />
      <path d="M47 67 260 224 473 67" fill="#f9ece7" stroke="#c6a96a" strokeWidth="2" />
      <path d="M47 311 205 175c31-27 79-27 110 0l158 136" fill="#fff8ef" stroke="#c6a96a" strokeWidth="2" />
      <path d="M48 311 211 174c29-24 69-24 98 0l163 137" fill="none" stroke="#d7c49a" strokeWidth="1" />
      <path d="M68 92c42 19 65 39 92 76M452 92c-42 19-65 39-92 76" fill="none" stroke="#879783" strokeWidth="2" />
      <path d="M77 102c17-19 37-14 44 3-16 8-31 7-44-3Zm36 30c15-18 34-14 41 1-15 8-28 7-41-1Zm330-30c-17-19-37-14-44 3 16 8 31 7 44-3Zm-36 30c-15-18-34-14-41 1 15 8 28 7 41-1Z" fill="#9dad96" />
      <WhiteFlower x={78} y={83} scale={1.05} rotation={-18} />
      <WhiteFlower x={112} y={112} scale={0.76} rotation={20} />
      <WhiteFlower x={442} y={83} scale={1.05} rotation={18} />
      <WhiteFlower x={408} y={112} scale={0.76} rotation={-20} />
      <g transform="translate(260 221)">
        <circle r="35" fill="#a86273" stroke="#8c4e5e" strokeWidth="3" />
        <circle r="27" fill="none" stroke="#ddb7bf" strokeWidth="1.5" />
        <path d="M0 15C-27-1-18-22-6-22c7 0 11 4 14 9 3-5 7-9 14-9 12 0 21 21-22 37Z" fill="#f5d9de" />
      </g>
    </svg>
  );
}

function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: ReactNode; light?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-xl text-center">
      <p className={`text-[11px] font-bold uppercase tracking-[0.32em] ${light ? "text-[#e8d8b5]" : "text-[#9a5d6c]"}`}>{eyebrow}</p>
      <h2 className={`${titleFont.className} mt-3 text-4xl font-medium tracking-wide sm:text-5xl ${light ? "text-[#fff8ef]" : "text-[#304254]"}`}>{children}</h2>
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

  return (
    <>
      <Head>
        <title>{wedding.bride} & {wedding.groom} — Undangan Walimatulurus</title>
        <meta name="description" content={`Dengan penuh kesyukuran, ${wedding.hosts} menjemput anda ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom} pada 28 November 2026.`} />
        <meta name="theme-color" content="#304254" />
      </Head>

      {!invitationOpened ? (
        <main className="english-wedding-hero relative grid min-h-screen place-items-center overflow-hidden px-6 py-12 text-center text-[#304254]">
          <div className="absolute inset-4 border border-[#b7a16e]/55 sm:inset-7" />
          <div className="absolute inset-[1.35rem] border border-[#b7a16e]/25 sm:inset-[2.05rem]" />
          <BotanicalCorner className="pointer-events-none absolute -left-12 -top-12 w-56 rotate-90 opacity-75 sm:w-80" />
          <BotanicalCorner className="pointer-events-none absolute -bottom-12 -right-12 w-56 -rotate-90 opacity-75 sm:w-80" />
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            <p className={`${titleFont.className} text-sm font-semibold uppercase tracking-[0.35em] text-[#9a5d6c]`}>Undangan Walimatulurus</p>
            <div className="mt-5">
              <InvitationEnvelope />
            </div>
            <h1 className={`${namesFont.className} -mt-3 text-5xl leading-tight text-[#304254] sm:text-7xl`}>
              {wedding.brideFullName} <span className={`${titleFont.className} text-2xl italic text-[#9a5d6c]`}>&</span> {wedding.groomFullName}
            </h1>
            <p className="mt-3 text-sm text-[#68776d]">Dengan segala hormatnya daripada {wedding.hosts}</p>
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0 });
                setInvitationOpened(true);
              }}
              className="mt-7 rounded-full bg-[#304254] px-9 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-xl shadow-[#6f4050]/20 transition hover:-translate-y-0.5 hover:bg-[#455d72] focus:outline-none focus:ring-2 focus:ring-[#9a5d6c] focus:ring-offset-2 focus:ring-offset-[#efcfd5]"
            >
              Buka Undangan
            </button>
          </div>
        </main>
      ) : (
        <main className="english-invitation-enter english-wedding-paper min-h-screen bg-[#fff8ef] text-[#304254] antialiased selection:bg-[#efcfd5]">
        <section className="english-wedding-hero relative grid min-h-screen place-items-center overflow-hidden px-6 py-16 text-center">
          <div className="absolute inset-4 rounded-sm border border-[#b7a16e]/55 sm:inset-7" />
          <div className="absolute inset-[1.35rem] rounded-sm border border-[#b7a16e]/25 sm:inset-[2.05rem]" />
          <BotanicalCorner className="pointer-events-none absolute -left-12 -top-10 w-52 rotate-90 opacity-75 sm:w-72" />
          <BotanicalCorner className="pointer-events-none absolute -right-12 -top-10 hidden w-52 rotate-180 opacity-55 sm:block sm:w-72" />
          <BotanicalCorner className="pointer-events-none absolute -bottom-10 -left-12 hidden w-52 opacity-55 sm:block sm:w-72" />
          <BotanicalCorner className="pointer-events-none absolute -bottom-10 -right-12 w-52 -rotate-90 opacity-75 sm:w-72" />
          <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[#efcfd5]/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-12 h-80 w-80 rounded-full bg-[#a8b3a2]/20 blur-3xl" />
          <div className="english-invitation-card relative z-10 mx-auto w-full max-w-3xl px-6 py-12 sm:px-14 sm:py-16">
            <p className={`${titleFont.className} text-sm font-semibold uppercase tracking-[0.35em] text-[#9a5d6c]`}>Walimatulurus</p>
            <p className="mt-5 font-serif text-xl italic text-[#68776d]">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-[#68776d]">
              Dengan penuh kesyukuran ke hadrat Allah SWT, kami
            </p>
            <p className={`${titleFont.className} mt-2 text-3xl font-medium text-[#9a5d6c] sm:text-4xl`}>{wedding.hosts}</p>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#68776d]">
              dengan segala hormatnya menjemput Dato&apos;, Datin, Tuan, Puan, Encik dan Cik seisi keluarga ke majlis perkahwinan puteri kami
            </p>
            <h1 className={`${namesFont.className} mt-7 text-5xl font-normal leading-[0.9] text-[#304254] sm:text-7xl`}>
              {wedding.brideFullName}
              <span className={`${titleFont.className} mx-auto my-3 block text-2xl font-normal italic text-[#9a5d6c]`}>&</span>
              {wedding.groomFullName}
            </h1>
            <Ornament />
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="#lokasi" className="inline-flex items-center gap-2 rounded-full border border-[#304254]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[#304254] shadow-sm transition hover:-translate-y-0.5 hover:border-[#9a5d6c]">
                <MapPin className="h-4 w-4" /> Lokasi
              </a>
              <a href="#rsvp" className="inline-flex items-center gap-2 rounded-full bg-[#304254] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#455d72]">
                <Heart className="h-4 w-4" /> RSVP
              </a>
              <a href="#hadiah" className="inline-flex items-center gap-2 rounded-full border border-[#304254]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[#304254] shadow-sm transition hover:-translate-y-0.5 hover:border-[#9a5d6c]">
                <Gift className="h-4 w-4" /> Hadiah
              </a>
              {showSalam && (
                <a href="#salam-kaut" className="inline-flex items-center gap-2 rounded-full border border-[#9a5d6c]/30 bg-[#9a5d6c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#814a58]">
                  <QrCode className="h-4 w-4" /> Salam Kaut
                </a>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-[#304254]">
              <span>{wedding.dateLabel}</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#9a5d6c] sm:block" />
              <span>{wedding.timeLabel}</span>
            </div>
            <a href="#butiran" className="mx-auto mt-9 grid h-12 w-12 place-items-center rounded-full border border-[#9a5d6c]/40 text-[#9a5d6c] transition hover:-translate-y-1 hover:bg-white/60" aria-label="Lihat butiran majlis">
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>
        </section>

        <section id="butiran" className="relative overflow-hidden border-y border-[#b7a16e]/40 bg-[#304254] px-6 py-24 text-[#fff8ef]">
          <BotanicalCorner className="pointer-events-none absolute -left-16 -top-16 w-64 opacity-25" />
          <BotanicalCorner className="pointer-events-none absolute -bottom-16 -right-16 w-64 rotate-180 opacity-25" />
          <div className="relative">
            <SectionTitle eyebrow="Dengan segala hormatnya" light>Majlis perkahwinan puteri kami</SectionTitle>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
              {[["Hari", countdown.hari], ["Jam", countdown.jam], ["Minit", countdown.minit]].map(([label, value]) => (
                <div key={label} className="rounded-sm border border-[#e8d8b5]/30 bg-white/5 p-7 text-center backdrop-blur">
                  <strong className={`${titleFont.className} block text-6xl font-medium text-[#e8d8b5]`}>{value}</strong>
                  <span className="mt-2 block text-xs uppercase tracking-[0.25em] text-white/60">{label}</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
              {[
                { icon: CalendarDays, label: wedding.dateLabel },
                { icon: Sparkles, label: wedding.timeLabel },
                { icon: MapPin, label: wedding.venue },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-4 rounded-lg bg-[#fff8ef] p-5 text-[#304254]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e6d6bb]"><Icon className="h-5 w-5" /></span>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Majlis Perkahwinan ${wedding.bride} & ${wedding.groom}`)}&dates=20261128T113000/20261128T123000&ctz=Asia%2FKuala_Lumpur&location=${encodeURIComponent(wedding.venue)}&details=${encodeURIComponent(`Dengan penuh kesyukuran, ${wedding.hosts} menjemput tuan/puan ke majlis perkahwinan puteri mereka, ${wedding.bride}, bersama ${wedding.groom}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#e8d8b5]/30 bg-[#e8d8b5] px-6 py-3.5 text-sm font-bold text-[#304254] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#f1e4cb]"
              >
                <CalendarDays className="h-4 w-4" /> Tambah ke Google Calendar
              </a>
            </div>
          </div>
        </section>

        <section id="lokasi" className="relative scroll-mt-6 overflow-hidden px-6 py-24">
          <BotanicalCorner className="pointer-events-none absolute -bottom-20 -left-16 w-64 opacity-35 sm:w-80" />
          <BotanicalCorner className="pointer-events-none absolute -right-16 -top-20 w-64 rotate-180 opacity-35 sm:w-80" />
          <div className="relative">
            <SectionTitle eyebrow="Tempat berlangsungnya majlis">Kami menanti kehadiran tuan dan puan</SectionTitle>
            <div className="mx-auto max-w-4xl rounded-sm border-4 border-double border-[#b7a16e]/45 bg-white/75 p-6 shadow-xl shadow-[#745f52]/5 sm:p-10">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <MapPin className="h-9 w-9 text-[#9a5d6c]" />
                  <h3 className={`${titleFont.className} mt-4 text-4xl font-medium text-[#304254]`}>{wedding.venue}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-[#6f786f]">Kami berdua dan sekeluarga berbesar hati menyambut kehadiran tuan/puan. Pilih aplikasi navigasi untuk mendapatkan arah ke lokasi majlis.</p>
                </div>
                <div className="grid gap-3">
                  {maps.map((map) => (
                    <a key={map.name} href={map.href} target="_blank" rel="noreferrer" className="flex min-w-[190px] items-center justify-between rounded-full border border-[#304254]/15 bg-white px-5 py-3 font-medium transition hover:-translate-y-0.5 hover:border-[#9a5d6c]">
                      {map.name}<ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="rsvp" className="english-wedding-blush relative scroll-mt-6 overflow-hidden border-y border-[#b7a16e]/25 bg-[#f3dde1] px-6 py-24">
          <BotanicalCorner className="pointer-events-none absolute -left-14 -top-16 w-56 rotate-90 opacity-50 sm:w-72" />
          <BotanicalCorner className="pointer-events-none absolute -bottom-16 -right-14 w-56 -rotate-90 opacity-50 sm:w-72" />
          <div className="relative">
            <SectionTitle eyebrow="Mohon maklum balas">Khabarkan kehadiran tuan dan puan</SectionTitle>
            <p className="mx-auto -mt-6 mb-8 max-w-lg text-center leading-7 text-[#6f786f]">Bagi membantu kami membuat persiapan, mohon sahkan kehadiran sebelum hari majlis.</p>
            <form onSubmit={submitRsvp} className="mx-auto grid max-w-2xl gap-5 rounded-sm border-4 border-double border-[#b7a16e]/35 bg-[#fff8ef]/95 p-6 shadow-xl shadow-[#6f5c50]/10 sm:p-10">
            <label className="grid gap-2 text-sm font-semibold">Nama
              <input name="nama" required placeholder="Nama anda" className="rounded-sm border-[#304254]/15 bg-white focus:border-[#9a5d6c] focus:ring-[#9a5d6c]" />
            </label>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Kehadiran</legend>
              <div className="grid grid-cols-2 gap-3">
                {["Hadir, insya-Allah", "Maaf, tidak dapat hadir"].map((answer, index) => (
                  <label key={answer} className="flex cursor-pointer items-center gap-3 rounded-sm border border-[#304254]/15 bg-white p-4 text-sm">
                    <input type="radio" name="kehadiran" value={answer} required defaultChecked={index === 0} className="text-[#9a5d6c] focus:ring-[#9a5d6c]" />{answer}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-semibold">Jumlah tetamu
              <select name="tetamu" className="rounded-sm border-[#304254]/15 bg-white focus:border-[#9a5d6c] focus:ring-[#9a5d6c]">
                {[1, 2, 3, 4, 5].map((count) => <option key={count}>{count}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Ucapan dan doa buat pasangan pengantin
              <textarea name="ucapan" rows={4} placeholder="Titipkan doa dan ucapan buat pengantin..." className="rounded-sm border-[#304254]/15 bg-white focus:border-[#9a5d6c] focus:ring-[#9a5d6c]" />
            </label>
            <button className="mt-2 rounded-full bg-[#304254] px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#455d72]">Hantar RSVP</button>
            {rsvpSent && <p className="text-center text-sm font-medium text-[#637d6d]">Terima kasih. Maklum balas tuan/puan telah kami terima.</p>}
            </form>
          </div>
        </section>

        <section id="ucapan" className="relative scroll-mt-6 overflow-hidden border-b border-[#b7a16e]/25 bg-[#fff8ef] px-6 py-24">
          <BotanicalCorner className="pointer-events-none absolute -left-16 -top-20 w-64 rotate-90 opacity-30 sm:w-80" />
          <BotanicalCorner className="pointer-events-none absolute -bottom-20 -right-16 w-64 -rotate-90 opacity-30 sm:w-80" />
          <div className="relative mx-auto max-w-5xl">
            <SectionTitle eyebrow="Titipan buat pengantin">Ucapan dan doa</SectionTitle>
            <p className="mx-auto -mt-6 mb-10 max-w-xl text-center leading-7 text-[#6f786f]">
              Setiap ucapan dan doa yang dititipkan buat Harissa dan Faiz amat bermakna buat kami sekeluarga.
            </p>

            {wishes.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {wishes.slice().reverse().map((wish, index) => (
                  <blockquote key={`${wish.name}-${index}`} className="relative border-4 border-double border-[#b7a16e]/30 bg-white/75 p-6 shadow-lg shadow-[#6f5c50]/5 sm:p-8">
                    <Quote className="h-8 w-8 fill-[#efcfd5] text-[#9a5d6c]" aria-hidden="true" />
                    <p className={`${titleFont.className} mt-4 text-2xl leading-9 text-[#304254]`}>&ldquo;{wish.message}&rdquo;</p>
                    <footer className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#9a5d6c]">— {wish.name}</footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-xl border-4 border-double border-[#b7a16e]/30 bg-white/70 px-6 py-10 text-center shadow-lg shadow-[#6f5c50]/5">
                <Quote className="mx-auto h-8 w-8 text-[#9a5d6c]" aria-hidden="true" />
                <p className={`${titleFont.className} mt-4 text-2xl text-[#304254]`}>Belum ada ucapan dititipkan.</p>
                <p className="mt-2 text-sm leading-6 text-[#6f786f]">Ucapan daripada borang RSVP akan dipaparkan di sini.</p>
              </div>
            )}
          </div>
        </section>

        <section id="hadiah" className="relative scroll-mt-6 overflow-hidden px-6 py-24">
          <BotanicalCorner className="pointer-events-none absolute -bottom-20 -left-14 w-60 opacity-30 sm:w-80" />
          <BotanicalCorner className="pointer-events-none absolute -right-14 -top-20 w-60 rotate-180 opacity-30 sm:w-80" />
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
                    <div key={item.id} className={`rounded-lg border p-5 transition ${fullyFunded ? "border-[#93a38e]/40 bg-[#e4ebe1]" : "border-[#9a5d6c]/15 bg-white/70"}`}>
                      <div className="flex items-center gap-4">
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${fullyFunded ? "bg-[#778b78] text-white" : "bg-[#ead9dc] text-[#814a58]"}`}>
                          {fullyFunded ? <Check className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#304254]">{item.name}</p>
                          <p className="mt-0.5 text-xs text-[#777e78]">{fullyFunded ? "Sasaran sumbangan telah dicapai" : "Terbuka untuk sumbangan bersama"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openContribution(item.id)}
                          disabled={fullyFunded}
                          className="rounded-full bg-[#304254] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#455d72] disabled:cursor-not-allowed disabled:bg-[#778b78]"
                        >
                          {fullyFunded ? "Lengkap" : "Sumbang"}
                        </button>
                      </div>
                      <div className="mt-5">
                        <div className="mb-2 flex items-end justify-between gap-4 text-xs">
                          <span className="font-semibold text-[#304254]">
                            {formatRinggit(item.contribution.contributed)} / {formatRinggit(item.contribution.target)}
                          </span>
                          <span className="font-bold text-[#9a5d6c]">{percentage.toFixed(1)}%</span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-[#e7dfd4]"
                          role="progressbar"
                          aria-label={`Kemajuan sumbangan untuk ${item.name}`}
                          aria-valuemin={0}
                          aria-valuemax={item.contribution.target}
                          aria-valuenow={item.contribution.contributed}
                        >
                          <div className="h-full rounded-full bg-[#9a5d6c] transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className={`flex items-center gap-4 rounded-lg border p-4 transition ${item.claimed ? "border-[#93a38e]/40 bg-[#e4ebe1]" : "border-[#9a5d6c]/15 bg-white/70"}`}>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.claimed ? "bg-[#778b78] text-white" : "bg-[#ead9dc] text-[#814a58]"}`}>
                      {item.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${item.claimed ? "text-[#718077] line-through" : "text-[#304254]"}`}>{item.name}</p>
                      <p className="mt-0.5 text-xs text-[#777e78]">{item.claimed ? "Sudah dipilih oleh tetamu" : "Masih tersedia"}</p>
                    </div>
                    <button type="button" onClick={() => toggleGift(item.id)} className="rounded-full border border-[#304254]/15 px-4 py-2 text-xs font-bold">
                      {item.claimed ? "Batalkan" : "Saya pilih"}
                    </button>
                  </div>
                );
              })}
            </div>
            <form onSubmit={addGift} className="mt-6 flex gap-3 rounded-lg border border-dashed border-[#9a5d6c]/40 bg-white/40 p-3">
              <input value={newGift} onChange={(event) => setNewGift(event.target.value)} placeholder="Hadiah lain yang anda ingin berikan" aria-label="Hadiah lain yang anda ingin berikan" className="min-w-0 flex-1 border-0 bg-transparent focus:ring-0" />
              <button aria-label="Simpan pilihan hadiah" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#9a5d6c] text-white"><Plus className="h-5 w-5" /></button>
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
            <div className="relative my-6 w-full max-w-md rounded-sm bg-[#fff8ef] p-6 shadow-2xl sm:p-8">
              <button
                type="button"
                onClick={closeContribution}
                aria-label="Tutup"
                className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-[#f3dde1] text-[#304254] transition hover:bg-[#e2d8ca]"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9a5d6c]">Sumbangan hadiah</p>
              <h2 id="contribution-title" className={`${titleFont.className} mt-2 pr-12 text-4xl font-medium text-[#304254]`}>{selectedGift.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6f786f]">Sekiranya tuan/puan ingin menyumbang buat hadiah pengantin, imbas kod DuitNow, buat pembayaran, kemudian catat jumlah sumbangan.</p>

              <div className="mx-auto mt-6 w-full max-w-[240px] overflow-hidden rounded-lg border border-[#304254]/10 bg-white p-3 shadow-sm">
                <img src={selectedGift.contribution.duitNowQr} alt="Kod QR DuitNow untuk sumbangan hadiah" className="aspect-square h-auto w-full" />
              </div>

              <form onSubmit={submitContribution} className="mt-6">
                <label htmlFor="contribution-amount" className="text-sm font-semibold text-[#304254]">Jumlah yang telah disumbangkan</label>
                <div className="mt-2 flex overflow-hidden rounded-sm border border-[#304254]/15 bg-white focus-within:border-[#9a5d6c] focus-within:ring-1 focus-within:ring-[#9a5d6c]">
                  <span className="grid place-items-center border-r border-[#304254]/10 px-4 text-sm font-bold text-[#68776d]">RM</span>
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
                <button className="mt-5 w-full rounded-full bg-[#9a5d6c] px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#814a58]">
                  Saya telah menyumbang
                </button>
              </form>
            </div>
          </div>
        )}

        {showSalam && (
          <section id="salam-kaut" className="relative scroll-mt-6 overflow-hidden border-y border-[#b7a16e]/40 bg-[#304254] px-6 py-24 text-white">
            <BotanicalCorner className="pointer-events-none absolute -left-12 -top-16 w-64 rotate-90 opacity-25 sm:w-80" />
            <BotanicalCorner className="pointer-events-none absolute -bottom-16 -right-12 w-64 -rotate-90 opacity-25 sm:w-80" />
            <div className="relative">
              <SectionTitle eyebrow="Tanda ingatan buat pengantin" light>Salam Kaut</SectionTitle>
              <div className="mx-auto max-w-xl rounded-sm border-4 border-double border-[#e8d8b5]/25 bg-white/5 p-7 text-center backdrop-blur sm:p-10">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#fff8ef] text-[#304254]"><QrCode className="h-10 w-10" /></span>
                <h3 className={`${titleFont.className} mt-6 text-4xl font-medium text-[#e8d8b5]`}>Sedikit tanda ingatan</h3>
                <p className="mt-4 leading-7 text-white/70">Sekiranya tuan/puan berhasrat berkongsi rezeki buat pasangan pengantin, silakan imbas kod DuitNow ini. Kehadiran dan doa restu tuan/puan tetap menjadi hadiah yang paling bermakna.</p>
                <div className="mx-auto mt-7 w-full max-w-[260px] overflow-hidden rounded-lg border border-white/15 bg-white p-3 shadow-xl shadow-black/15">
                  <img src="/images/duitnow-qr-placeholder.svg" alt="Kod QR DuitNow untuk Salam Kaut" className="aspect-square h-auto w-full" />
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-[#b7a16e]/25 px-6 py-20 text-center">
          <Ornament />
          <Heart className="mx-auto mt-2 h-5 w-5 fill-[#9a5d6c] text-[#9a5d6c]" />
          <p className={`${titleFont.className} mt-5 text-4xl font-medium text-[#304254]`}>Kehadiran tuan dan puan amat kami hargai.</p>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#6f786f]">Dengan ingatan tulus daripada {wedding.hosts}.</p>
          <p className={`${namesFont.className} mt-7 text-5xl text-[#806b62]`}>{wedding.bride} & {wedding.groom}</p>
        </footer>
        </main>
      )}
    </>
  );
}
