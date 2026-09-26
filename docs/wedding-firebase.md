# Wedding invitation Firebase setup

Firebase is used only by `/jemputan-perkahwinan`. The web configuration is in
`src/lib/wedding/firebase.ts`; it is public configuration, not an Admin credential.
Use Node.js 20+ and pnpm to install and run the project.

## Activate the backend

1. In project `jemputan-kahwin-6bd29`, create a Firestore Standard database with
   ID `(default)` in production mode. Enable Authentication → Anonymous.
2. Open Firestore Database → Rules. Replace the rules with the complete contents
   of the repository's `firestore.rules`, then click Publish.
   These rules are scoped to this invitation and deny other paths.
3. Run `pnpm dev` and open `/jemputan-perkahwinan`. Submit a test RSVP and verify it
   under `weddings/faiz-harissa/rsvps` in the Firebase console. Collections are
   created by the first writes; no manual seed data is needed.
4. Open the invitation in a second browser profile to check shared wishes and
   gift reservations. Only the browser that reserved a gift can cancel it.
5. Deploy the updated Next.js app through your existing hosting provider. No
   service-account key, Firebase Hosting, or Cloud Storage is required.

Alternatively, with the Firebase CLI installed and signed into your account:

```sh
firebase deploy --only firestore:rules --project jemputan-kahwin-6bd29
```

## Data and behavior

- `weddings/faiz-harissa/rsvps/{anonymousUid}` stores name, attendance, guest count,
  and update time. Only that guest can read/write the RSVP through the app. The
  project owner can view responses in the Firebase console.
- `wishes/{anonymousUid}` stores public names/messages separately from attendance.
  The latest 100 wishes are displayed. Resubmitting replaces that browser's RSVP
  and wish; leaving the wish blank removes its previous public wish.
- `gifts/{giftId}` stores gift claims. Transactions prevent competing claims and
  rules enforce ownership for cancellation. Custom gifts use generated IDs.
- `contributions/{submissionId}` stores immutable guest-reported amounts in sen.
  Atomic batches update the shared coffee gift total with each record. Rules cap
  it at RM3,000 and reject unpaired writes; retries reuse the submission ID.
- Anonymous identity persists in that browser. Clearing site data or changing
  devices creates a different guest identity; this is not an invite-code system.
- Old local-storage demo entries are not migrated into the shared database.
- Contribution records are self-reported, not bank payment confirmations. Replace
  the existing placeholder DuitNow QR asset before collecting real payments.
- Anonymous authentication is ownership control, not spam prevention. There is
  no moderation dashboard or rate limiter in this implementation.

## Verification

The rules tests use only the `demo-wedding` emulator project and reset its data
before each run. They never connect to the production project. With Java 21+
and the Firebase CLI available:

```sh
firebase emulators:exec --only firestore --project demo-wedding "pnpm test:firestore"
pnpm exec tsc --noEmit --incremental false
pnpm build
```

If an emulator is already running with `firestore.rules` loaded:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 pnpm test:firestore
```
