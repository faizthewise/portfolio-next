# Wedding Memories — Photo Viewer Acceptance Criteria

## 1. Visual Quality

- [ ] The viewer feels like a premium digital wedding film album.
- [ ] The photograph is the primary visual focus.
- [ ] The dark background follows the established application visual language.
- [ ] The header is compact and visually balanced.
- [ ] The oversized outlined close button is removed.
- [ ] Contributor information remains readable.
- [ ] The favourite action remains accessible.
- [ ] Unnecessary vertical whitespace is reduced.
- [ ] A single download action is displayed.
- [ ] Existing Gallery design quality is preserved.

## 2. Film Timestamp

- [ ] Shared photographs display the wedding-specific timestamp.
- [ ] The timestamp uses the actual configured couple names.
- [ ] The timestamp uses an accurate supported date and time.
- [ ] Missing capture metadata is handled without fabrication.
- [ ] Timestamp timezone handling is correct.
- [ ] Typography resembles an analogue camera date imprint.
- [ ] Timestamp colour follows the approved amber-orange treatment.
- [ ] Timestamp is positioned vertically along the lower-left edge.
- [ ] Text reads from bottom to top.
- [ ] Timestamp remains legible.
- [ ] Timestamp is not clipped in the full-screen photograph.
- [ ] Portrait, landscape and square photographs are supported.
- [ ] No unnecessary third-party branding is introduced.
- [ ] Timestamp is not applied multiple times.

## 3. Film Treatment

- [ ] Existing film looks remain functional.
- [ ] The selected film look is preserved.
- [ ] Original-look photographs receive the timestamp without an unintended filter.
- [ ] Existing filters are not applied twice.
- [ ] Original photograph data remains intact.
- [ ] Existing uploaded photographs remain accessible.

## 4. Consistent Photograph Presentation

- [ ] Gallery thumbnails use the approved styled representation.
- [ ] Gallery full-screen previews display styled photographs.
- [ ] My album shared-photo thumbnails use the approved styled representation.
- [ ] My album shared-photo previews display styled photographs.
- [ ] Thumbnail cropping does not unnecessarily remove the timestamp.
- [ ] Existing camera-review functionality remains intact.
- [ ] Existing photo-grid layout remains intact.
- [ ] Existing loading and filtering functionality remains intact.

## 5. Viewer Navigation

Given a guest opens a photograph from Gallery or My album:

- [ ] The correct photograph opens.
- [ ] The active collection is preserved.
- [ ] Existing filters remain respected.
- [ ] Contributor information is correct.
- [ ] Photograph position is accurate where available.
- [ ] Favourite state is correct.
- [ ] Swipe left opens the next available photograph.
- [ ] Swipe right opens the previous available photograph.
- [ ] Collection boundaries are handled predictably.
- [ ] Closing the viewer restores the previous browsing context.
- [ ] Existing scroll position is preserved where supported.
- [ ] Keyboard navigation is supported.
- [ ] Navigation does not create unnecessary duplicate requests.

## 6. Photograph Sizing

- [ ] The complete photograph is visible.
- [ ] Original aspect ratio is preserved.
- [ ] Portrait photographs use available space effectively.
- [ ] Landscape photographs remain uncropped.
- [ ] Square photographs remain undistorted.
- [ ] Controls do not obscure essential photograph content.
- [ ] Short mobile viewports remain usable.
- [ ] Safe-area insets are respected.

## 7. Thumbnail Filmstrip

Conditional, if implemented:

- [ ] Filmstrip displays the correct active collection.
- [ ] Selected photograph is visually identifiable.
- [ ] Selecting a thumbnail opens the correct photograph.
- [ ] Active thumbnail remains visible during navigation.
- [ ] Optimised thumbnails are used.
- [ ] Single-photograph collections omit unnecessary navigation.
- [ ] Filmstrip does not compromise essential viewing space.

## 8. Download Functionality

