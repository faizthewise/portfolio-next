# Wedding Memories Love Messages delivery and review

## Summary

The Home contribution cards now open an ivory wedding guestbook and audio keepsake. Both reuse the established editorial serif, botanical palette, Lucide icons and full-width Home action. Guests can write and sign a wish, or record, listen, choose a destination and explicitly share a voice message. Success screens appear after publication acknowledgement.

**Assessment. Ready for final device validation.** Desktop Chromium and mobile viewport emulation passed the core contribution, recording and publication checks against the local Firebase rules. Physical iOS Safari and Android Chrome, including their system keyboard and permission UI, were unavailable in this workspace. All contribution tests used `demo-wedding`.

## Discovery and implementation

The text attachment contained the brief. I recreated both existing dialogs and the completed Home from the preceding source revision because the individual old-dialog images were unavailable in the supplied attachment and reference folder. The rendered baseline showed a generic textarea and an unchecked-native-checkbox Voice note sheet with a single Stop and send flow. The completed Home provided the visual reference and the unchecked box established Shared as the default. [Existing Home](love-messages-evidence/baseline-home.png) · [Existing wish](love-messages-evidence/baseline-wish.png) · [Existing voice](love-messages-evidence/baseline-voice.png)

| Files or components | Change |
|---|---|
| `MemoryGuestPanel.tsx` and `MemoryContributionSheet.tsx/.module.css` | One portal, keyboard focus boundary, inert background, body scroll lock and original control focus restoration. The contribution variant adds an editorial header, minimal close action, real visual-viewport tracking, safe-area padding, internal scroll and shared confirmation and action layouts. The upload and identity presentations keep the existing variant. |
| `MemoryWishContribution.tsx/.module.css` | Stationery-style area, event-derived salutation, accessible textarea, guest identity as the signature, public visibility copy and an explicit 2,000-character limit. Pasting beyond the limit keeps the text editable and disables sharing. |
| `useMemoryVoiceRecorder.ts` | Single recording session. Permission request → recorder start → monotonic capture time with a 30-second limit → final data and media validation → review. Real audio amplitude comes from the microphone analyser when available. A quiet baseline and real timer remain available when audio analysis cannot start. |
| `MemoryVoiceContribution.tsx/.module.css` | Circular microphone and stop controls, elapsed and remaining time, real local playback, progress and supported seeking, re-record confirmation, and two native radio destinations with botanical styling. |
| `MemoryExperience.tsx` | Shared ownership of the active contribution, verification of guest identity, deliberate upload, confirmed success, Gallery links and recovery. Close, Escape, backdrop and in-app browser Back protect unsaved content. Full document exits request a native unsaved-content prompt when supported by the browser. |
| `memories.ts`, `memoriesUploads.ts` and `wedding-memories-helpers.test.mjs` | Wish retries reconcile the same existing guest-and-timestamp document ID through a transaction. Approved voice jobs bind the guest UID at local persistence and use the same storage path and upload key during retry. The helper tests cover a lost wish acknowledgement and the approved private voice UID. |

The existing voice implementation saved an approved upload when capture stopped. The replacement keeps the Blob and preview URL in memory until the guest presses **Share message**. No review recording is written to IndexedDB. Sharing creates one durable job in the existing upload queue, which already stores audio as bytes to work around the previous WebKit Blob object-store error. A retry keeps that job and its selected destination. The review remains available after a recoverable failure. Confirmed publication is authoritative even if local queue cleanup needs reconciliation on the next session.

