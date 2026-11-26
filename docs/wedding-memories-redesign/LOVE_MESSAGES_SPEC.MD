# Wedding Memories — Wishes and Voice Messages Redesign

## 1. Objective

Redesign the existing Write a wish and Record a message experiences to match the premium wedding identity established by the redesigned Home, Gallery, Camera and My album experiences.

Both experiences should feel personal, emotionally engaging and intuitive.

The design must move away from generic administrative forms towards refined digital wedding keepsakes.

## 2. Source of Truth

Review:

- DESIGN_BRIEF.md
- DESIGN_SYSTEM.md
- HOME_PAGE_SPEC.md
- Existing completed home page.
- Existing wedding invitation branding.
- Current Write a wish screenshot.
- Current Voice note screenshot.
- Existing wish and voice-recording implementations.

Reuse established design tokens, typography, icons, components and wedding branding.

Do not independently introduce a new visual identity.

## 3. Design Concept

Shared concept:

Leave us a little love

Write a wish should feel like writing in an elegant wedding guestbook.

Record a message should feel like creating a personal audio keepsake.

Both experiences must feel:

- Premium.
- Romantic.
- Understated.
- Personal.
- Welcoming.
- Intuitive.
- Consistent with the wedding invitation.

Avoid generic form styling, oversized outlined controls, excessive decorative elements and technical terminology.

## 4. Technical Discovery

Before implementation, inspect:

- Existing bottom-sheet and dialog components.
- Existing wish submission flow.
- Existing guest identity management.
- Existing wish validation and character limits.
- Existing voice-recording implementation.
- Existing microphone permission handling.
- Existing audio playback functionality.
- Existing recording-duration limits.
- Existing audio upload and persistence mechanisms.
- Existing public and private voice-note visibility rules.
- Existing Gallery integration.
- Existing error and retry handling.

Preserve existing business rules unless explicitly changed by this specification.

Do not create duplicate submission or recording pipelines unnecessarily.

## 5. Shared Contribution Sheet

Create or refine a reusable contribution-sheet component.

Use the existing bottom-sheet interaction pattern on mobile.

On larger screens, use an appropriately sized centred dialog.

### Visual Requirements

- Warm ivory surface.
- Approximately 24px top corner radius on mobile.
- Subtle sheet handle.
- Minimal close icon.
- Existing editorial serif headings.
- Existing functional sans-serif body typography.
- Restrained champagne-gold ornamental details.
- Consistent botanical-green primary actions.
- Generous but purposeful whitespace.
- No heavy header borders.
- No oversized circular close button.
- No excessive floral illustrations.

Suggested horizontal padding: 24px.

Suggested section spacing: 24–32px.

Suggested related-element spacing: 8–12px.

Use actual established design-system tokens wherever available.

### Interaction Requirements

- Lock background scrolling while open.
- Respect mobile safe-area insets.
- Support keyboard and assistive-technology navigation.
- Manage focus appropriately.
- Restore focus to the originating control on dismissal.
- Keep essential actions accessible when the mobile keyboard is open.
- Support short mobile viewports.
- Prevent horizontal overflow.
- Provide an accessible close action.
- Respect reduced-motion preferences.

Do not allow accidental dismissal to silently discard a written wish or recorded message.

## 6. Write a Wish

### 6.1 Composition

Use the following vertical composition:

1. Sheet handle and close action.
2. Small pen icon in a soft-sage circular surface.
3. Editorial eyebrow.
4. Serif heading.
5. Emotional supporting description.
6. Optional small ornamental divider.
7. Stationery-inspired writing area.
8. Personalised guest signature.
9. Full-width Share wish action.
10. Discreet visibility information.

### 6.2 Copywriting

Eyebrow:

A FEW HEARTFELT WORDS

Heading:

Write a wish

Supporting description:

A little advice, a favourite memory, or simply a wish for our forever.

Decorative salutation:

Dear Harissa & Faiz,

Textarea placeholder:

Write something from the heart…

Signature:

With love, [guest name]

Primary action:

Share wish

Visibility information:

Visible to anyone with the album link.

Use event configuration for the couple names.

Use existing guest identity for the signature.

Do not hardcode guest names or couple names into reusable components.

### 6.3 Writing Area

The writing area should resemble refined wedding stationery rather than a generic form input.

Requirements:

- Warm paper-like surface.
- Subtle neutral border.
- Approximately 12–16px corner radius.
- Comfortable internal padding.
- Minimum 140–160px writing height where viewport space permits.
- Readable sans-serif input text.
- Minimum 16px input font size to avoid unintended iOS input zoom.
- Refined serif salutation.
- Discreet character counter aligned to the bottom-right.
- Visible focus state.
- Accessible input label.

The salutation must be decorative.

Do not automatically include the salutation or signature in the submitted wish payload.

Preserve the existing 2,000-character limit.

