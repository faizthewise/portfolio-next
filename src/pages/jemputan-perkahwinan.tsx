import Head from "next/head";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Gift,
  Heart,
  MapPin,
  Plus,
  QrCode,
  Sparkles,
} from "lucide-react";

const wedding = {
  bride: "Harissa",
  groom: "Faiz",
  date: new Date("2026-11-28T11:30:00+08:00"),
  dateLabel: "Sabtu, 28 November 2026",
  timeLabel: "11.30 pagi",
  venue: "LeQAMR Melaka",
  mapQuery: "LeQAMR Melaka",
};

type GiftItem = {
  id: string;
  name: string;
  claimed: boolean;
};

const initialGifts: GiftItem[] = [
  { id: "air-fryer", name: "Air fryer", claimed: false },
  { id: "dinnerware", name: "Set pinggan mangkuk", claimed: false },
  { id: "vacuum", name: "Penyedut hampagas", claimed: false },
  { id: "bedding", name: "Set cadar king", claimed: false },
  { id: "coffee", name: "Mesin kopi", claimed: false },
];

function Ornament() {
  return (
    <svg viewBox="0 0 240 70" aria-hidden="true" className="mx-auto h-16 w-52 text-[#b66a4a]">
      <path d="M12 42c35-1 41-28 71-18 20 7 20 27 37 27s17-20 37-27c30-10 36 17 71 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M76 28c-9-18-25-18-32-7 16-1 25 5 32 7Zm88 0c9-18 25-18 32-7-16-1-25 5-32 7Z" fill="currentColor" opacity=".55" />
      <circle cx="120" cy="51" r="3.5" fill="currentColor" />
    </svg>
  );
}

function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: ReactNode; light?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-xl text-center">
      <p className={`text-[11px] font-bold uppercase tracking-[0.32em] ${light ? "text-[#efc6ac]" : "text-[#b66a4a]"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-serif text-3xl sm:text-4xl ${light ? "text-[#f8f1e6]" : "text-[#183d3d]"}`}>{children}</h2>
      <Ornament />
    </div>
  );
}

