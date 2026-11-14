# Wedding memories review and improvement log

## First pass review

Implemented the confirmed feature set and retained the existing invitation
experience. Parent independently verified the actual Firebase helper flows:
initial reservation, original-byte upload, idempotent retry, immutable slots,
20-shot quota, separate event quotas, private/public voice access, voice publish
failure recovery, persisted favourites and complete owner ZIP exports (canvas
rendering mocked for the Node export check). Existing RSVP/registry emulator
tests pass. Invitation tests retain their two documented baseline failures.
The implementation agent reports a successful production build and typecheck.

The following improvement pass is required before acceptance.

## Improvement pass 1

1. **Durable upload queue and quota correctness.** Validate nonempty JPEG,
   PNG or WebP bytes and the 12 MB bound before creating a reservation. Current
   `processFile` reserves first and only then persists the blob, so unsupported
   images consume slots and a connection failure can lose the selected photo.
   Persist a local job and stable UUID before any network operation; reserve
   online using that UUID. Store the UUID in each immutable reservation and
   recover the same reservation when retrying a job after a reload or after a
   reservation commit whose response was lost. Never consume a second slot for
   one job. Extract IndexedDB/orchestration helpers into a testable module.
   Resolve writes only on transaction completion, reject aborts, close handles,
   and avoid writing whole blobs for every progress event. Serialize durable
   state changes so a late progress write cannot resurrect a completed job.
   Keep in-flight deduplication, check identity, retain failed audio/photos and
   show useful retry status. Save audio before network work as well.
2. **Useful and bounded galleries.** Add All photos, My photos and Favourites
   views, and a guest filter/grouping. Show the current guest's uploaded shots
   on the guest page. Reset state between events (use event keys). Bound the
   default query size and provide Load more, with explicit loading, empty and
   failure states. Process previews only near the viewport, bound preview
   canvas dimensions (about 960 px) and release image/object URL resources.
   Full-resolution originals and styled images belong in downloads/exports;
   do not eagerly render every full-size image in a wedding gallery. Provide
   original and styled photo downloads from the preview. Observe public
   settings changes so existing gallery previews follow the chosen film.
3. **Complete photo stamps and coherent themed pages.** Include couple names
   and the photo date/time in Asia/Kuala_Lumpur together with the configurable
   stamp/hashtag; fit/wrap long text within the image. Preserve originals and
   use the same stamp renderer for previews, downloads and ZIP. Reuse the
   garden/songket artwork and invitation fonts on the QR cards and dashboards
   too; QR code quiet zone must be at least four modules. QR rendering must
   work without Firebase access or subscriptions. Add appropriate canonical
   and noindex metadata for unlisted memory pages. Show the correct event's
   couple ordering, date and venue.
4. **Media lifecycle and accessible interaction.** A camera/mic permission
   request may resolve after unmount; stop the late stream instead of leaking
   it. Avoid concurrent permission requests/recorders; stop tracks on every
   exit/failure path. Only capture after video dimensions are ready. Safely
   handle repeated stop requests; show voice recording elapsed/remaining time,
   freeze its privacy choice during recording, and guard duplicate send/retry
   actions. Fix subscription cleanup races. Lightbox needs a label, Escape,
   focus containment/restore and working original/styled download controls.
   Add explicit form labels and surface fetch/decoding/audio errors rather than
   leaving a permanent placeholder. Keep technical setup details in docs.
5. **Routes and owner dashboard.** Render valid event pages with event props
   available on the server (e.g. getStaticPaths/getStaticProps for two sides),
   return a real 404 for invalid sides, and avoid the initial 'Celebration not
   found' flash. Counters should count completed submissions and unique
   contributors, not abandoned pending records. Keep sign-out available for
   an authenticated account without the owner claim. Confirm owner favourite
   export permissions remain enforced. Keep activation instructions exact,
   including Storage-to-Firestore rule lookup permission, rules/index deploy
   commands, CORS for localhost and 127.0.0.1, and primary Firebase docs links.
