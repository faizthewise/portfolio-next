type OpeningOptions = {
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
const CHIME_END_SECONDS = 4.4;
const MUSIC_START_SECONDS = 0.5;

/** Reveal after the fairy flourish; start the song only once the chime ends. */
export function playMohorOpening({
  sound,
  music,
  musicGate,
  reducedMotion,
  onReveal,
  onOpen,
  onMusicChange,
  onSoundFinished,
}: OpeningOptions) {
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
    if (sound.currentTime >= CHIME_END_SECONDS) finishSound();
  };

  const flourishTimer = setTimeout(
    () => {
      if (disposed) return;
      onReveal();
      // Fade the fairy dust and open the doors while the chime rings out.
      revealTimer = setTimeout(
        () => {
          if (disposed) return;
          opened = true;
          onOpen();
          startMusicWhenReady();
        },
        reducedMotion ? 0 : 1000
      );
    },
    reducedMotion ? 0 : 1800
  );

  // A failed or stalled sound must not leave the background song waiting forever.
  // Use playback position so buffering never starts the song prematurely.
  const soundDeadline = setTimeout(finishSound, 15000);
  sound.addEventListener("ended", finishSound);
  sound.addEventListener("error", finishSound);
  sound.addEventListener("timeupdate", finishQuietTail);
  sound.volume = 0.65;
  void sound.play().catch(finishSound);

  return () => {
    disposed = true;
    clearTimeout(flourishTimer);
    clearTimeout(soundDeadline);
    clearTimeout(revealTimer);
    sound.removeEventListener("ended", finishSound);
    sound.removeEventListener("error", finishSound);
    sound.removeEventListener("timeupdate", finishQuietTail);
    sound.pause();
    music.pause();
  };
}
