type OpeningOptions = {
  style?: "garden" | "classical";
  sound: HTMLAudioElement;
  music: HTMLAudioElement;
  musicGate?: GainNode;
  reducedMotion: boolean;
  onReveal: () => void;
  onOpen: () => void;
  onMusicChange: (playing: boolean) => void;
  onSoundFinished?: () => void;
};

// Measured against these recordings: the chime is below -65 dB after 4.4s,
// and the song's first half-second is silent.
const MUSIC_START_SECONDS = 0.5;

export const openingProfiles = {
  garden: {
    soundPath: "/audio/mohor-wind-chimes.m4a",
    soundEndSeconds: 4.4,
    revealDelay: 1800,
    openingDuration: 1000,
    soundVolume: 0.65,
  },
  classical: {
    soundPath: "/audio/songket-classical-opening.wav",
    soundEndSeconds: 2.8,
    revealDelay: 800,
    openingDuration: 1800,
    soundVolume: 0.5,
  },
} as const;

/** Release the seal, unfold the gates, then hand off from the effect to music. */
export function playMohorOpening({
  style = "garden",
  sound,
  music,
  musicGate,
  reducedMotion,
  onReveal,
  onOpen,
  onMusicChange,
  onSoundFinished,
}: OpeningOptions) {
  const profile = openingProfiles[style];
  let disposed = false;
  let opened = false;
  let soundFinished = false;
  let musicStarted = false;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;

  // Unlock this media element during the tap, silently, for mobile browsers.
  // Rewind it before the actual song starts after the opening sequence.
  music.volume = 0;
  // iOS may ignore media volume; a gain node keeps priming truly silent.
  if (musicGate) musicGate.gain.value = 0;
  else music.muted = true;
  void music.play().then(
    () => {
      if (disposed) return;
      if (!musicStarted) {
        music.pause();
        music.currentTime = MUSIC_START_SECONDS;
      }
    },
    () => undefined
  );

  const startMusicWhenReady = () => {
    if (disposed || musicStarted || !opened || !soundFinished) return;
    musicStarted = true;
    music.currentTime = MUSIC_START_SECONDS;
    music.volume = 0.55;
    music.muted = false;
    if (musicGate) musicGate.gain.value = 1;
    void music.play().then(
      () => !disposed && onMusicChange(true),
      () => !disposed && onMusicChange(false)
    );
  };

  const finishSound = () => {
    if (disposed || soundFinished) return;
    soundFinished = true;
    clearTimeout(soundDeadline);
    sound.pause();
    onSoundFinished?.();
    startMusicWhenReady();
  };

  const finishQuietTail = () => {
    if (sound.currentTime >= profile.soundEndSeconds) finishSound();
  };

  const sealTimer = setTimeout(
    () => {
      if (disposed) return;
      onReveal();
      // Keep the cover mounted until the doors finish opening.
      revealTimer = setTimeout(
        () => {
          if (disposed) return;
          opened = true;
          onOpen();
          startMusicWhenReady();
        },
        reducedMotion ? 0 : profile.openingDuration
      );
    },
    reducedMotion ? 0 : profile.revealDelay
  );

  // A failed or stalled sound must not leave the background song waiting forever.
  // Use playback position so buffering never starts the song prematurely.
  const soundDeadline = setTimeout(finishSound, 15000);
  sound.addEventListener("ended", finishSound);
  sound.addEventListener("error", finishSound);
  sound.addEventListener("timeupdate", finishQuietTail);
  sound.volume = profile.soundVolume;
  void sound.play().catch(finishSound);

  return () => {
    disposed = true;
    clearTimeout(sealTimer);
    clearTimeout(soundDeadline);
    clearTimeout(revealTimer);
    sound.removeEventListener("ended", finishSound);
    sound.removeEventListener("error", finishSound);
    sound.removeEventListener("timeupdate", finishQuietTail);
    sound.pause();
    music.pause();
  };
}