- [ ] Only one guest-facing download action is displayed.
- [ ] The action is labelled Download photo.
- [ ] Download original is removed from the guest-facing viewer.
- [ ] Download styled photo is replaced by the simplified action.
- [ ] Download targets the currently displayed photograph.
- [ ] Downloaded image includes the selected film treatment.
- [ ] Downloaded image includes the embedded wedding timestamp.
- [ ] Downloaded image preserves original aspect ratio.
- [ ] Downloaded image retains appropriate resolution.
- [ ] Downloaded image does not contain viewer UI elements.
- [ ] Downloaded image is visually consistent with the preview.
- [ ] Existing download permissions remain enforced.
- [ ] Download errors receive understandable feedback.
- [ ] Original stored photographs are not deleted.

## 9. Existing Functionality Preservation

- [ ] Existing favourite functionality remains intact.
- [ ] Favourite state remains consistent across Gallery and My album.
- [ ] Existing guest identity remains intact.
- [ ] Existing contributor attribution remains intact.
- [ ] Existing photo identifiers remain intact.
- [ ] Existing photo allowance remains intact.
- [ ] Existing upload mechanisms remain intact.
- [ ] Existing visibility rules remain intact.
- [ ] Existing permitted deletion functionality remains intact.
- [ ] Existing original photograph storage remains intact.

## 10. Regression Test Matrix

Validate:

| Scenario | Required |
|---|---|
| Existing shared photograph | Yes |
| Newly captured photograph | Yes |
| Imported photograph | Yes |
| Original film look | Yes |
| Existing alternative film looks | Yes |
| Portrait photograph | Yes |
| Landscape photograph | Yes |
| Square photograph | Yes |
| Missing capture metadata | Yes |
| Existing styled photograph | Yes |
| Duplicate timestamp prevention | Yes |
| Gallery filtered collection | Yes |
| Favourites collection | Yes |
| My album collection | Yes |
| Single-photograph collection | Yes |
| Multiple-photograph collection | Yes |
| Swipe navigation | Yes |
| Favourite toggle | Yes |
| Styled photograph download | Yes |
| Download failure | Yes |
| Slow network conditions | Yes |
| iOS browser download | Where available |
| Android browser download | Where available |
| Thumbnail filmstrip | If implemented |
| Zoom and immersive mode | If implemented |

## 11. Required Review Evidence

Provide actual rendered screenshots of:

- Gallery with styled thumbnails.
- My album with styled thumbnails.
- Full-screen portrait photograph.
- Full-screen landscape photograph.
- Full-screen square photograph.
- Viewer with multiple photographs.
- Selected favourite state.
- Single download action.
- Narrow mobile viewport.
- Standard mobile viewport.
- Desktop viewport.

Provide actual exported image samples demonstrating:

- Embedded timestamp.
- Correct timestamp content.
- Selected film treatment.
- Original aspect ratio.
- Appropriate resolution.
- Visual consistency with the viewer.

Do not use screenshots of the viewer as evidence that the downloaded photograph contains an embedded timestamp.

## 12. Review Scorecard

| Dimension | Weight |
|---|---:|
| Photographic treatment and timestamp quality | 25% |
| Preview and download consistency | 20% |
| Premium viewer aesthetic | 15% |
| Mobile viewing experience | 15% |
| Navigation and interaction | 10% |
| Data integrity and existing functionality | 10% |
| Accessibility and performance | 5% |

Target overall score: at least 90/100.

The main agent must independently review actual rendered output and exported photographs.

A high visual score does not override failed mandatory criteria.

## 13. Release Gate

- [ ] All mandatory criteria are satisfied.
- [ ] No original photographs are unintentionally modified or lost.
- [ ] Existing photographs remain accessible.
- [ ] No duplicate timestamp application occurs.
- [ ] The displayed photograph and downloaded photograph are visually consistent.
- [ ] Existing favourite and navigation functionality remain intact.
- [ ] Existing upload functionality remains intact.
- [ ] Applicable linting passes.
- [ ] Applicable type checking passes.
- [ ] Applicable automated tests pass.
- [ ] Production build passes.
- [ ] Actual rendered experience has been independently reviewed.
- [ ] Actual exported photographs have been inspected.
- [ ] Deferred enhancements and limitations are documented.

Unverified photograph integrity or incorrect downloaded output prevents unconditional release approval.