"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  KeyRound,
  Sparkles,
} from "lucide-react";

const placeholder = "/images/anniversary-placeholder.svg";

const firstYearMemories = [
  { src: placeholder, title: "Our little adventures", note: "The places were lovely, but you were always my favourite view." },
  { src: placeholder, title: "The ordinary days", note: "Even the simplest days became memories because I spent them with you." },
  { src: placeholder, title: "All our laughter", note: "Thank you for making this year feel lighter, warmer, and so full of joy." },
  { src: placeholder, title: "Growing together", note: "Through every season, I kept finding new reasons to love you." },
  { src: placeholder, title: "Our favourite dates", note: "Every date with you gave me another moment I wanted to keep." },
  { src: placeholder, title: "Just being us", note: "My favourite memories are the ones where we were completely ourselves." },
];

const engagementPhotos = [
  { src: "/images/anniversary/engagement-2.jpg", caption: "The official start of our forever." },
  { src: "/images/anniversary/engagement-3.jpg", caption: "You have no idea how beautiful you are." },
  { src: "/images/anniversary/engagement-5.jpg", caption: "So happy to have a ring to match yours." },
  { src: "/images/anniversary/engagement-4.jpg", caption: "Even from far, we look sweet together." },
];

const homePhotos = [
  { src: placeholder, label: "Home expo", caption: "Dreaming about every little corner." },
  { src: placeholder, label: "Finding ideas", caption: "Choosing what our future could look like." },
  { src: placeholder, label: "Our house", caption: "Standing where so many memories will be made." },
  { src: "/images/anniversary/key-day.jpg", label: "Key day", caption: "The first key to our first home together." },
];

function ArrowButton({ direction, onClick, light = false }: { direction: "previous" | "next"; onClick: () => void; light?: boolean }) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button onClick={onClick} aria-label={`${direction} photo`} className={`grid h-11 w-11 place-items-center rounded-full border transition hover:scale-105 ${light ? "border-white/30 bg-white/10 text-white hover:bg-white/20" : "border-rose-200 bg-white text-rose-700 shadow-sm hover:bg-rose-50"}`}>
      <Icon className="h-5 w-5" />
    </button>
  );
}

function YearFilmstrip() {
  const [active, setActive] = useState(0);
  const move = (amount: number) => setActive((current) => (current + amount + firstYearMemories.length) % firstYearMemories.length);
  const memory = firstYearMemories[active];

  return (
    <div className="overflow-hidden rounded-[2rem] bg-stone-900 py-5 shadow-2xl shadow-rose-900/20">
      <div className="mb-5 flex gap-5 overflow-hidden px-5" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => <span key={index} className="h-3 min-w-[2.25rem] rounded-sm bg-[#fffaf7]" />)}
      </div>
      <div className="grid items-center gap-7 px-5 md:grid-cols-[1fr_0.55fr] md:px-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-rose-50">
          <Image key={memory.src + active} src={memory.src} alt={memory.title} fill className="object-cover" />
          <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold tracking-widest text-white backdrop-blur-sm">{String(active + 1).padStart(2, "0")} / {String(firstYearMemories.length).padStart(2, "0")}</span>
        </div>
        <div className="pb-4 text-white md:pb-0">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-300">From our camera roll</p>
          <h3 className="mt-4 font-serif text-3xl md:text-4xl">{memory.title}</h3>
          <p className="mt-4 leading-7 text-stone-300">{memory.note}</p>
          <div className="mt-8 flex items-center gap-3">
            <ArrowButton direction="previous" onClick={() => move(-1)} light />
            <ArrowButton direction="next" onClick={() => move(1)} light />
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-5 overflow-hidden px-5" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => <span key={index} className="h-3 min-w-[2.25rem] rounded-sm bg-[#fffaf7]" />)}
      </div>
    </div>
  );
}