Voice preserves the existing first-time name gate. Wish preserves deferred name collection and returns the text unchanged if the guest leaves the name prompt. Supported audio formats and the original 4 MiB constraint remain. Finite decoder duration drives review when available. A capture measured with a monotonic clock provides the duration for complete WebM clips reported as indefinite. Sub-second clips display a fractional duration. A stopped capture delivers its final data before the stop handler finalises the Blob. [MediaStream Recording specification](https://www.w3.org/TR/mediastream-recording/) · [VisualViewport API](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)

## Rendered evidence

| Width and height | Wish | Voice |
|---|---|---|
| 320 × 568 | [Narrow wish](love-messages-evidence/wish-320x568.png) | [Narrow voice](love-messages-evidence/voice-320x568.png) |
| 375 × 667 | [375 px wish](love-messages-evidence/wish-375x667.png) | [375 px voice](love-messages-evidence/voice-375x667.png) |
| 390 × 844 | [Standard wish](love-messages-evidence/wish-390x844.png) | [Standard voice](love-messages-evidence/voice-390x844.png) |
| 430 × 932 | [430 px wish](love-messages-evidence/wish-430x932.png) | [430 px voice](love-messages-evidence/voice-430x932.png) |
| 768 × 1024 | [Tablet wish](love-messages-evidence/wish-768x1024.png) | [Tablet voice](love-messages-evidence/voice-768x1024.png) |
| 1440 × 900 | [Desktop wish](love-messages-evidence/wish-1440x900.png) | [Desktop voice](love-messages-evidence/voice-1440x900.png) |
| 390 × 490 | [Short wish](love-messages-evidence/wish-390x490.png) | [Short voice](love-messages-evidence/voice-390x490.png) |
| 844 × 390 | [Landscape wish](love-messages-evidence/wish-844x390.png) | [Landscape voice](love-messages-evidence/voice-844x390.png) |

- Wish composition and identity. [Entered wish](love-messages-evidence/wish-entered.png) · [Name prompt](love-messages-evidence/wish-identity.png) · [Simulated keyboard-height viewport](love-messages-evidence/wish-keyboard-viewport-simulated.png)
- Wish delivery. [Discard confirmation](love-messages-evidence/wish-discard.png) · [Submitting](love-messages-evidence/wish-submitting.png) · [Submission error](love-messages-evidence/wish-error.png) · [Acknowledged wish](love-messages-evidence/wish-success.png)
- Voice capture and review. [First-time identity](love-messages-evidence/voice-identity.png) · [Permission pending](love-messages-evidence/voice-permission-pending.png) · [Active recording](love-messages-evidence/voice-recording.png) · [Shared selected](love-messages-evidence/voice-review-shared.png) · [Private selected](love-messages-evidence/voice-review-private.png) · [Re-record confirmation](love-messages-evidence/voice-rerecord-confirmation.png) · [30-second review](love-messages-evidence/voice-auto-stop-review.png) · [Sub-second review](love-messages-evidence/voice-subsecond-review.png)
- Voice recovery and delivery. [Permission denied](love-messages-evidence/voice-permission-denied.png) · [Interrupted recording](love-messages-evidence/voice-interrupted.png) · [Playback error](love-messages-evidence/voice-playback-error.png) · [Submitting](love-messages-evidence/voice-submitting.png) · [Upload error](love-messages-evidence/voice-upload-error.png) · [Shared success](love-messages-evidence/voice-success-shared.png) · [Private success](love-messages-evidence/voice-success-private.png) · [Published Gallery playback](love-messages-evidence/gallery-shared-voice-playing.png)

## Functional and privacy validation

| Scenario | Observed result |
|---|---|
| Wish entry and identity | Empty and whitespace-only values could not send. A 2,001-character entry remained editable with a visible validation cue. A 2,000-character wish survived cancelling the name prompt and reopening it. A validated name persisted for subsequent visits. The opposite album used the reversed event-configured salutation. |
| Wish submission and recovery | A Firestore commit rejection showed the sending state and a friendly error with the entire wish retained. Retrying published exactly one document containing only the wish text, attributed to the saved guest name. View wishes opened Gallery Wishes. The automated helper verifies a retry after a lost acknowledgement does not create a second document. |
| Permission and recording | Opening the sheet did not request the microphone. A held permission request left the timer at 00:00. Closing during the held request stopped tracks that resolved later. Denied, missing and unsupported conditions showed distinct recovery text without raw exceptions. A track interruption ended capture without saving a recording. |
| Review and resource cleanup | Chromium produced real audio from its controlled microphone. Manual stop kept the recording local with no approved queue job. Review played, advanced and paused, including a 0.48-second clip with fractional time displayed. The injected playback failure recovered by pressing Play again. Cancelling re-record kept the same preview. Confirming re-record released that preview URL and returned to idle. Capture and dismissal stopped microphone tracks. |
| Maximum duration | A real interval of 30.38 seconds from the recording gesture through the rendered review produced a 30.00-second media duration. The test observed zero approved audio jobs and zero new private server records before Share message. |
| Shared upload and retry | After choosing Private and switching back to Shared before submission, an injected Storage upload rejection retained the local recording and existing upload key. The retry took the same pending public document to complete. View voice notes opened the public Gallery tab and the real uploaded audio played there. |
| Private upload and success | A separate recording completed at the private path. The private success sheet confirmed the destination and offered Done. The number of completed public messages did not change when the private message was sent. |
| Visibility and access | An unauthenticated reader and a separate authenticated guest both got HTTP 200 for direct public Firestore and Storage reads and HTTP 403 for both private paths. Rule tests also verify allowed reads by the recording contributor and the couple owner where appropriate. The application generated no private public-gallery URL and no unapproved private recording was persisted. |
| Unsaved content | Escape from the name prompt returned to the same wish. Closing with a draft prompted for confirmation. Browser Back restored the Home URL and presented the appropriate wish or voice confirmation. Keep preserved the content and paused voice playback. After Discard, the next Back resumed the previous Gallery history entry. [Wish kept after browser Back](love-messages-evidence/wish-browser-back-kept.png) |
| Existing entry points | Both contribution dialogs opened from Home and from the corresponding empty Gallery tabs in the groom album. The Gallery entry points used the same components and event-specific copy. |

## Responsive and accessibility review

I independently reviewed both dialogs at all eight sizes. The 320 px initial sheets fit without horizontal or internal vertical overflow. The 390 × 490 and 844 × 390 dialogs used local scrolling, and the 768 px and 1,440 px layouts centred a 520 px dialog. Standard primary actions measured 56 px high. The close buttons measured 44 × 44 px and the recording control 72 × 72 px. The mobile textarea measured 16 px. Under a simulated 476 px visual viewport while the textarea had focus, the Share wish action remained reachable through internal scrolling.

Keyboard testing verified the dialog focus loop in both directions, native arrow-key radio changes, Escape, safe confirmation focus and restoration to the opening card. The two active composer states passed an axe WCAG A/AA check with zero violations. Measured colour contrast was 7.49:1 for the primary action label, 4.91:1 for muted copy on ivory, 9.68:1 for wish text on stationery and 4.60:1 for the eyebrow. Timer changes are readable on request and produce no repeated live announcements. Capture phase changes announce through a separate status message. The sheets use no entrance or success animation, and reduced-motion emulation disabled the Home button transition.

## Iteration log

| ID | Severity | Finding | Correction and result |
|---|---|---|---|
| LM-R01 | Major | An unchecked radio appeared as a separate Tab stop in the modal focus trap, although native Tab skips it. | The shared-sheet agent groups native radios and ignores hidden candidates. Chromium forward Tab, reverse Tab and arrow-key checks passed. |
| LM-R02 | Minor | The selected visibility indicator used browser-blue styling and the 320 px idle voice sheet was 5 px taller than its scroll area. | The voice UI agent applied a botanical indicator with forced-colours support and tightened narrow-screen spacing. Final content and available height both measured 553 px at 320 × 568. |
| LM-R03 | Minor | Timer paragraph labels were flagged for manual accessibility review and under-one-second audio could visually read as 00:00. | The voice UI agent kept spoken labels in text and added fractional review duration. Axe no longer reported the manual check. |
| LM-R04 | Minor | The first presentation lacked the wedding's subtle gold rule. | The shared-sheet agent used the existing champagne token without increasing height. |
| LM-R05 | Major | Browser Back could leave the current route before the normal dismissal confirmation. | The lead connected the active draft to the Next route guard and document-exit protection. Back, Keep, Discard and normal navigation afterward were verified in Chromium. |

## Weighted review scorecard

| Dimension | Weight | Rating / 10 | Weighted | Rationale |
|---|---:|---:|---:|---|
| Premium visual quality | 25% | 9.4 | 23.50 | Restrained stationery treatment, balanced spacing and purposeful hierarchy. |
| Wedding identity consistency | 15% | 9.6 | 14.40 | Home's type, botanical actions, ivory and gold details carry through. |
| Wish-writing experience | 15% | 9.5 | 14.25 | Comfortable writing space, personal signature, clear visibility and useful confirmation. |
| Voice-recording experience | 20% | 9.5 | 19.00 | Distinct microphone, honest meter, concrete destinations, review and deliberate sharing. |
| Mobile responsiveness and accessibility | 10% | 9.2 | 9.20 | Eight layouts, keyboard and focus verification. Physical mobile system UI remains unverified. |
| Functional reliability and privacy | 15% | 9.7 | 14.55 | Real capture and playback, recoverable delivery and direct protected-read checks. |
| **Total** | **100%** | | **94.90 / 100** | Above the 90-point target. |

## Technical validation

| Check | Result |
|---|---|
| TypeScript | Standalone type check passed. |
| Production build | Clean build compiled and generated all 22 static pages. |
| Contribution lint | ESLint and Stylelint passed for the affected implementation, with one existing unused import warning in `memories.ts`. `git diff --check` passed. |
| Whole-repository lint | Older JavaScript and CSS diagnostics and the existing RSVP JSON formatting issue remain. |
| Automated suites | All 48 Wedding Memories and seven Firestore tests passed against the local emulators. |

## Delegation and remaining verification

The three implementation agents used `gpt-6.2-sol` at low reasoning. They owned separate shared sheet, recorder lifecycle and voice presentation files. The lead defined the contracts, built the wish and integration, reviewed the rendered results, delegated targeted fixes, checked the retry and privacy flows and scored the result. No model escalation was needed.

Optional success animation and richer waveform-based review scrubbing were deferred. Playback uses a native-range seek control when the browser reports a seekable interval. The synthetic microphone validates actual browser recording, duration, playback, waveform, Storage upload and track cleanup. A physical device pass remains for OS microphone and keyboard UI, Safari's format selection, touch and assistive technology.
