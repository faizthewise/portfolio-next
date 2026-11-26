# Wedding Memories — Wishes and Voice Messages Acceptance Criteria

## 1. Shared Visual Quality

- [ ] Both dialogs follow the established wedding identity.
- [ ] Both dialogs use consistent design-system tokens.
- [ ] Editorial serif typography is used for primary headings.
- [ ] Warm ivory and botanical-green styling is consistent with Home.
- [ ] Oversized outlined close buttons are removed.
- [ ] Generic sharp rectangular primary buttons are removed.
- [ ] Primary actions use established full-width button styling.
- [ ] Spacing and alignment are intentional.
- [ ] Decorative details remain understated.
- [ ] Both dialogs feel premium rather than administrative.
- [ ] Shared components are reused where appropriate.

## 2. Write a Wish — Visual Experience

- [ ] The writing experience resembles an elegant wedding guestbook.
- [ ] Emotional introductory copy is displayed.
- [ ] Couple names are sourced from event configuration.
- [ ] The decorative salutation is displayed.
- [ ] The writing area is comfortable and readable.
- [ ] Character count is displayed discreetly.
- [ ] Existing guest identity is displayed as a signature.
- [ ] Public visibility information remains readable.
- [ ] The Share wish action is prominent.
- [ ] Mobile keyboard interaction remains usable.

## 3. Write a Wish — Functional Behaviour

- [ ] Empty wishes cannot be submitted.
- [ ] Whitespace-only wishes cannot be submitted.
- [ ] The existing 2,000-character limit is enforced.
- [ ] Character count updates correctly.
- [ ] Decorative salutation is not unintentionally included in the submitted payload.
- [ ] Decorative signature is not unintentionally included in the submitted payload.
- [ ] Existing guest attribution is preserved.
- [ ] Duplicate submissions are prevented.
- [ ] Submission loading state is displayed.
- [ ] Failed submissions preserve written content.
- [ ] Failed submissions can be retried.
- [ ] Successful submission displays confirmation.
- [ ] View wishes opens the correct Gallery section.
- [ ] Unsaved content is protected against accidental dismissal.

## 4. Voice Recording — Initial State

- [ ] The heading is consistent with the home-page Record a message action.
- [ ] The microphone control is the primary visual focal point.
- [ ] Initial timer displays 00:00.
- [ ] Maximum recording duration is communicated.
- [ ] The inactive waveform does not falsely indicate recording.
- [ ] Microphone permission is requested only after guest interaction.
- [ ] Shared and private visibility options are clearly distinguishable.
- [ ] The existing default visibility behaviour is preserved.

## 5. Voice Recording — Active State

- [ ] Recording begins only after successful microphone access.
- [ ] Timer begins when recording actually starts.
- [ ] Recording status is clearly visible.
- [ ] Elapsed time is accurate.
- [ ] Remaining duration is accurate.
- [ ] Stop action is prominent.
- [ ] Recording stops at the existing 30-second maximum.
- [ ] Manual stopping works.
- [ ] Automatic stopping works.
- [ ] Stopping transitions to review.
- [ ] Stopping does not automatically submit the recording.
- [ ] Live waveform reflects actual audio activity if implemented.
- [ ] A truthful fallback is used when waveform data is unavailable.

## 6. Voice Recording — Review State

- [ ] Recorded audio can be played before submission.
- [ ] Actual recording duration is displayed.
- [ ] Playback can be paused.
- [ ] Playback progress is accurate.
- [ ] Audio is not automatically played.
- [ ] Record again is available.
- [ ] Re-recording protects the existing recording until confirmed.
- [ ] Visibility can be changed before submission.
- [ ] Share message is displayed as the primary action.
- [ ] Empty or invalid recordings cannot be submitted.

## 7. Voice Recording — Submission

- [ ] The correct reviewed recording is submitted.
- [ ] Selected visibility is submitted correctly.
- [ ] Duplicate submissions are prevented.
- [ ] Submission progress is communicated.
- [ ] Failed submissions retain the recording where recoverable.
- [ ] Recoverable failed submissions can be retried without re-recording.
- [ ] Success is shown only after confirmed submission.
- [ ] Shared messages appear in the existing public Gallery.
- [ ] Private messages do not appear in the public Gallery.
- [ ] Private-message success does not link to a public Gallery entry.

## 8. Privacy and Data Integrity

- [ ] Existing wish visibility rules are preserved.
- [ ] Existing voice-note visibility rules are preserved.
- [ ] Private voice notes are protected by server-side access controls.
- [ ] Public album users cannot retrieve private recordings through direct requests.
- [ ] Existing guest attribution is preserved.
- [ ] Existing contribution ownership is preserved.
- [ ] Existing contributions remain accessible according to their visibility.
- [ ] No unrelated guest data is modified.
- [ ] No unintended persistent storage of private recordings is introduced.

