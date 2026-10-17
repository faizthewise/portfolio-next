# Wedding registry

- `/wedding-registry` contains the full nine-item catalogue and reservation controls.
- `/wedding-registry?gift=air-fryer` opens a particular item. The `gift` value is the catalogue slug.
- The garden invitation shows the gift preview and gift navigation only with
  `?friend=1`. Its return URL `/jemputan-walimatulurus-harissa-faiz?friend=1&registry=1#hadiah`
  preserves this option and opens directly at the gift section.
- Clock and blanket are omitted at the owner's request; their supplied URLs were video shares.

## Product content

Edit `src/lib/wedding/registry.ts` to add items. `name` is the short label;
`fullName` is the exact branded listing title used in the details dialog.
`image` can point to a locally saved product photo or its public image URL.
`shopUrl` retains the owner's original Shopee link.

The nine product pages currently require verification/login when fetched. Their
exact titles and images have **not** been verified, so these optional fields
are intentionally empty. The UI uses an explicit image fallback and points to
Shopee for the full details. Add verified listing photos/titles before treating
product content as complete. Do not substitute photographs of similar products.

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
shows the curated catalogue only.

Availability filters and reservation buttons are disabled until a successful
subscription. Shopee links remain available when the backend is unavailable.
Opening a purchase link does not automatically reserve an item or place an order.
