# Wedding memories implementation plan

## Confirmed scope

English only. Both wedding events, separate public-by-link galleries. The
Harissa & Faiz event uses the existing garden invitation theme; the Faiz &
Harissa event uses songket. Include
`#FaIzTheOneForHarissa`. Twenty photos per guest per event. No automatic expiry.
No scheduled reveal, moderation, or language switch. Use the existing Firebase
project for Anonymous Auth, Firestore, Storage, and authenticated owner access.

## Routes and experience

- `/wedding-memories`: event chooser.
- `/wedding-memories/harissa-faiz` and `/wedding-memories/faiz-harossa`: named guest entry,
  browser camera, existing-photo upload, personal shots and upload queue,
  written wishes, 30-second voice notes (public or couple-only), Salam Kaut.
- Each event has `/gallery`, `/dashboard`, and `/qr` routes. Gallery shows
  attributed photos, favourites, written wishes, public voice notes, and full
  photo previews. Public galleries are readable without an account prompt.
- Dashboard requires Firebase owner authentication and a server-enforced owner
  custom claim. Configure cover, welcome, film, stamp, bank recipient/details
  and QR. Show counts and export all originals, styled photos, voice notes,
  wishes and metadata to ZIP. No photo approval/removal workflow.
- Printable QR cards and downloadable QR images encode the canonical guest
  URLs `https://faizhasnul.com/wedding-memories/harissa-faiz` and
  `https://faizhasnul.com/wedding-memories/faiz-harossa`.

## Implementation requirements

1. Reuse existing event details, artwork, fonts and colours. Keep responsive,
   accessible controls, empty/loading/error states, photo previews and statuses.
2. Introduce isolated memories data modules. Preserve current RSVP/gift rules.
   Public settings are owner-writable only. Never expose private audio URLs or
   private wishes through public metadata/exports. Use authenticated Storage
   blob access for private recordings, not shareable download tokens.
3. Enforce quota using immutable numbered photo reservations (1–20) scoped to
   event and anonymous UID. Photo IDs must bind UID to slot. Rules validate IDs,
   owner, fields, paths, types and allowed event IDs. Storage accepts only
   reserved image slots with bounded size and MIME types; no arbitrary uploads
   or overwrites. Failed retries reuse the reservation and cannot double count.
   Anonymous identity persists per browser, not per real person.
4. Store original photo bytes. Derive selected film and custom stamp for
   previews/downloads using canvas so changing settings applies to existing
   photos. Include three film options and preserve original downloads.
5. Persist pending blobs and metadata in IndexedDB. Resume/retry on reload and
   reconnect with visible progress/errors. Do not claim upload success until
   bytes and metadata are committed. Stop/release camera and microphone tracks.
   Use supported audio MIME negotiation; 30-second timer and upload validation.
6. Written and voice wishes are event scoped. Separate public and private
   voice collections to make list queries rule-safe. Favourites are per guest.
7. Real QR generation and real ZIP exports, with explicit errors if any asset
   fails. Configure CORS if fetching public originals requires it; owner audio
   retrieval stays authenticated. Never silently export a partial archive.
8. Keep secrets out of the client. Supply owner-claim setup instructions and
   Firebase rules/index/configuration, necessary Storage setup/billing/CORS
   instructions and emulator-only security tests. Do not enable lifecycle expiry.

## Delegation and review

The lightweight implementation agent completes this plan and runs focused
checks. The parent reviews all changes for scope, correctness, privacy, quota,
retry behavior, theme fidelity and build compatibility. Parent writes concrete
improvement tasks and sends them to the agent. Repeat until findings are
resolved; independently run appropriate tests and production build. Document
any infrastructure setup or verification that cannot be completed locally.
