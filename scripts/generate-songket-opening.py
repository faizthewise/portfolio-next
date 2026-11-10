"""Render an original, quiet seal/paper effect and warm plucked-string cadence.

Standard library only. No sampled recordings or runtime dependencies.
Run from the repository root: python3 scripts/generate-songket-opening.py
"""

import math
from pathlib import Path
import random
import struct
import wave

RATE = 44100
DURATION = 2.8
samples = [0.0] * round(RATE * DURATION)
rng = random.Random(27122026)

# A soft, dry wax release, followed by two passes of unfolding paper.
low_noise = 0.0
previous_noise = 0.0
for index in range(len(samples)):
    time = index / RATE
    noise = rng.uniform(-1, 1)
    low_noise += 0.12 * (noise - low_noise)
    high_noise = noise - previous_noise
    previous_noise = noise
    tap = 0.13 * math.exp(-time * 85) * (
        math.sin(2 * math.pi * 180 * time) + low_noise
    )
    rustle = 0.0
    for start, length, volume in [(0.5, 0.7, 0.05), (1.1, 0.85, 0.035)]:
        progress = (time - start) / length
        if 0 < progress < 1:
            envelope = math.sin(math.pi * progress) ** 2
            flutter = 0.7 + 0.3 * math.sin(2 * math.pi * 19 * time)
            rustle += volume * envelope * flutter * (low_noise + high_noise * 0.12)
    samples[index] = tap + rustle

# A restrained D-minor arpeggio, with detuned strings and subdued overtones.
for start, frequency, volume in [
    (0.6, 146.832, 0.18),
    (0.78, 220.0, 0.12),
    (0.96, 293.665, 0.10),
    (1.14, 349.228, 0.085),
    (1.32, 440.0, 0.06),
]:
    for index in range(round(start * RATE), len(samples)):
        age = index / RATE - start
        attack = 1 - math.exp(-age * 500)
        tone = 0.0
        for harmonic in range(1, 8):
            decay = math.exp(-age * (2.6 + harmonic * 0.55))
            phase = 2 * math.pi * frequency * harmonic * age
            tone += decay * (
                math.sin(phase * 0.999) + math.sin(phase * 1.001)
            ) / (2 * harmonic ** 1.8)
        samples[index] += volume * attack * tone

# Small room reflections, followed by a gentle fade to digital silence.
dry = samples[:]
for delay, gain in [(0.047, 0.13), (0.109, 0.08), (0.193, 0.04)]:
    offset = round(delay * RATE)
    for index in range(offset, len(samples)):
        samples[index] += dry[index - offset] * gain

peak = max(abs(sample) for sample in samples)
output = Path(__file__).resolve().parents[1] / "public/audio/songket-classical-opening.wav"
with wave.open(str(output), "wb") as audio:
    audio.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
    frames = bytearray()
    for index, sample in enumerate(samples):
        time = index / RATE
        fade = min(1.0, max(0.0, (DURATION - time) / 0.35)) ** 2
        frames.extend(struct.pack("<h", round(sample / peak * 0.68 * fade * 32767)))
    audio.writeframes(frames)
print(output)
