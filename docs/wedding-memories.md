# Wedding memories setup

This feature uses the existing Firebase project `jemputan-kahwin-6bd29`. Each
celebration has a separate gallery under
`weddings/{eventId}/memoryAlbums/main`. Guest photo slots are immutable and
numbered 1–20 for each anonymous Firebase UID and event. Photos, written wishes,
and public voice notes can be read by anyone with the guest link. Private voice
notes use a separate Firestore collection and Storage path. Only the couple and
the original uploader can read an individual note; uploader access lets the
browser resume a pending upload. Other guests cannot read its metadata or bytes.
Listing private notes and exporting them requires the Firebase Auth custom claim
`owner: true`.

No expiry policy is configured. Guests can return to their photos from the same
browser profile; Firebase anonymous identity is browser-specific, not a real
person identity. Publishing the routes does not activate Firebase services.

The guest hub keeps the name, photo count, and available actions together. The
camera opens as a full-screen view with Original, FP2, FS16, and FV5 looks in a
horizontal strip. Each captured photo saves the selected look, capture time, and
wedding stamp into a local draft. Photo originals remain unchanged, while
gallery views and exports use the same crop, filter, and stamp renderer. The
shared gallery is available from the hub.
The three color looks are local stylistic approximations informed by the
descriptions for [VSCO Fuji presets](https://www.vsco.co/features/film-filters/fujifilm-presets).
They are not claims of exact proprietary filter matches; paired VSCO reference
exports are not available for comparison.

The camera feed fills the viewport; its name, close control, film strip, shutter,
and flip action float over the image. The live view has no wedding imprint or
reserved stamp area. Shutter freezes the current viewport crop, selected film
look, and capture time into a local draft, then returns to the viewfinder.
Guests open Photos to review, delete, add device-picked photos, and upload all
or selected drafts. Drafts survive camera close/reopen and page refresh in the
same browser profile. They enter the retryable upload queue only after the guest
explicitly chooses Upload. Saved photo stamps remain visible in draft previews,
gallery images, and exports.
The live Original look displays the camera video directly. Film looks use a
WebGL preview, refreshed from each video frame, with a 200 ms callback watchdog
and paced animation-frame fallback if frame callbacks stop arriving. A 2D,
downscaled fallback remains available when GPU rendering is unavailable;
full-resolution capture, frozen review, gallery images, and exports use the
still-photo renderer. The iPhone freeze report prompted the callback and texture
fallbacks; its specific failure mechanism has not been reproduced on a phone.
The rendered stamp is a restrained burnt-orange, tracked monospace imprint.
It runs vertically near the lower-left edge on portrait images and horizontally
at the lower-left on landscape and square images. The event line includes the
capture time in Malaysia time; the exact custom hashtag or message appears as a
smaller secondary imprint. This layout appears in draft previews, gallery
images, and exports, but not over the live camera feed.

## One-time Firebase setup

1. In Firebase project `jemputan-kahwin-6bd29`, create the default Firestore
   database in production mode. Keep the project's existing invitation rules and
   publish the complete `firestore.rules` file in this repository. It includes
   the RSVP/gift rules and the separate memories paths.
2. In Authentication → Sign-in method, enable **Anonymous** and **Email/Password**.
   Create a dedicated owner account for the couple dashboard.
3. Grant that account the custom claim `owner: true` with the Firebase Admin SDK
   from a trusted local/Cloud Shell environment. Never put a service-account key
   or Admin SDK credentials in this web application. For a one-time Node script:

   ```js
   import { applicationDefault, initializeApp } from "firebase-admin/app";
   import { getAuth } from "firebase-admin/auth";

   initializeApp({
     credential: applicationDefault(),
     projectId: "jemputan-kahwin-6bd29",
   });
   await getAuth().setCustomUserClaims("OWNER_AUTH_UID", { owner: true });
   ```

   Run it where Application Default Credentials are authorized for the project,
   replacing `OWNER_AUTH_UID` with the dedicated account UID. Sign out and back
   in at `/wedding-memories/harissa-faiz/dashboard` or
   `/wedding-memories/faiz-harossa/dashboard` so Firebase refreshes the claim.
   The dashboard rejects accounts without the claim.
   Firebase documents the [Admin SDK custom-claims flow](https://firebase.google.com/docs/auth/admin/custom-claims).

4. Create/enable the default Cloud Storage bucket. Cloud Storage for Firebase
   requires the Blaze pay-as-you-go plan as of February 3, 2026; usage may incur
   Google Cloud Storage charges. Review the project's current billing and quota
   settings before inviting guests. Set the bucket rules to the complete
   `storage.rules` file in this repository. These rules allow public reads only
   for event photos/public audio. Private audio is visible to the couple and
   only its original uploader, to resume that uploader's pending upload.
   Storage rules use `firestore.get()` to verify slot reservations and voice
   metadata. After the first publish, enable the prompted Cloud Storage ↔
   Firestore permissions. Keep the default Firestore database, which is the
   database these rules reference. Firebase documents the [Storage to Firestore
   rule lookups](https://firebase.google.com/docs/storage/security/rules-conditions).
   The documented [Storage setup](https://firebase.google.com/docs/storage/web/start)
   explains the bucket and Blaze requirements.
5. Apply browser CORS so previews and authenticated owner exports can fetch
   Storage blobs. From a trusted terminal with Google Cloud SDK `gsutil` access:

   ```sh
   gsutil cors set storage-cors.json gs://jemputan-kahwin-6bd29.firebasestorage.app
   ```

   The included policy allows GET from both `https://faizhasnul.com` and
   `https://www.faizhasnul.com` (the bare domain redirects to `www`), plus
   `localhost` and `127.0.0.1` on development ports 3000 and 3012. Update it if
   the production domain changes. Browser-side blob fetches
   fail without CORS; ZIP exports intentionally stop with an error instead of
   silently omitting media. See Firebase's [browser download and CORS instructions](https://firebase.google.com/docs/storage/web/download-files).

   If an album card is blank while its photo record exists, check that Storage
   GET responses include `Access-Control-Allow-Origin` for the final site
   origin, including `https://www.faizhasnul.com`. CORS is a bucket setting;
   publishing Firebase Storage rules does not apply `storage-cors.json`. Existing
   uploaded photos do not need to be uploaded again after correcting CORS.

6. Publish the updated Firestore and Storage rules, indexes, and deploy the site
   through its existing host. The public guest albums are
   `/wedding-memories/harissa-faiz` and `/wedding-memories/faiz-harossa`. No
   Firebase CLI deploy, hosting registration, or live project changes were
   performed during implementation. The Firebase CLI
   publish command is:

   ```sh
   firebase deploy --only firestore:rules,firestore:indexes,storage --project jemputan-kahwin-6bd29
   ```

## Local development and security tests

The ordinary app config points to the production Firebase project. For explicit
local testing, set `NEXT_PUBLIC_WEDDING_EMULATORS=1`; the app then uses demo
project `demo-wedding` and loopback Auth, Firestore, and Storage emulators. It
does not fall back to production if an emulator is unavailable.

```sh
NEXT_PUBLIC_WEDDING_EMULATORS=1 pnpm dev
```

Security tests use only the `demo-wedding` project and refuse non-loopback
emulator hosts. They create uniquely named test accounts/data and do not clear
other emulator data.

```sh
firebase emulators:exec --only auth,firestore,storage --project demo-wedding "pnpm test:wedding-memories"
pnpm exec tsc --noEmit --incremental false
pnpm build
```

The emulator suites cover actual data-helper and IndexedDB flows: invalid image
rejection before quota use, offline draft persistence, lost reservation/upload
responses, retries, 20-slot quota, independent event quotas, public photos,
private/public voice paths, favourites, and a complete ZIP. Camera/renderer
tests cover late camera permission results, duplicate shutter gates, 4:5 crop
geometry, deterministic filters, proportional stamp layout at preview and full
resolution, and blank custom stamps. Rules tests cover direct reservations,
photo-style metadata validation, and Storage write enforcement. Use only these
emulators when running the tests.

Local TypeScript, emulator, and production-build checks should be run with the
commands above after changes. Real-device camera and microphone behavior and
the live Firebase project still need checking after the one-time setup above.

## Data and operational notes

- `reservations/{uid}_{slot}` is create-only. Retried photo uploads reuse the
  reserved slot; if bytes reached Storage before a metadata error, the app checks
  object metadata and commits the matching existing object without overwriting.
- Original image bytes are retained. Gallery previews and ZIP exports render the
  selected Original, FP2, FS16, or FV5 look and custom stamp into a separate
  styled image; originals remain included in exports.
- New camera captures persist the guest-selected `film`, `stamp`, and
  `capturedAt` fields as optional `photoStyle` metadata. Older photos without
  this metadata continue to use the couple's current default settings. Firestore
  rules validate the optional map and reject unknown fields or unsupported film
  values. Legacy `classic-chrome`, `classic-neg`, `nostalgic-neg`, `acros`,
  `warm`, and `soft` values remain accepted and retain their original rendering
  for existing photos and queued uploads. Existing owner defaults are shown as
  FP2 in the camera and dashboard; this does not rewrite historical photo
  metadata.
- ZIP creation runs in the owner's browser and holds the archive's media in
  memory; available browser memory limits the size of a single export.
- Guest uploads and the 30-second voice capture are browser-authenticated.
  Anonymous Auth is ownership and quota control, not identity verification or
  abuse moderation. There is no expiry or approval workflow.
- A public gallery is unlisted by URL, not access controlled. Anyone who gets
  the link can view event photos, public wishes, and public voice notes.
- Firestore rules enforce photo slot ownership and number. Cloud Storage rules
  enforce the reserved path, owner, image/audio MIME type, and size. The browser
  writes the public photo metadata only after Storage confirms the bytes landed.
- Private voice recordings never receive download-token URLs. The owner
  dashboard lists and exports them through authenticated Storage requests. A
  guest can access only their own note to finish a pending upload; private notes
  stay out of public gallery lists.
- The indexed Firestore queries use `firestore.indexes.json`. Storage CORS and
  Blaze billing are separate Google Cloud setup and are not activated by deploy.
