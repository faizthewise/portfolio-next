# Mohor opening sound

`public/audio/mohor-wind-chimes.m4a` is the audio selected by the user:

- Video: [Magic Wind Chimes Sound Effect (HD)](https://youtu.be/H5CR1dNOA-I)
- Track linked in the video's description: <https://www.epidemicsound.com/track/iXYouL6uWJ/>
- Duration: approximately 4.94 seconds.

The original AAC audio packets were repackaged into a standard M4A container
without changing or synthesizing the sound. The video's description directs
users to Epidemic Sound for licensing; this repository does not establish a
license for the track.

The seal click plays this sound while displaying the fairy trail. After 1.8
seconds, the trail fades and the envelope opens over one second. The card is
visible at about 2.8 seconds, with the chime continuing over it. The background
song waits for the card reveal and the chime to finish. Playback stops the chime
at 4.4 seconds, when its remaining tail is below -65 dB RMS, and starts the song
at 0.5 seconds to skip its silent lead-in. This removes approximately one second
of quiet waiting without overlapping the two tracks. The music control is
disabled while the chime is playing. Reduced motion reveals the card immediately
but still waits for the chime before starting the song. Playback errors and
stalled downloads have a fallback so the song can still start.

Run the sequencing checks with `node --test tests/wedding-opening.test.mjs`.