function EngagementSlideshow() {
  const [active, setActive] = useState(0);
  const move = (amount: number) => setActive((current) => (current + amount + engagementPhotos.length) % engagementPhotos.length);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="relative mb-10 aspect-[4/3]">
        <div className="absolute inset-5 rotate-6 rounded-sm bg-rose-300/30" />
        <div className="absolute inset-3 -rotate-3 rounded-sm bg-rose-100/20" />
        <figure className="absolute inset-0 -rotate-1 rounded-sm bg-white p-3 pb-12 shadow-2xl transition-transform duration-500 hover:rotate-0">
          <div className="relative h-full overflow-hidden bg-rose-50"><Image key={active} src={engagementPhotos[active].src} alt={`Engagement memory ${active + 1}`} fill className="object-cover" /></div>
          <figcaption className="absolute inset-x-5 bottom-3 text-center font-serif text-lg italic text-rose-900">{engagementPhotos[active].caption}</figcaption>
        </figure>
      </div>
      <div className="flex items-center justify-center gap-4">
        <ArrowButton direction="previous" onClick={() => move(-1)} light />
        <div className="flex gap-2">{engagementPhotos.map((_, index) => <button key={index} onClick={() => setActive(index)} aria-label={`Show engagement photo ${index + 1}`} className={`h-2 rounded-full transition-all ${index === active ? "w-7 bg-rose-300" : "w-2 bg-white/30"}`} />)}</div>
        <ArrowButton direction="next" onClick={() => move(1)} light />
      </div>
    </div>
  );
}