Prevent submission of empty or whitespace-only wishes.

Avoid silently truncating pasted content.

### 6.4 Guest Signature

Display the existing guest name beneath the writing area.

Example:

With love, Faiz

If guest identity is missing, use the existing identity collection mechanism.

If name editing is supported, reuse the existing mechanism.

Do not create a separate guest identity system.

### 6.5 Primary Action

Use one full-width primary button.

Label:

Share wish

Requirements:

- Match the established home-page primary button.
- Minimum preferred height of 52px.
- Optional understated heart icon.
- Clear disabled state when the wish is invalid.
- Clear submitting state.
- Prevent duplicate submissions.
- Preserve the written message if submission fails.

Suggested submitting label:

Sharing your wish…

### 6.6 Privacy

Display the existing public visibility information in a compact, readable treatment near the submission action.

Do not conceal the information behind a tooltip.

Do not introduce private wishes unless already supported.

### 6.7 Success State

After confirmed successful submission, display a dedicated confirmation state.

Heading:

With love, received.

Supporting description:

Thank you for leaving a little piece of your heart with us.

Primary action:

Done

Secondary action:

View wishes

Done dismisses the sheet and restores the originating page.

View wishes opens the Gallery Wishes section.

Only display success after the existing submission mechanism confirms success.

### 6.8 Error State

Use friendly, actionable language.

Example:

Your wish couldn't be shared. Please try again.

Preserve the written content.

Provide a retry action.

Do not expose raw technical errors to guests.

## 7. Record a Message

### 7.1 Composition

Use the following initial-state composition:

1. Sheet handle and close action.
2. Editorial eyebrow.
3. Serif heading.
4. Emotional supporting description.
5. Recording timer.
6. Audio waveform area.
7. Circular microphone control.
8. Recording instruction.
9. Duration information.
10. Visibility selector.

The microphone control should be the primary visual focal point.

### 7.2 Copywriting

Eyebrow:

A VOICE TO REMEMBER

Heading:

Record a message

Supporting description:

Some memories are even sweeter when heard in your voice.

Initial instruction:

Tap to record

Duration information:

Up to 30 seconds

Visibility heading:

Who can listen?

### 7.3 Initial State

Display:

- Timer showing 00:00.
- Quiet, inactive waveform baseline.
- Large circular microphone control.
- Tap to record instruction.
- Maximum recording duration.
- Visibility selector.

Use a botanical-green circular microphone button surrounded by a subtle soft-sage ring.

Suggested inner control size: 72px.

Suggested outer visual size: 88–96px.

Do not display a fake active waveform before recording begins.

Do not request microphone access until the guest initiates recording.

### 7.4 Visibility Selector

Replace the existing native privacy checkbox with two clearly labelled selectable options.

Option 1:

Share with everyone

Anyone with the album link

Option 2:

Just for the couple

A private message to Harissa & Faiz

Use:

- People icon for shared visibility.
- Lock icon for private visibility.
- Clearly distinguishable selected state.
- Subtle sage background for the selected option.
- Accessible radio-group semantics.

Preserve the existing default visibility behaviour.

Based on the current unchecked privacy checkbox, shared visibility appears to be the existing default. Verify this during technical discovery.

Allow visibility changes before submission.

Do not introduce new visibility rules.

Private voice notes must remain protected by existing server-side access controls.

Hiding private recordings from the public Gallery alone is not sufficient privacy enforcement.

### 7.5 Microphone Permission

Request microphone access when the guest taps the recording control.

Handle:

- Permission pending.
- Permission granted.
- Permission denied.
- Microphone unavailable.
- Unsupported recording environment.

Do not start the recording timer until recording has actually started.

Provide clear recovery guidance when permission is denied.

Example:

Microphone access is needed to record your message. Please allow access in your browser settings and try again.

Do not repeatedly request permission without guest interaction.

### 7.6 Active Recording State

Display:

- Small muted-red recording indicator.
- Recording status.
- Elapsed recording time.
- Live waveform.
- Circular stop control.
- Remaining recording duration.

Example:

Recording

00:14

16 seconds remaining

Use a square stop icon inside the primary circular control.

Preserve the existing maximum recording duration of 30 seconds.

Automatically stop recording at the maximum duration.

Automatically stopping must transition to review, not submission.

The waveform must reflect actual audio amplitude where supported.

If live amplitude cannot be obtained reliably, display a truthful recording indicator and timer instead.

Do not fabricate audio activity.

### 7.7 Review State

After recording stops, display:

- Your message heading.
- Actual recording duration.
- Playback control.
- Playback progress.
- Waveform or appropriate audio-progress visualisation.
- Record again action.
- Visibility selector.
- Full-width Share message action.

Allow the guest to listen to the entire recording before sharing.

Support play and pause.

Where supported, allow seeking.

Do not automatically play the recording.

Do not automatically upload the recording.