6. **Verification.** Add tests that execute the actual data/queue helpers,
   rather than reimplementing their happy path: invalid file without quota
   consumption; offline durable draft; reservation response loss/reload;
   upload completion followed by metadata failure; first private/public voice
   upload plus retry; other guests/unauthenticated private access denied;
   owner-only settings, public gallery queries, quota bounds and event scope.
   Use isolated demo emulators and a small IndexedDB test dependency if needed.
   Run typecheck, the focused suites and production build. Parent reviews the
   resulting diff and independently verifies the fixes before acceptance.

## Improvement pass 2 — final review findings

Pass 1 validation succeeded: eight memories tests and typecheck pass; the
implementation agent reports a passing production build. Parent independently
verified all eight built event routes return their actual content and all four
invalid-side routes return 404. Compiled CSS confirms the invitation's Lora
font wins the cascade. The backend/queue/stamp/export checks continue to pass.

The remaining fixes are bounded:

1. **Keep pagination progress during live updates.** Each first-page snapshot
   currently calls `setCursor(nextCursor)` and `setHasMore(more)` even after
   additional pages loaded. A new guest photo resets the cursor to page one;
   repeated new photos can stop a viewer reaching older pages. Keep the live
   head and the pagination tail/cursor separate. Merge incoming immutable photo
   records by ID without losing loaded rows, retain the last fetched tail cursor
   and exhaustion state, and reset only on event/filter changes. Apply the same
   logic to My photos. Add a focused test for page 2 -> new live head -> page 3
   without refetching page 2, plus exhaustion followed by a live head update.
2. **Handle unavailable browser storage and read failures.** Both localStorage
   calls in MemoryExperience can throw from an effect and crash the page. Guard
   them and show a useful status while keeping public galleries usable. Clear
   gallery loading on subscription failure, pass error callbacks to public
   settings subscriptions, and show audio retrieval errors in public and owner
   voice players instead of swallowing them. Keep existing retry semantics.
3. **Render titles as single strings.** The built HTML contains literal React
   comment markers inside title elements because JSX gives title multiple
   children. Interpolate each new page title into one string (guest, gallery,
   QR, dashboard and chooser), then verify clean server-rendered titles.
4. **Fit unbroken stamp text.** The wrapping helper splits only on spaces, so a
   100-character unbroken custom stamp can overflow. Split long tokens or use a
   bounded canvas text width; include a test that no rendered line exceeds the
   available width. Preserve hashtag case and Malaysia time formatting.

Re-run the meaningful affected tests, typecheck and build, then return the
results for parent acceptance. No new features or live deployment are required.

## Acceptance after improvement pass 2

Accepted locally after two implementation-agent improvement passes and parent
review. The implementation agent used the requested lightweight model.

- Parent independently reran all ten memories tests: 10 passed.
- Parent independently reran typecheck and whitespace checks: passed.
- The implementation agent's final production build passed. Parent served that
  build locally and checked the chooser plus all eight event routes: correct
  content, clean titles and hashtags; four invalid-side routes returned 404.
- Parent visually inspected the final bride QR card and groom songket guest
  page in native Chrome. Both use the invitation artwork and typography.
- Existing RSVP/registry security tests: 7 passed. Invitation render/motion
  suite: 23 passed, the same two pre-existing Salam Kaut failures remained.
- Actual camera/microphone hardware capture and live Firebase configuration
  were not verified. Cloud activation and deployment are documented separately.

## Baseline and environment notes

- Original invitation baseline: 23 passing tests, two pre-existing render
  failures involving Salam Kaut visibility/asset expectations.
- Existing Firestore RSVP/registry regression: 7 passing tests.
- First-pass memories security suite: 3 passing tests.
- No live Firebase configuration, billing change or deployment performed.

## Follow-up: independent albums and named public URLs

Removed the invitation-to-memories link. Public album labels now use couple
names and dates. Public paths are `/wedding-memories/harissa-faiz` and
`/wedding-memories/faiz-harossa`, using the requested spelling verbatim.
Navigation, QR destinations, canonical metadata and download names use the
shared Firebase-free route mapping.

Parent independently verified all eight renamed routes return 200, all eight
old gender-based routes return 404, visible copy has no gender labels, both QR
cards use the expected canonical destinations, and the invitation source has
no memories link. Typecheck and whitespace checks pass; the implementation
agent's production build passes.
