"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import clsx from "clsx";

const images = [
  "/images/memories/luge_1.jpg",
  "/images/memories/luge_2.jpeg",
  "/images/memories/luge_3.jpeg",
  "/images/memories/dinner_1.jpg",
  // Add more image paths here
];

export default function ProposalPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasPlayed && window.scrollY > 100) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 30; // start from 30 seconds
          audio.play().catch((e) => {
            console.warn("Autoplay blocked:", e);
          });
          setHasPlayed(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasPlayed]);

  const [slide, setSlide] = useState(0);
  const [showNoPrompt, setShowNoPrompt] = useState(false);
  const [step, setStep] = useState<"default" | "confirm" | "rejected">(
    "default"
  );

  const nextSlide = () => setSlide((prev) => (prev + 1) % images.length);
  const prevSlide = () =>
    setSlide((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="bg-pink-50 text-gray-800">
      <audio autoPlay>
        <source src="/audio/invisible-string.mp3" type="audio/mpeg" />
      </audio>
      <section className="min-h-screen flex items-center justify-center flex-col p-8 text-center bg-gradient-to-b from-pink-100 to-pink-50 relative">
        <Image
          src="/images/baby-harissa.jpeg"
          alt="Baby"
          width={200}
          height={200}
          className="rounded-full shadow-lg"
        />
        <h1 className="mt-6 text-3xl font-bold">
          Once upon a time, there was the cutest baby in the world...
        </h1>
        <p className="mt-2 text-lg">And she grew up to be even more amazing.</p>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 flex flex-col items-center animate-bounce">
          <p className="text-sm text-pink-700 mb-1">
            Keep scrolling down for the full story
          </p>
          <svg
            className="w-6 h-6 text-pink-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="flex gap-6">
          <Image
            src="/grad.jpg"
            alt="Graduation"
            width={200}
            height={200}
            className="rounded-xl shadow-md"
          />
          <Image
            src="/working.jpg"
            alt="Working life"
            width={200}
            height={200}
            className="rounded-xl shadow-md"
          />
        </div>
        <h2 className="mt-6 text-2xl font-semibold">
          From graduation to conquering the working world
        </h2>
        <p className="mt-2 text-md">
          You continue to inspire me every day 💼🎓
        </p>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-pink-100 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-pink-800 drop-shadow-sm">
          Then, something magical happened ✨
        </h2>
        <p className="mt-6 max-w-2xl text-lg md:text-xl text-pink-900 leading-relaxed">
          It all began at a simple blood donation event, such a simple moment
          that left a quiet spark in both of us.
          <br className="hidden md:block" />
          Life had other plans, and fate gently pulled us apart... only to bring
          us back together{" "}
          <span className="font-semibold">EIGHT YEARS LATER</span>.
          <br className="hidden md:block" />
          When we met again, it felt as though no time had passed — like destiny
          was gently tugging on an
          <span className="italic"> invisible string tying you to me.</span>
        </p>
      </section>

      <section className="min-h-screen p-8 bg-white text-center">
        <h2 className="text-2xl font-bold mb-4">
          Our memories together so far 📸
        </h2>
        <div className="relative w-full max-w-lg mx-auto">
          <Image
            src={images[slide]}
            alt={`Memory ${slide + 1}`}
            width={500}
            height={500}
            className="rounded-lg shadow-md"
          />
          <div className="flex justify-between mt-4">
            <button
              onClick={prevSlide}
              className="bg-pink-200 hover:bg-pink-300 text-pink-900 px-4 py-2 rounded-full shadow"
            >
              ⬅️ Previous
            </button>
            <button
              onClick={nextSlide}
              className="bg-pink-200 hover:bg-pink-300 text-pink-900 px-4 py-2 rounded-full shadow"
            >
              Next ➡️
            </button>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-pink-50 text-center">
        <h2 className="text-2xl font-bold">I love you ❤️</h2>
        <p className="mt-4 max-w-xl text-lg">
          Thank you for being you. For the laughter, the support, and for
          letting me be part of your story.
        </p>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
        <h2 className="text-2xl font-bold mb-6">
          Would you like to be my girlfriend?
        </h2>

        {step === "default" && (
          <div className="flex gap-6">
            <button
              onClick={() => alert("YAY! 🥰")}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full text-lg shadow"
            >
              Yes 💖
            </button>
            <button
              onClick={() => setStep("confirm")}
              className="bg-red-400 hover:bg-red-500 text-white px-6 py-3 rounded-full text-lg shadow"
            >
              No 😢
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Are you sure you want to say "No"?</p>
            <button
              onClick={() => setStep("rejected")}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full text-lg shadow"
            >
              Yes, I'm sure
            </button>
          </div>
        )}

        {step === "rejected" && (
          <p className="mt-4 text-xl font-semibold text-red-600">
            Unfortunately, this system does not support saying no. 😅
          </p>
        )}
      </section>
    </div>
  );
}