## 9. Permissions and Error Handling

- [ ] Microphone permission denial is handled.
- [ ] Microphone unavailability is handled.
- [ ] Unsupported browser environments are handled.
- [ ] Recording interruption is handled.
- [ ] Invalid recordings are handled.
- [ ] Playback errors are handled.
- [ ] Upload errors are handled.
- [ ] Submission errors are handled.
- [ ] Error messages provide actionable recovery guidance.
- [ ] Raw technical exceptions are not displayed.
- [ ] Recovery claims accurately reflect retained data.

## 10. Resource Management

- [ ] Microphone tracks stop after recording.
- [ ] Microphone tracks stop after dismissal.
- [ ] Audio playback stops after dismissal.
- [ ] Timers are cleaned up.
- [ ] Temporary object URLs are released appropriately.
- [ ] Audio-analysis resources are cleaned up.
- [ ] Duplicate recording sessions are prevented.
- [ ] Interrupted asynchronous operations are handled safely.

## 11. Responsive and Accessibility

- [ ] No horizontal overflow at supported widths.
- [ ] No clipped essential controls.
- [ ] Mobile keyboard does not make wish submission inaccessible.
- [ ] Bottom sheets support internal scrolling when necessary.
- [ ] Safe-area insets are respected.
- [ ] Desktop dialog presentation is appropriate.
- [ ] Dialog focus is managed correctly.
- [ ] Focus is restored on dismissal.
- [ ] Close controls have accessible names.
- [ ] Recording and playback controls have accessible names.
- [ ] Visibility selection supports keyboard and assistive technology.
- [ ] Status changes are communicated accessibly.
- [ ] Text contrast is sufficient.
- [ ] Reduced-motion preferences are respected.
- [ ] Important states are not communicated through colour alone.

## 12. Required Regression Scenarios

Validate:

- First-time guest.
- Returning guest.
- Missing guest identity.
- Empty wish.
- Valid wish.
- Maximum-length wish.
- Wish submission failure.
- Wish submission retry.
- Wish submission success.
- Dismissal with unsaved wish.
- Microphone permission granted.
- Microphone permission denied.
- Recording started.
- Recording manually stopped.
- Recording automatically stopped at 30 seconds.
- Recording interrupted.
- Recording playback.
- Re-recording.
- Shared voice-message submission.
- Private voice-message submission.
- Voice-message upload failure.
- Voice-message retry.
- Dismissal with unsaved recording.
- Public Gallery visibility.
- Private recording access protection.
- Mobile keyboard interaction.
- iOS Safari where available.
- Android Chrome where available.
- Desktop browser.

## 13. Required Review Evidence

Provide actual rendered screenshots of:

- Initial Write a wish sheet.
- Wish sheet with entered text.
- Wish sheet with mobile keyboard visible where available.
- Wish submission success.
- Initial Record a message sheet.
- Active recording state.
- Completed recording review.
- Shared visibility selected.
- Private visibility selected.
- Voice-message submission success.
- Representative error state.
- Narrow mobile viewport.
- Desktop dialog.

Provide functional evidence of:

- Successful wish submission.
- Successful audio recording.
- Audio playback.
- Automatic recording stop.
- Successful shared-message submission.
- Successful private-message submission.
- Private-message access protection.
- Retry behaviour.
- Recording-resource cleanup.

Do not claim physical-device testing when only browser emulation was used.

## 14. Review Scorecard

| Dimension | Weight |
|---|---:|
| Premium visual quality | 25% |
| Wedding identity consistency | 15% |
| Wish-writing experience | 15% |
| Voice-recording experience | 20% |
| Mobile responsiveness and accessibility | 10% |
| Functional reliability and privacy | 15% |

Target score: at least 90/100.

The main agent must independently evaluate actual rendered output.

A high visual score does not override failed mandatory criteria.

## 15. Release Gate

- [ ] All mandatory acceptance criteria pass.
- [ ] Existing wishes and voice notes remain accessible.
- [ ] Private voice-note access is correctly protected.
- [ ] Recording and playback remain reliable.
- [ ] Submission and retry flows remain functional.
- [ ] No critical or major regression remains.
- [ ] Applicable linting passes.
- [ ] Applicable type checking passes.
- [ ] Applicable automated tests pass.
- [ ] Production build passes.
- [ ] Actual rendered output has been independently reviewed.
- [ ] Deferred enhancements and unverified behaviour are documented.

Privacy failures, recording failures and contribution data loss prevent unconditional release approval.