### 7.8 Re-recording

Provide a secondary Record again action.

If an existing recording would be discarded, request confirmation.

Suggested confirmation:

Record a new message?

Your current recording will be replaced.

Actions:

Keep recording

Record again

Do not discard the existing recording before confirmation.

Stop playback before starting a new recording.

### 7.9 Submission

Primary action:

Share message

For private visibility, the action may remain Share message with the selected private destination clearly displayed.

Suggested submitting label:

Sharing your message…

Requirements:

- Submit the reviewed recording.
- Submit the selected visibility.
- Prevent duplicate submissions.
- Preserve the recording if submission fails.
- Allow retry without requiring the guest to record again.
- Preserve existing supported audio formats.
- Preserve existing upload and storage architecture.

Do not display success before the existing upload and submission mechanism confirms success.

### 7.10 Success State

Heading:

A voice to remember.

Supporting description:

Thank you for leaving us a memory we can listen to again and again.

For shared messages, provide:

Done

View voice notes

For private messages, provide:

Done

And display:

Your message has been shared privately with Harissa & Faiz.

Do not direct guests to a public Gallery entry for a private recording.

### 7.11 Error and Recovery States

Handle:

- Microphone permission denied.
- Recording could not start.
- Recording interrupted.
- Empty or invalid recording.
- Playback failure.
- Upload failure.
- Submission failure.
- Unsupported browser capabilities.

Use clear, friendly recovery messages.

Example:

Your message couldn't be shared. You can try again without recording a new one.

Only promise recording recovery when the audio data is actually retained.

Do not expose raw technical exceptions.

### 7.12 Resource Management

Ensure:

- Microphone tracks are stopped when recording finishes.
- Microphone tracks are stopped when the sheet is dismissed.
- Playback stops when the sheet is dismissed.
- Temporary object URLs are released appropriately.
- Audio-analysis resources are cleaned up.
- Timers are cleared.
- Duplicate recording sessions are prevented.
- Pending asynchronous operations are handled safely.

Handle browser interruptions and backgrounding without falsely reporting successful recording.

## 8. Unsaved Contribution Protection

If a guest attempts to dismiss a sheet containing unsaved content, show an appropriate confirmation.

Written wish:

Discard your wish?

Your message hasn't been shared yet.

Recorded message:

Discard your recording?

Your message hasn't been shared yet.

Provide:

Keep editing or Keep message

Discard

Use existing draft persistence where available.

Do not introduce persistent storage of private recordings without reviewing privacy implications.

## 9. Responsive Design

Validate at:

- 320px.
- 375px.
- 390px.
- 430px.
- 768px.
- 1440px.

Validate:

- Mobile browser chrome.
- Mobile keyboard visibility.
- Short mobile viewports.
- Landscape orientation.
- Desktop dialogs.
- Safe-area insets.

The bottom sheet may expand when the keyboard opens.

Essential actions must remain reachable through appropriate internal scrolling.

Do not use rigid fixed heights that cause content clipping.

## 10. Accessibility

Requirements:

- Accessible dialog names.
- Proper modal focus management.
- Visible keyboard focus.
- Accessible textarea label.
- Accessible recording controls.
- Accessible playback controls.
- Accessible radio-group visibility selector.
- Appropriate live announcements for important status changes.
- No screen-reader announcements on every timer tick.
- Sufficient text contrast.
- Preferred 44px interactive touch targets.
- Reduced-motion support.
- Status information must not depend on colour alone.

## 11. Existing Functionality Preservation

Preserve:

- Existing guest identity.
- Existing wish submission.
- Existing character limit.
- Existing recording duration.
- Existing audio formats.
- Existing audio upload functionality.
- Existing Gallery integration.
- Existing shared and private visibility rules.
- Existing contribution ownership.
- Existing retry behaviour where applicable.

Do not change unrelated Home, Gallery, Camera, My album or photo-viewer functionality.

## 12. Implementation Priorities

P0 — Mandatory:

- Shared premium contribution-sheet styling.
- Guestbook-inspired wish composition.
- Personalised guest signature.
- Full-width primary actions.
- Clear visibility information.
- Dedicated circular recording control.
- Accurate recording timer.
- Recording review before submission.
- Clear public and private visibility selector.
- Permission handling.
- Success and error states.
- Submission retry.
- Unsaved-content protection.
- Responsive and accessible behaviour.
- Recording-resource cleanup.

P1 — Enhancements:

- Live audio waveform.
- Playback waveform seeking.
- Restrained success animation.
- Subtle sheet transition refinements.

Do not prioritise optional animation or waveform enhancements over reliable recording, submission and privacy.

## 13. Completion

The redesign is successful when writing a wish feels like leaving a personal note in a wedding guestbook, and recording a message feels like creating an intimate audio keepsake.

Both experiences must feel like natural extensions of the redesigned Wedding Memories home page.