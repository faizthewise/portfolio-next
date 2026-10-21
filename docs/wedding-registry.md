# Wedding registry

- `/wedding-registry` contains the 12-item catalogue, shared guest-added gifts and reservation controls.
- `/wedding-registry-en` is the English copy, with the same products and shared reservations.
  Both routes use `WeddingRegistryPage.tsx`; copy is maintained in `src/lib/wedding/registryCopy.ts`.
  English item links stay on `/wedding-registry-en?gift=<slug>`.
- `/wedding-registry?gift=air-fryer` opens a particular item. The `gift` value is the catalogue slug.
- `/wedding-registry-v2` shows regular gifts and a general giving QR at the bottom,
  without the big-gift funds. The invitation's gift previews and main gift link use this route.
- The garden invitation uses `?mode=family`, `?mode=friend`, or `?mode=parentFriend`:
  family hides the hashtag and gifts; friend shows both; parentFriend shows gifts only.
  Missing or unrecognised modes use family. The old `friend=1` parameter is no longer used.
  Guests without the hashtag see the floral ornament in its place.
- Gift links carry the selected mode, including individual item links. Both registry return links
  preserve it, for example `/jemputan-walimatulurus-harissa-faiz?mode=parentFriend&registry=1#hadiah`.
  `registry=1` opens the invitation directly; family return links omit the gift anchor.
- Clock remains omitted. Vacuum, blanket and king-size bedsheet use the owner's supplied links.

## Product content

Edit `src/lib/wedding/registry.ts` to add items. `name` is the short label;
`fullName` is the branded product name used in the details dialog.
`image` can point to a locally saved product photo or its public image URL.
`shopUrl` retains the owner's original Shopee link.

Owner-supplied photos are stored in `public/images/wedding-registry/` and mapped
in the catalogue using `/images/wedding-registry/<filename>.JPG`. All 12 items have photos; `bath-towel.JPG` maps to Towel and
`cooking-utensils.jpg` maps to Cooking utensils.

`blanket.JPG`, `bed-sheet-set.JPG`, and `vacuum.JPG` map to Blanket, Bedsheet —
King size, and Vacuum respectively. Branded product names and readable model
numbers come from supplied photos and the owner’s edits to `fullName`. Shopee links are references only; guests may buy from
any shop. Do not infer unknown brands/models.

## Reservations

The registry uses the existing anonymous Firebase identity and atomic
`reserveGift` transaction in `data.ts`. Both invitations and the registry share
`weddings/faiz-harissa/gifts`. The air fryer keeps its existing `air-fryer` ID.
Other catalogue items use permanent UUIDs in the existing `custom-` namespace,
which the current Firestore rules already permit and protect with owner-only
cancellation. No live rules deployment or data migration is required.

Keep `reservationId` and `name` stable once an item has been reserved. Adding a
new item needs a new permanent `custom-<UUID>` ID. The route slug, branded title,
and photo can be edited independently of reservation records. The original
invitation's older gift list and contribution records remain intact; this page
shows the curated catalogue plus actively reserved guest-added custom gifts.

Reserved gifts sort after available gifts and show a prominent reserved banner.
The “Saya ingin beri hadiah lain” form saves a named gift with a stable
`custom-<UUID>` ID through the existing `createGift` transaction and immediately
reserves it for the current guest. All visitors receive it through the shared
Firestore subscription. Its owner can cancel from the detail dialog; cancelled
guest-added gifts disappear from the list without deleting the stored record.

Availability filters and reservation buttons are disabled until a successful
subscription. Shopee links remain available when the backend is unavailable.
Opening a purchase link does not automatically reserve an item or place an order.

## Big wedding gifts and contributions

A catalogue item with a `contribution` field appears in the separate big-gift
section on both language routes, instead of the ordinary gift list. Dyson is
the first such item. Add the same field to any future item:

```ts
contribution: {
  targetCents: 209900, // RM2,099; initial display price
  qrImage: "/images/your-payment-qr.png",
  qrIsPlaceholder: false,
},
```

The transfer reference is generated from the stable product slug:
`vacuum` → `wedding-vacuum`. Guests choose an amount, copy that reference into
their banking app, make the transfer, then confirm and record the amount.
The Dyson target is **RM2,099** (`209900` sen). Cards and details show the price,
reported contributions, progress and remaining amount. Fully funded gifts show
“Target reached” / “Sasaran tercapai”, sort last in their section and disappear
from the Available filter. The contribution form and QR are hidden at the target.
Existing whole-gift reservations remain respected and can still be cancelled by
their owner.

Configure each fund in the Firebase console at
`weddings/faiz-harissa/gift-funds/{slug}` before opening contributions. For the
Dyson document (`vacuum`), set these **number** fields:

- `targetCents`: `209900`
- `contributedCents`: `0` **only for a new fund**. Preserve any existing total and
  `lastContributionId` when adding a target to an existing fund.

The rules accept whole-number values stored as either Firestore integers or
doubles, since the console can encode numeric fields as doubles. Fractional sen,
negative amounts and totals above the target are still rejected. No conversion
or reset of existing fund values is needed after publishing these rules.

The Firestore `targetCents` is authoritative and updates the UI live. The catalogue
`contribution.targetCents` is the initial display price while the fund is not yet
configured or its data is loading. A missing server target blocks contributions;
guests cannot set or alter targets. Future gifts use the same setup without
editing the rules. Change prices in the console and keep the catalogue fallback
in sync.

The owner-provided payment QR is `/images/harissa-qr.jpeg`, with
`qrIsPlaceholder: false`. It is shared by gift contributions and Salam Kaut.
Display the image at its original proportions so the code is not stretched.
To open contributions, configure the fund as above and publish
the updated `firestore.rules` to project `jemputan-kahwin-6bd29`. The rules in
this change have been tested locally; this does not deploy them to production.

New records use these paths:

- `weddings/faiz-harissa/gift-funds/{slug}`: `targetCents`, `contributedCents`
  (both integer sen) and `lastContributionId` after the first contribution.
- `weddings/faiz-harissa/contributions/{receiptId}`: private, immutable record
  with `uid`, `giftId`, `reference`, `amountCents`, and `createdAt`.

Each increment is committed atomically with its matching receipt. Retry IDs
prevent double-counting, and separate gifts have independent totals. The form
limits amounts to the remaining balance, the saving code rechecks the server,
and Firestore rules reject any increment above the target, including simultaneous
submissions. Guests cannot raise the cap. An exact final contribution succeeds;
further receipts are rejected atomically. External bank transfers are not
controlled by the website: if two guests transfer before recording and one loses
the remaining capacity, they are directed to contact the couple, not transfer again. Legacy
coffee contribution records and rules remain supported. Recorded amounts are
self-reported by guests, not bank-verified payments. No transfer is initiated
by the website.
