# Wedding Memories delivery and review

## Executive summary

The event home now opens on a compact botanical hero and a prominent camera action. Guests can see their available shots, capture and review photos, choose files, leave a wish or recording, and reach the shared gallery or personal album. Upload feedback distinguishes active, interrupted, failed and confirmed contributions.

## Implementation and ownership

| Workstream | Model | Delivered |
|---|---|---|
| Home layout and navigation | GPT-6.2 Sol, low reasoning | Ivory layout, invitation florals and calligraphy, camera and allowance, contribution cards, gallery entry, Salam Kaut, closing and safe-area navigation |
| Experience and contribution wiring | GPT-6.2 Sol, low reasoning | Server-backed allowance, existing upload and capture flows, contextual identity, wish draft retention, keyboard focus management and album access |
| Upload feedback | GPT-6.2 Sol, low reasoning | Separate statuses from the queue and connection state, recovery links, screen reader announcements and targeted tests |
| Integration and acceptance | Lead agent | Scope, design contracts, diff review, visual audit, emulator scenarios and release decision |

No model escalation was used. Home and gallery remain event routes. My album opens in its existing panel from either route. The album panel provides All albums and QR card links. The gallery continues to use the couple's configured cover and welcome.

## Rendered review

| Viewport | Screenshot | Observation |
|---|---|---|
| 320 × 568 | [Initial](evidence/home-320.png), [scrolled](evidence/home-320-scrolled.png) | Compact gutters, wrapping cards and reachable secondary content |
| 375 × 667 | [Home](evidence/home-375.png) | Camera, upload and message actions within the mobile composition |
| 390 × 844 | [Home](evidence/home-390.png), [200% text](evidence/home-390-large-text.png) | Camera in view, 229 px hero at default text size and natural wrapping at 200% |
| 430 × 932 | [Home](evidence/home-430.png) | Full page order and safe-area navigation visible |
| 768 × 1024 | [Home](evidence/home-768.png) | Centred content and consistent alignment |
| 1440 × 900 | [Home](evidence/home-1440.png) | 520 px column with the action kept near the top |

Additional states include [first-time identification](evidence/first-time-guest.png), [returning guest](evidence/returning-guest.png), [My album](evidence/my-album-returning.png), [uploading](evidence/photos-uploading.png), [confirmed upload](evidence/photo-upload-confirmed.png), [failed upload](evidence/upload-failed.png), [mixed upload state](evidence/upload-mixed.png), [offline feedback](evidence/upload-offline.png), [exhausted allowance](evidence/quota-exhausted.png) and [unavailable allowance](evidence/quota-unavailable.png). The browser evidence uses the demo project.

The camera was visible above the fixed bar in all six viewports. Home controls met the 44 px target, the camera measured 56 px, and the upload action measured 48 px. No horizontal overflow was detected. The 320 px viewport scrolls to reach the message cards and gifting row. Tab started on the camera with a visible outline. The name panel kept focus within the dialog and restored it to its trigger. Reduced motion disabled interaction transitions.

Axe reported zero violations on the resting home and identity sheet. Axe requested manual review of five hero text elements because of the corner artwork. The artwork fades toward the centred text. The botanical eyebrow measured 4.60:1 against ivory, muted copy measured 4.91:1 on ivory and 4.52:1 on soft sage, and white on the camera action measured 7.49:1. The secondary control border measured 3.48:1 against ivory.

## Findings and corrections

| Finding | Severity | Disposition |
|---|---|---|
| Message cards and the gifting row omitted parts of their visible labels from the accessible names | Major | Used native text names and confirmed a clean axe rerun |
| A hidden navigation trigger could be removed while a panel was open | Major | Kept the trigger mounted while hidden and verified focus restoration |
| A previously configured terse welcome could obscure the purpose of home | Minor | Used the approved purpose copy on home and kept the configured welcome in the gallery |
| In-flight uploads could still be labelled uploading on loss of connectivity | Major | Switched in-flight jobs to waiting when offline and kept earlier failures distinct |
| Album retry controls offered a retry while offline | Major | Reused the camera queue status, disabled retry offline and verified recovery after reconnect |

## Technical validation

- TypeScript and the production Next.js build passed. The demo Firebase suites passed 39 Wedding Memories tests and 7 Firestore tests. Eleven Chrome regression groups passed.
- The production build comparison showed 329 kB to 334 kB of first-load JavaScript on home and gallery. Both versions had 18 unique static script and stylesheet references in the bride home HTML. The decorative asset moved from the 167 KB invitation composition to the existing 85 KB botanical artwork. Home does not request shared gallery photos. No runtime dependency was added.
- Repository-wide lint had existing formatting and rule violations. Baseline checks reported 744 JavaScript issues, 361 CSS issues and one JSON formatting issue in an RSVP export. The latest equivalent checks reported 690 JavaScript issues and 334 CSS issues with the same JSON finding. Scoped lint passed for the presentation modules and panel.
- The adjacent invitation and opening suite passed 24 of 26 tests. The same two invitation-render assertions failed in a clean copy of HEAD. They cover existing registry and Salam Kaut markup expectations.
- Next.js is configured to skip lint and type checking during its build. TypeScript and lint were run separately. A workspace dependency refresh occurred during a temporary build, and the installed dependencies were restored from the checked-in lockfile.

