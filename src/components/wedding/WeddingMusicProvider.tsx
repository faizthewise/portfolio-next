import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import { playMohorOpening } from "@/lib/wedding/mohorOpening";

type OpeningCallbacks = {
  reducedMotion: boolean;
  onReveal: () => void;
  onOpen: () => void;
};

type WeddingMusic = {
  musicPlaying: boolean;
  openingSoundPlaying: boolean;
  invitationOpened: boolean;
  revealInvitation: () => void;
  startOpening: (callbacks: OpeningCallbacks) => () => void;
  toggleMusic: () => void;
};

const MusicContext = createContext<WeddingMusic | null>(null);
const invitationPath = "/jemputan-walimatulurus-harissa-faiz";
const registryPaths = [
  "/wedding-registry",
  "/wedding-registry-en",
  "/wedding-registry-v2",
];

export function useWeddingMusic() {
  const music = useContext(MusicContext);
  if (!music) throw new Error("WeddingMusicProvider is required");
  return music;
}

/** One player survives Next.js navigation between the wedding pages. */
export default function WeddingMusicProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { pathname } = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const gateRef = useRef<GainNode>();
  const openingCleanup = useRef<(() => void) | null>(null);
  const openingActive = useRef(false);
  const userPaused = useRef(false);
  const autoplayPending = useRef(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [openingSoundPlaying, setOpeningSoundPlaying] = useState(false);
  const [invitationOpened, setInvitationOpened] = useState(false);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio("/audio/terukir-di-bintang-v2.mp3");
      audio.loop = true;
      audio.volume = 0.55;
      audio.preload = "auto";
      audio.onplaying = () => {
        autoplayPending.current = false;
        setMusicPlaying(true);
      };
      audio.onpause = () => setMusicPlaying(false);
      audio.onerror = () => setMusicPlaying(false);
      audio.onloadedmetadata = () => {
        if (audio.currentTime < 0.5) audio.currentTime = 0.5;
        audio.onloadedmetadata = null;
      };
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const play = useCallback(() => {
    if (openingActive.current || userPaused.current) return;
    const audio = getAudio();
    void contextRef.current?.resume().catch(() => undefined);
    if (!audio.paused) return;
    audio.muted = false;
    audio.volume = 0.55;
    if (gateRef.current) gateRef.current.gain.value = 1;
    autoplayPending.current = true;
    void audio.play().catch(() => undefined);
  }, [getAudio]);

  const revealInvitation = useCallback(() => setInvitationOpened(true), []);

  const startOpening = useCallback(
    (callbacks: OpeningCallbacks) => {
      const music = getAudio();
      if (!soundRef.current) {
        soundRef.current = new Audio("/audio/mohor-wind-chimes.m4a");
        soundRef.current.preload = "auto";
      }
      openingCleanup.current?.();
      userPaused.current = false;
      openingActive.current = true;
      setOpeningSoundPlaying(true);
      try {
        if (!contextRef.current) {
          const context = new window.AudioContext();
          contextRef.current = context;
          const gate = context.createGain();
          gate.gain.value = 0;
          context.createMediaElementSource(music).connect(gate);
          gate.connect(context.destination);
          gateRef.current = gate;
        }
        void contextRef.current.resume().catch(() => undefined);
      } catch {
        // The opening sequence uses muted priming when Web Audio is unavailable.
      }
      let attached = true;
      openingCleanup.current = playMohorOpening({
        sound: soundRef.current,
        music,
        musicGate: gateRef.current,
        reducedMotion: callbacks.reducedMotion,
        onReveal: () => {
          if (attached) callbacks.onReveal();
        },
        onOpen: () => {
          setInvitationOpened(true);
          if (attached) callbacks.onOpen();
        },
        onSoundFinished: () => {
          openingActive.current = false;
          setOpeningSoundPlaying(false);
        },
        onMusicChange: setMusicPlaying,
      });
      // Leaving the invitation detaches its visuals, but audio keeps its timeline.
      return () => {
        attached = false;
      };
    },
    [getAudio]
  );

  const toggleMusic = useCallback(() => {
    if (openingActive.current) return;
    const audio = getAudio();
    if (audio.paused) {
      userPaused.current = false;
      play();
    } else {
      userPaused.current = true;
      autoplayPending.current = false;
      audio.pause();
    }
  }, [getAudio, play]);

  useEffect(() => {
    const registry = registryPaths.includes(pathname);
    if (registry) play();
    else if (pathname === invitationPath) {
      if (!soundRef.current) {
        soundRef.current = new Audio("/audio/mohor-wind-chimes.m4a");
        soundRef.current.preload = "auto";
      }
    } else {
      openingCleanup.current?.();
      openingCleanup.current = null;
      openingActive.current = false;
      setOpeningSoundPlaying(false);
      audioRef.current?.pause();
    }
    if (!registry) return;
    // Direct visitors can unlock playback with their first interaction, without
    // a separate gift-page player. An intentional pause is always preserved.
    const retry = () => {
      if (autoplayPending.current) play();
    };
    const keyRetry = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") retry();
    };
    document.addEventListener("pointerdown", retry);
    document.addEventListener("keydown", keyRetry);
    return () => {
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("keydown", keyRetry);
    };
  }, [pathname, play]);

  useEffect(
    () => () => {
      const audio = audioRef.current;
      if (audio) {
        audio.onplaying =
          audio.onpause =
          audio.onerror =
          audio.onloadedmetadata =
            null;
      }
      openingCleanup.current?.();
      openingCleanup.current = null;
      openingActive.current = false;
      audio?.pause();
      audio?.removeAttribute("src");
      audio?.load();
      soundRef.current?.pause();
      void contextRef.current?.close().catch(() => undefined);
      audioRef.current = null;
      soundRef.current = null;
      contextRef.current = null;
      gateRef.current = undefined;
    },
    []
  );

  return (
    <MusicContext.Provider
      value={{
        musicPlaying,
        openingSoundPlaying,
        invitationOpened,
        revealInvitation,
        startOpening,
        toggleMusic,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