function HomeScrapbook() {
  const [active, setActive] = useState(0);
  const photo = homePhotos[active];

  return (
    <div className="relative rounded-2xl bg-[#d8c3ad] p-4 shadow-xl md:p-7">
      <div className="absolute -top-3 left-1/2 h-8 w-28 -translate-x-1/2 rotate-2 bg-amber-100/70 shadow-sm" />
      <div className="rounded-xl bg-[radial-gradient(#c9b198_1px,transparent_1px)] bg-[length:18px_18px] p-3 md:p-6">
        <figure className="rotate-1 rounded-sm bg-white p-3 pb-7 shadow-lg">
          <div className="relative aspect-[4/3] overflow-hidden bg-rose-50"><Image key={active} src={photo.src} alt={photo.label} fill className="object-cover" /></div>
          <figcaption className="px-2 pt-5"><span className="font-serif text-2xl text-[#4c0519]">{photo.label}</span><p className="mt-1 text-sm text-stone-500">{photo.caption}</p></figcaption>
        </figure>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {homePhotos.map((item, index) => (
            <button key={index} onClick={() => setActive(index)} aria-label={`Show ${item.label}`} className={`relative aspect-square overflow-hidden rounded-md border-2 bg-white transition ${index === active ? "-translate-y-1 rotate-2 border-rose-600 shadow-md" : "border-white opacity-65 hover:opacity-100"}`}>
              <Image src={item.src} alt="" fill className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-stone-900/65 px-1 py-1 text-[9px] font-semibold text-white sm:text-xs">{index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OurFirstAnniversary() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [opened, setOpened] = useState(false);

  const openLetter = () => {
    setOpened(true);
    audioRef.current?.play().catch(() => undefined);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf7] text-stone-800 selection:bg-rose-200">
      {!opened && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#fff8f5] px-6 text-center">
          <div className="max-w-xl">
            <div className="mx-auto mb-7 grid h-20 w-20 place-items-center rounded-full bg-rose-100 text-rose-600 shadow-sm">
              <Heart className="h-9 w-9 fill-current" />
            </div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">For Harissa</p>
            <h1 className="font-serif text-4xl leading-tight text-[#4c0519] md:text-6xl">A year since you said yes</h1>
            <p className="mx-auto mt-5 max-w-md leading-relaxed text-stone-600">I made you something to remember how far we have come — and everything waiting for us ahead.</p>
            <button onClick={openLetter} className="mt-9 rounded-full bg-rose-600 px-7 py-3.5 font-medium text-white shadow-lg shadow-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-700">
              Open our story
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} loop>
        <source src="/audio/lifetime.mp3" type="audio/mpeg" />
      </audio>

      <section className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-100 via-[#fff8f5] to-[#fffaf7] px-6 py-24 text-center">
        <div className="absolute left-[8%] top-[16%] h-28 w-28 rounded-full bg-white/40 blur-xl" />
        <div className="absolute bottom-[20%] right-[5%] h-40 w-40 rounded-full bg-rose-200/40 blur-2xl" />
        <div className="relative max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-rose-500">20 July · One year ago</p>
          <h1 className="font-serif text-5xl leading-[1.08] text-[#4c0519] md:text-7xl">You clicked <span className="italic text-rose-600">yes</span>,<br />and my whole world changed.</h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">A year ago, you chose to be my girlfriend. I still feel incredibly lucky that you chose me — you have brought a million blessings into my life, through every laugh, every quiet moment, every lesson, and every bit of love we have shared since.</p>
        </div>
        <div className="absolute bottom-8 flex flex-col items-center gap-2 text-rose-500">
          <span className="text-xs uppercase tracking-[0.22em]">Our first chapter</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </section>

      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Sparkles className="mx-auto mb-5 h-7 w-7 text-amber-500" />
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-500">365 days of us</p>
            <h2 className="mt-4 font-serif text-4xl text-[#4c0519] md:text-5xl">A year I will always treasure</h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">We filled this year with so many moments — big adventures, quiet dates, silly conversations, and ordinary days that felt extraordinary simply because they were ours.</p>
          </div>
          <YearFilmstrip />
        </div>
      </section>

      <section className="bg-[#4c0519] px-6 py-24 text-rose-50 md:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
          <EngagementSlideshow />
          <div>
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-rose-800"><Heart className="h-6 w-6 fill-current" /></div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-rose-300">6 June · We got engaged</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">One step closer to forever.</h2>
            <p className="mt-7 text-lg leading-8 text-rose-100/80">That day, our promises became even bigger. We were no longer only dreaming about a life together — we were choosing it, planning it, and walking towards it hand in hand.</p>
            <p className="mt-5 text-lg leading-8 text-rose-100/80">Being your fiancé is one of the greatest honours of my life. I cannot wait for the day I get to call you my wife.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f4eee7] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-14 md:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="flex gap-3 text-rose-700"><Home className="h-8 w-8" /><KeyRound className="h-8 w-8" /></div>
              <p className="mt-7 text-sm font-bold uppercase tracking-[0.28em] text-rose-600">Our next little adventure</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#4c0519] md:text-5xl">Turning a house into our home.</h2>
              <p className="mt-6 text-lg leading-8 text-stone-600">From walking through home expos and imagining every corner, to finally holding the keys in our hands — we are building more than a house. We are making a place for slow mornings, shared dinners, laughter in every room, and a lifetime of coming home to each other.</p>
            </div>
            <HomeScrapbook />
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 via-white to-amber-50 px-6 py-24 text-center">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full border border-rose-200" />
        <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full border border-amber-200" />
        <div className="relative max-w-3xl">
          <CalendarDays className="mx-auto h-10 w-10 text-rose-600" />
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.3em] text-rose-500">28 November · Our wedding day</p>
          <h2 className="mt-5 font-serif text-5xl leading-tight text-[#4c0519] md:text-7xl">I cannot wait to marry you.</h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">I am excited for every part of that day — the moment our akad nikah makes us husband and wife, slipping the ring onto your finger, sitting beside you on the pelamin, and celebrating our sanding surrounded by the family and friends we love. But more than the wedding, I am excited for the marriage: for all the mornings, challenges, celebrations, and quiet but exciting years we will share after it.</p>
        </div>
      </section>

      <section className="bg-[#4c0519] px-6 py-28 text-center text-rose-50 md:py-36">
        <div className="mx-auto max-w-3xl">
          <Heart className="mx-auto h-8 w-8 fill-rose-400 text-rose-400" />
          <h2 className="mt-8 font-serif text-4xl md:text-6xl">My favourite story is still us.</h2>
          <div className="mx-auto mt-9 max-w-2xl space-y-6 text-lg leading-8 text-rose-100/80">
            <p>Thank you for saying yes a year ago. Thank you for trusting me with your heart, for growing beside me, and for choosing me again every day.</p>
            <p>Thank you for staying even when it was hard. Thank you for not giving up when I almost did. Thank you for your patience and understanding.</p>
            <p>In one year, you became my girlfriend, my fiancée, my future wife, and the person I get to build a home with. Somehow, every dream feels more real because you are in it.</p>
            <p>I do not know exactly what every chapter ahead will hold, but I know who I want beside me through all of them. Some people are only a season; you are my lifetime. Wherever life takes us, my home will always be wherever you are.</p>
          </div>
          <p className="mt-12 font-serif text-3xl italic text-rose-300">Happy anniversary, my love.</p>
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-rose-200/60">From your fiancé, with all my heart</p>
        </div>
      </section>
    </main>
  );
}