## Deferred requirements and verification boundaries

| Item | Technical constraint and fallback | Guest impact |
|---|---|---|
| Identify after creating a camera draft or recording | Existing draft storage and voice publishing use the saved guest name. New guests enter the name in context before using these flows. Wishes can be written before name entry. | The first camera or voice contribution has a name step before capture. Returning guests can continue directly. |
| Live gallery preview | The current shared gallery queries a page of metadata and retrieves full photo renditions. Home links to the event gallery without adding a new query or thumbnail path. | Guests open Gallery to see photos. |
| Physical iOS and Android verification | Chrome emulation and local browser fixtures covered the redesigned flows. Physical camera and microphone permissions, the file picker, safe-area insets, keyboard behaviour and a printed QR scan require device validation. | Native behaviour still requires a device check. |
| Production gifting and networking | Salam Kaut entry and its destination link were verified. Contributions used the demo Firebase project and payment confirmation remains pending. | Production payment and reception connectivity are outside the local evidence. |

## Functional validation

| Scenario | Result | Evidence |
|---|---|---|
| QR route, event home and deep links | Passed in Chrome | QR image generated locally, both event entries rendered and the voice section anchor resolved. A printed QR scan remains part of device validation. |
| First-time and returning guests | Passed in Chrome and Firebase emulators | Name validation and persistence, trigger focus and wish draft retention. A fresh browser guest saw the full allowance and an empty personal album. |
| Camera capture and permissions | Passed with Chrome's test camera | Denial was dismissible, captured photo stayed in the tray for review and acknowledgement appeared after upload. |
| Written wish and voice | Passed in Chrome and Firebase emulators | Empty wish was rejected, a valid wish appeared in the gallery, and a synthetic microphone stream exercised MediaRecorder and Storage. Microphone denial was also tested. |
| Photo selection and allowance | Passed in Chrome and Firebase emulators | Multi-file selection, file signature validation, queued shot deduction, exhaustion and failed quota loading. The photo controls stayed unavailable until the count could be checked. |
| Uploads and recovery | Passed in Chrome and Firebase emulators | Controlled Storage refusal produced distinct active and failed states. Taking the app offline blocked album retries. Reconnect cleared the failed item through the existing queue. |
| Gallery, My album and navigation | Passed in Chrome and Firebase emulators | Gallery and album data loaded, active destinations updated, and back and forward navigation preserved identity. |
| Salam Kaut | Entry passed in Chrome | The panel led to the correct event invitation payment section. Payment confirmation requires environment validation. |

## Visual scorecard

| Dimension | Weight | Rating | Weighted points | Evidence and remaining limitations |
|---|---:|---:|---:|---|
| Functional correctness | 25% | 9.2 | 23.0 | Browser regressions and emulator suites passed. Native media and reception network checks remain. |
| Visual hierarchy | 15% | 9.6 | 14.4 | The filled camera button leads in every tested viewport. The gallery has a dedicated entry and Salam Kaut follows it. |
| Mobile usability | 15% | 9.4 | 14.1 | Six widths and 200% text checked. Physical safe areas and the on-screen keyboard remain. |
| Premium aesthetic | 15% | 9.0 | 13.5 | The compact hero, restrained florals and evenly spaced cards read as a single experience. The gallery section uses text and a link. |
| Design system consistency | 10% | 9.2 | 9.2 | Shared colours, type roles and control sizes are visible in the home and identity panel. Existing gallery and contribution panels retain their presentation. |
| Wedding brand alignment | 10% | 9.4 | 9.4 | The original calligraphy and floral asset frame the event-specific names and date. |
| Accessibility | 5% | 8.8 | 4.4 | Zero axe violations in the two tested states, manual focus checks and contrast calculations. Physical screen reader and browser checks remain. |
| Performance | 5% | 8.8 | 4.4 | Static reference count held steady and decorative artwork is lighter. First-load JavaScript grew by 5 kB. |
| **Total** | **100%** | | **92.4** | Design review score |

## Final acceptance

**Ready for final device or environment validation.** Rendered review, TypeScript and the production build passed. The Chrome and Firebase emulator evidence covers the core guest flows, with no unresolved critical or major issue in that environment. Release acceptance depends on physical iOS Safari and Android Chrome checks, the printed QR scan and production Salam Kaut verification.
