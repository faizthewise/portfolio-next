"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  "/images/memories/luge_1.jpg",
  "/images/memories/extra_5.jpeg",
  "/images/memories/genting_2.jpg",
  "/images/memories/random_3.jpg",
  "/images/memories/extra_4.jpeg",
  "/images/memories/dinner_1.jpg",
  "/images/memories/luge_2.jpeg",
  "/images/memories/pilates.jpg",
  "/images/memories/extra_3.jpeg",
  "/images/memories/genting_1.jpg",
  "/images/memories/dinner_2.jpg",
  "/images/memories/extra_2.jpeg",
  "/images/memories/random_1.jpg",
  "/images/memories/luge_3.jpeg",
  "/images/memories/extra_1.jpeg",

  // Add more image paths here
];

const harissaImages = [
  "/images/harissa-1.jpeg",
  "/images/harissa-2.jpeg",
  "/images/harissa-3.jpeg",
  "/images/harissa-4.jpeg",
];

export default function ProposalPage() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [showStory, setShowStory] = useState(false);

  const handleStart = () => {
    audioRef.current
      ?.play()
      .catch((err) => console.warn("Playback failed:", err));
    setShowStory(true);
  };

  const [step, setStep] = useState<
    "default" | "confirm" | "rejected" | "accepted"
  >("default");

  useEffect(() => {
    const stored = localStorage.getItem("hasSaidYes");
    if (stored === "true") {
      setStep("accepted");
    }
  }, []);

  const handleAccept = () => {
    setStep("accepted");
    localStorage.setItem("hasSaidYes", "true");
  };

  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const prevSlide = () => {
    setDirection("left");
    setSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextSlide = () => {
    setDirection("right");
    setSlide((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="bg-pink-50 text-gray-800">
      {/* Intro overlay */}
      {!showStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-50 text-center p-8 transition-opacity duration-500">
          <div className="max-w-lg">
            <h1 className="text-3xl font-bold text-pink-700 mb-6">
              Are you ready for something beautiful?
            </h1>
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-xl shadow-md hover:bg-pink-600 transition"
            >
              Yes, I am!
            </button>
          </div>
        </div>
      )}

      <audio autoPlay ref={audioRef}>
        <source src="/audio/invisible-string.mp3" type="audio/mpeg" />
      </audio>

      <section className="min-h-screen flex items-center justify-center flex-col p-8 text-center bg-gradient-to-b from-pink-200 to-pink-50 relative">
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
        <p className="mt-4 mb-16 max-w-xl text-xl font-medium text-gray-700 leading-relaxed">
          That little baby didn’t just grow up — she became incredibly smart,
          beautiful, and (hold on... yep, confirmed){" "}
          <span className="italic">funny</span> too.{" "}
          <span className="font-semibold text-pink-600">Totally unfair 😄</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {harissaImages.map((src, index) => (
            <div
              key={index}
              className="w-[200px] h-[200px] relative rounded-xl shadow-md overflow-hidden"
            >
              <Image
                src={src}
                alt={`pretty-${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          And then... there’s me.
        </h2>

        <Image
          src="/images/me.png"
          alt="Funny me"
          width={220}
          height={220}
          className="rounded-full object-cover shadow-xl border-4 border-pink-200"
        />

        <p className="mt-6 text-sm text-gray-500 italic">
          (Don't laugh... okay maybe just a little.)
        </p>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-pink-100 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-pink-800 drop-shadow-sm">
          And somehow, fate decided this incredible woman should meet... me
        </h2>
        <p className="mt-24 max-w-2xl text-lg md:text-xl text-pink-900 leading-relaxed">
          It all began at an uneventful blood donation event, such a simple
          encounter that left an unforgettable moment for both of us.
        </p>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-pink-900 leading-relaxed">
          Life had other plans though, and fate gently pulled us apart... only
          to bring us back together{" "}
          <span className="font-semibold">EIGHT YEARS LATER</span>!
        </p>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-pink-900 leading-relaxed">
          I messed up so bad during our first date. Like who would spills coffee
          in their first date??
        </p>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-pink-900 leading-relaxed">
          I can ask anyone and they would say it's like a K-drama plot but it's
          magically real ✨ like there's an
          <span className="italic"> invisible string tying you to me~</span>
        </p>
      </section>

      <section className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-blue-200 text-center flex flex-col items-center justify-center">
        <h2 className="text-3xl font-extrabold text-pink-700 mb-8">
          Our memories together so far 📸
        </h2>

        <div className="relative w-full max-w-4xl mx-auto">
          {/* Slider container */}
          <div className="relative overflow-hidden rounded-xl shadow-lg bg-gray-100 aspect-[16/9]">
            <div
              key={slide}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out transform ${
                direction === "right"
                  ? "translate-x-0 animate-slide-in-left"
                  : "translate-x-0 animate-slide-in-right"
              }`}
            >
              <Image
                src={images[slide]}
                alt={`Memory ${slide + 1}`}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Arrows outside */}
          <div className="flex justify-between items-center mt-6 px-8">
            <button
              onClick={prevSlide}
              className="bg-pink-200 hover:bg-pink-300 text-pink-800 p-3 rounded-full shadow transition"
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="bg-pink-200 hover:bg-pink-300 text-pink-800 p-3 rounded-full shadow transition"
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-pink-200 text-center">
        <h2 className="text-2xl font-bold">I love you ❤️</h2>
        <p className="mt-4 max-w-xl text-lg">
          I have been really happy since you came into my life. I enjoy every
          moment I spent with you and wish I could spend even more.
        </p>
        <p className="mt-4 max-w-xl text-lg">
          I love seeing your beautiful face, the gorgeous curls of your hair,
          the shiny eyes of yours, the softness your hands. I love the way your
          lips curl when you smile when you're shy.
        </p>
        <p className="mt-4 max-w-xl text-lg">
          I love how smart you are. I love the way you talk, the way you laugh.
          I love everything about you and more.
        </p>
        <p className="mt-4 max-w-xl text-lg">
          I know I have a lot of flaws. I'm really sorry I'm giving you a hard
          time because of that. But I promise you I'm trying to be better for
          you.
        </p>
        <p className="mt-4 max-w-xl text-lg">
          Thank you for being you and for letting me be part of your story.
        </p>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
        {step === "accepted" ? (
          <>
            <p className="text-lg text-gray-700 mb-4">
              Thank you for saying yes. I'll love you with all my heart and take
              care of you. Let's be happy together 💖
            </p>
            <h2 className="text-2xl font-bold text-pink-600">I love you 🥰</h2>
          </>
        ) : (
          <>
            <p className="text-lg text-gray-700 mb-4">
              I want to keep on being by your side and build more memories with
              you.
            </p>
            <h2 className="text-2xl font-bold mb-6">
              Would you like to be my girlfriend?
            </h2>

            {step === "default" && (
              <div className="flex gap-6">
                <button
                  onClick={() => setStep("confirm")}
                  className="bg-red-400 hover:bg-red-500 text-white px-6 py-3 rounded-full text-lg shadow"
                >
                  No 😢
                </button>
                <button
                  onClick={handleAccept}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full text-lg shadow"
                >
                  Yes 💖
                </button>
              </div>
            )}

            {/* Modal Overlay */}
            {(step === "confirm" || step === "rejected") && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg px-8 py-6 max-w-sm w-full text-center">
                  {step === "confirm" && (
                    <>
                      <p className="text-lg mb-4">
                        Are you sure you want to say "No"?
                      </p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => setStep("default")}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-full"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setStep("rejected")}
                          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full"
                        >
                          Yes, I'm sure 😢
                        </button>
                      </div>
                    </>
                  )}

                  {step === "rejected" && (
                    <>
                      <p className="text-xl font-semibold text-red-600 mb-4">
                        Unfortunately, this system does not support saying no.
                        😅
                      </p>
                      <button
                        onClick={() => setStep("default")}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-full"
                      >
                        Try again
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