export default function JemputanPerkahwinan() {
  const [showSalam, setShowSalam] = useState(false);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>(initialGifts);
  const [newGift, setNewGift] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowSalam(params.get("salam") === "1");

    const savedGifts = window.localStorage.getItem("faiz-harissa-wedding-gifts");
    if (savedGifts) {
      try {
        setGifts(JSON.parse(savedGifts));
      } catch {
        setGifts(initialGifts);
      }
    }
  }, []);

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

  const addGift = (event: FormEvent) => {
    event.preventDefault();
    const name = newGift.trim();
    if (!name) return;
    saveGifts([...gifts, { id: `${Date.now()}`, name, claimed: false }]);
    setNewGift("");
  };

  const submitRsvp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entries = JSON.parse(window.localStorage.getItem("faiz-harissa-wedding-rsvp") || "[]");
    entries.push(Object.fromEntries(form.entries()));
    window.localStorage.setItem("faiz-harissa-wedding-rsvp", JSON.stringify(entries));
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
        <title>{wedding.groom} & {wedding.bride} — Jemputan Perkahwinan</title>
        <meta name="description" content={`Jemputan ke majlis perkahwinan ${wedding.groom} dan ${wedding.bride} pada 28 November 2026.`} />
      </Head>

      <main className="min-h-screen bg-[#f6f0e5] text-[#284343] selection:bg-[#d9b49f]">
        <section className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-16 text-center">
          <div className="absolute inset-4 rounded-[2.5rem] border border-[#b66a4a]/25 sm:inset-7" />
          <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[#d7a98f]/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-12 h-80 w-80 rounded-full bg-[#759b8f]/25 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[#b66a4a]">Walimatulurus</p>
            <p className="mt-8 font-serif text-xl italic text-[#55736d]">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
            <h1 className="mt-8 font-serif text-6xl leading-none text-[#183d3d] sm:text-8xl">
              {wedding.groom}
              <span className="mx-auto my-3 block font-sans text-2xl font-light text-[#b66a4a]">&</span>
              {wedding.bride}
            </h1>
            <Ornament />
            <p className="mx-auto mt-3 max-w-lg text-base leading-8 text-[#55736d]">
              Dengan penuh kesyukuran, kami menjemput anda untuk bersama-sama meraikan permulaan perjalanan kami sebagai suami dan isteri.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="#lokasi" className="inline-flex items-center gap-2 rounded-full border border-[#183d3d]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[#183d3d] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b66a4a]">
                <MapPin className="h-4 w-4" /> Lokasi
              </a>
              <a href="#rsvp" className="inline-flex items-center gap-2 rounded-full bg-[#183d3d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#285754]">
                <Heart className="h-4 w-4" /> RSVP
              </a>
              <a href="#hadiah" className="inline-flex items-center gap-2 rounded-full border border-[#183d3d]/15 bg-white/65 px-5 py-3 text-sm font-semibold text-[#183d3d] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b66a4a]">
                <Gift className="h-4 w-4" /> Hadiah
              </a>
              {showSalam && (
                <a href="#salam-kaut" className="inline-flex items-center gap-2 rounded-full border border-[#b66a4a]/30 bg-[#b66a4a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#9d583d]">
                  <QrCode className="h-4 w-4" /> Salam Kaut
                </a>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-[#183d3d]">
              <span>{wedding.dateLabel}</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#b66a4a] sm:block" />
              <span>{wedding.timeLabel}</span>
            </div>
            <a href="#butiran" className="mx-auto mt-12 grid h-12 w-12 place-items-center rounded-full border border-[#b66a4a]/40 text-[#b66a4a] transition hover:-translate-y-1 hover:bg-white/60" aria-label="Lihat butiran majlis">
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>
        </section>

        <section id="butiran" className="bg-[#173f3d] px-6 py-24 text-[#f8f1e6]">
          <SectionTitle eyebrow="Simpan tarikhnya" light>Hari yang dinantikan</SectionTitle>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            {[["Hari", countdown.hari], ["Jam", countdown.jam], ["Minit", countdown.minit]].map(([label, value]) => (
              <div key={label} className="rounded-[2rem] border border-white/15 bg-white/5 p-7 text-center backdrop-blur">
                <strong className="block font-serif text-5xl text-[#efc6ac]">{value}</strong>
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
              <div key={label} className="flex items-center gap-4 rounded-2xl bg-[#f8f1e6] p-5 text-[#183d3d]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e7c8b4]"><Icon className="h-5 w-5" /></span>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Majlis Perkahwinan ${wedding.groom} & ${wedding.bride}`)}&dates=20261128T113000/20261128T123000&ctz=Asia%2FKuala_Lumpur&location=${encodeURIComponent(wedding.venue)}&details=${encodeURIComponent("Dengan penuh kesyukuran, kami menjemput anda untuk bersama-sama meraikan hari istimewa kami.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#efc6ac]/30 bg-[#efc6ac] px-6 py-3.5 text-sm font-bold text-[#173f3d] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#f6d6c1]"
            >
              <CalendarDays className="h-4 w-4" /> Tambah ke Google Calendar
            </a>
          </div>
        </section>

        <section id="lokasi" className="scroll-mt-6 px-6 py-24">
          <SectionTitle eyebrow="Petunjuk jalan">Jumpa kami di Melaka</SectionTitle>
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#b66a4a]/20 bg-white/65 p-6 shadow-xl shadow-[#8b6b55]/5 sm:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <MapPin className="h-9 w-9 text-[#b66a4a]" />
                <h3 className="mt-4 font-serif text-3xl text-[#183d3d]">{wedding.venue}</h3>
                <p className="mt-3 max-w-lg leading-7 text-[#667a75]">Pilih aplikasi navigasi pilihan anda untuk mendapatkan arah terus ke lokasi majlis.</p>
              </div>
              <div className="grid gap-3">
                {maps.map((map) => (
                  <a key={map.name} href={map.href} target="_blank" rel="noreferrer" className="flex min-w-[190px] items-center justify-between rounded-full border border-[#183d3d]/15 bg-white px-5 py-3 font-medium transition hover:-translate-y-0.5 hover:border-[#b66a4a]">
                    {map.name}<ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="rsvp" className="scroll-mt-6 bg-[#e7ded0] px-6 py-24">
          <SectionTitle eyebrow="Maklum balas">RSVP</SectionTitle>
          <form onSubmit={submitRsvp} className="mx-auto grid max-w-2xl gap-5 rounded-[2rem] bg-[#fffaf2] p-6 shadow-xl shadow-[#826a56]/10 sm:p-10">
            <label className="grid gap-2 text-sm font-semibold">Nama
              <input name="nama" required placeholder="Nama anda" className="rounded-xl border-[#183d3d]/15 bg-white focus:border-[#b66a4a] focus:ring-[#b66a4a]" />
            </label>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Kehadiran</legend>
              <div className="grid grid-cols-2 gap-3">
                {["Hadir, insya-Allah", "Maaf, tidak dapat hadir"].map((answer, index) => (
                  <label key={answer} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#183d3d]/15 bg-white p-4 text-sm">
                    <input type="radio" name="kehadiran" value={answer} required defaultChecked={index === 0} className="text-[#b66a4a] focus:ring-[#b66a4a]" />{answer}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-semibold">Jumlah tetamu
              <select name="tetamu" className="rounded-xl border-[#183d3d]/15 bg-white focus:border-[#b66a4a] focus:ring-[#b66a4a]">
                {[1, 2, 3, 4, 5].map((count) => <option key={count}>{count}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Ucapan buat pengantin
              <textarea name="ucapan" rows={4} placeholder="Titipkan doa dan ucapan..." className="rounded-xl border-[#183d3d]/15 bg-white focus:border-[#b66a4a] focus:ring-[#b66a4a]" />
            </label>
            <button className="mt-2 rounded-full bg-[#183d3d] px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#285754]">Hantar RSVP</button>
            {rsvpSent && <p className="text-center text-sm font-medium text-[#49776c]">Terima kasih. Jawapan anda telah diterima.</p>}
          </form>
        </section>

        <section id="hadiah" className="scroll-mt-6 px-6 py-24">
          <SectionTitle eyebrow="Buah tangan">Senarai hadiah</SectionTitle>
          <div className="mx-auto max-w-3xl">
            <p className="mx-auto -mt-6 mb-10 max-w-xl text-center leading-7 text-[#667a75]">Doa dan kehadiran anda sudah cukup bermakna. Jika ingin memberi hadiah, senarai kecil ini boleh membantu.</p>
            <div className="grid gap-3">
              {gifts.map((item) => (
                <div key={item.id} className={`flex items-center gap-4 rounded-2xl border p-4 transition ${item.claimed ? "border-[#86a79e]/40 bg-[#dce8e2]" : "border-[#b66a4a]/15 bg-white/70"}`}>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.claimed ? "bg-[#73978d] text-white" : "bg-[#edd8c9] text-[#9d583d]"}`}>
                    {item.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${item.claimed ? "text-[#617770] line-through" : "text-[#183d3d]"}`}>{item.name}</p>
                    <p className="mt-0.5 text-xs text-[#75837f]">{item.claimed ? "Sudah dipilih oleh tetamu" : "Masih tersedia"}</p>
                  </div>
                  <button onClick={() => toggleGift(item.id)} className="rounded-full border border-[#183d3d]/15 px-4 py-2 text-xs font-bold">
                    {item.claimed ? "Batalkan" : "Saya pilih"}
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addGift} className="mt-6 flex gap-3 rounded-2xl border border-dashed border-[#b66a4a]/40 bg-white/40 p-3">
              <input value={newGift} onChange={(event) => setNewGift(event.target.value)} placeholder="Cadangkan hadiah lain" className="min-w-0 flex-1 border-0 bg-transparent focus:ring-0" />
              <button aria-label="Tambah hadiah" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#b66a4a] text-white"><Plus className="h-5 w-5" /></button>
            </form>
          </div>
        </section>

        {showSalam && (
          <section id="salam-kaut" className="scroll-mt-6 bg-[#173f3d] px-6 py-24 text-white">
            <SectionTitle eyebrow="Untuk yang mencari" light>Salam Kaut</SectionTitle>
            <div className="mx-auto max-w-xl rounded-[2rem] border border-white/15 bg-white/5 p-7 text-center backdrop-blur sm:p-10">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#f6f0e5] text-[#183d3d]"><QrCode className="h-10 w-10" /></span>
              <h3 className="mt-6 font-serif text-3xl text-[#efc6ac]">Sedikit tanda ingatan</h3>
              <p className="mt-4 leading-7 text-white/70">Jika anda ingin berkongsi rezeki, imbas kod DuitNow kami. Doa dan ingatan baik anda tetap hadiah yang paling bermakna.</p>
              <div className="mt-7 rounded-2xl border border-dashed border-white/25 p-8 text-sm text-white/55">Letakkan imej QR DuitNow di sini</div>
            </div>
          </section>
        )}

        <footer className="px-6 py-20 text-center">
          <Heart className="mx-auto h-6 w-6 fill-[#b66a4a] text-[#b66a4a]" />
          <p className="mt-5 font-serif text-3xl text-[#183d3d]">Terima kasih kerana menjadi sebahagian daripada hari kami.</p>
          <p className="mt-4 text-sm uppercase tracking-[0.25em] text-[#8c7161]">{wedding.groom} & {wedding.bride} · 28.11.2026</p>
        </footer>
      </main>
    </>
  );
}
