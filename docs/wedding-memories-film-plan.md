# Film-inspired photo looks

Replace the generic Warm/Soft choices with Original, Classic Chrome, Classic
Neg., Nostalgic Neg., and Acros. These are custom browser approximations inspired
by the film-camera palette, not Fujifilm's proprietary camera simulations.

## Implementation

- Centralize preset identifiers, names and short descriptions for camera and
  dashboard. Keep Original available. Present the longer catalog in a horizontal
  strip that fits a small phone and makes the selected look clear.
- Give each preset its own tonal/color treatment in the shared canvas renderer:
  subdued cool shadows, contrasting color negative, amber highlights, and
  monochrome respectively. Preserve plausible skin tones and highlight detail.
  Any texture must be deterministic and restrained, with no live-preview flicker.
- Keep the existing shared camera/preview/gallery/download/ZIP path. Film effects
  apply before the wedding stamp. Store each guest's chosen preset with the photo;
  keep original bytes unfiltered.
- Preserve exact legacy Warm/Soft rendering for existing records and queued jobs.
  Remove them from new camera/dashboard choices, resolving old owner defaults to
  an appropriate selectable look without changing historical photos.
- Extend Firestore validation for settings and photo metadata. Continue accepting
  legacy values so existing data remains usable. Update setup notes for rules.

## Review and validation

Use local portrait/daylight photos and a tonal/color chart to assess the actual
rendered results. Check for distinct looks, skin-tone damage, clipping, grayscale
Acros output, unchanged alpha and stable deterministic output. Recheck preview
versus full-size rendering and retain the camera stage's complete frame fit.
Run meaningful renderer tests, local Firebase integration/rules tests, TypeScript,
and production build. Root reviews the lightweight implementer's first pass and
requests corrections before acceptance. No live Firebase deployment is included.

Inspiration references:
- https://www.fujifilm-x.com/global/products/film-simulation/
- https://fujifilm-dsc.com/en-int/manual/x-h2/menu_shooting/image_quality_setting/

## First renderer review and improvement pass

Native canvas comparisons of an existing wedding portrait and another local
photo show distinct color treatments with plausible skin tones. However, the
initial contrast function was linear contrast followed by clamping. A gray-ramp
check showed Classic Neg.'s red output at 255 for all inputs 230–255, with similar
plateaus in other looks. This flattens detail in white clothes and dark fabric.

Replace the clipping curve with a smooth toe and shoulder, leave headroom for
the split-toning offsets, and test that bright/dark ramps retain useful tonal
separation. Keep the look contrast distinct and legacy algorithms unchanged.
If texture is added, use restrained deterministic monochrome grain that does
not flicker in preview or move between preview/export resolutions. Root will
repeat the image and tonal checks before accepting the result.

## Final review

The revised curve retains 19–25 distinct output levels per channel in each
26-step endpoint region. A repeat portrait comparison retains white-fabric
detail, and the four film-inspired looks remain visually distinct. Native
canvas checks across all five choices produce deterministic output, with
approximately 0.66–0.69/255 mean RGB difference between the 360 × 450 preview
and the reduced 960 × 1200 output on the same stamped chart. Legacy Warm/Soft
formulas match the prior output exactly across 4,096 sample colors.

The camera uses short labels in a scrolling strip and a single selected-look
description. The dashboard shares the catalog. Rules accept the new identifiers
and legacy data, with no unrelated rule changes in this pass. Local emulator
tests pass 14/14; TypeScript, production build and diff checks pass. Physical hardware and live
Firebase were not accessed. Deploy the extended Firestore rules with this code.
