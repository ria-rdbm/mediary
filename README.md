# Mediary

**Injection & Treatment Tracker.** A personal health journal for recording and
organising injections, treatments, stock, symptoms, weight, notes and
appointments — and for showing a clean, structured Health Summary to a
healthcare professional. Mediary never diagnoses, recommends treatment or
doses, or interprets symptoms; see `DISCLAIMER` text in
[`src/app/(onboarding)/welcome.tsx`](src/app/(onboarding)/welcome.tsx).

New Zealand-first (NZD pricing, `d MMM yyyy` dates, kg default), built to
extend internationally.

## Architecture

- **Expo (SDK 57) + React Native + TypeScript**, file-based routing via
  **Expo Router** (`src/app/`).
- **Supabase**: Postgres + Auth + Row Level Security + Edge Functions is the
  entire backend. No custom server.
- **RevenueCat** (`react-native-purchases`) for the lifetime IAP, identified
  by the Supabase user id so entitlement follows the account, not the device.
- **TanStack Query** for all server state; **AsyncStorage** for the Supabase
  session; **expo-secure-store** available for anything more sensitive later.
- **expo-notifications** for local reminders (medication + appointment).

### Project structure

```
src/
  app/                  Expo Router routes — every file here is a screen
    (auth)/             Sign-in
    (onboarding)/        Disclaimer → categories → first medication
    (app)/               Tab navigator: Home, History, Health Summary, Settings
    medication/, record/, symptom/, weight/, note/, appointment/, provider/
                         Modal/detail routes pushed over the tabs
    paywall.tsx, health-summary-view.tsx
                         Full-screen presentation routes
  components/
    ui/                  Design system primitives (Button, Input, Card, …)
    composed/            Feature-specific composed components & forms
  context/               AuthProvider, EntitlementProvider
  hooks/                  React Query hooks per domain
  services/               Supabase queries/RPC calls per domain (no React)
  lib/                    supabase client, dateTime, notifications, revenuecat,
                          entitlement + stockAllocation (pure, tested logic)
  theme/                  Colour/typography/spacing/radius tokens
  constants/              Categories, units, sites, symptoms
  types/                  database.ts (hand-mirrored schema), domain.ts
supabase/
  migrations/             Schema, RLS policies, stock engine RPC functions
  functions/              Edge Functions (RevenueCat webhook, entitlement
                          sync, Apple token exchange, account deletion)
  tests/                  pgTAP tests for the stock engine
docs/
  COMPLIANCE_CHECKLIST.md NZ privacy + App Store/Play launch checklist
  RELEASE_CHECKLIST.md    Store-console setup steps
  account-deletion-page/  Static page to satisfy Google Play's external
                          account-deletion requirement
__tests__/                Jest unit tests for pure logic
```

### Why a Postgres function layer for stock, but not everything else

Section-by-section, most writes (create a medication, add a symptom, log a
note) are single-row inserts the client can do directly — Supabase's Row
Level Security (`auth.uid() = user_id`) is the only guard they need.

Stock is different: a single "Taken" record can touch multiple batches, and
editing or deleting that record later must reverse *exactly* what it did,
never more, never twice. That requires atomicity and an audit trail the
client can't safely assemble itself. So stock (and the treatment records
that trigger it) go through `SECURITY INVOKER` Postgres functions —
`log_treatment_record`, `update_treatment_record`, `delete_treatment_record`,
`record_stock_usage`, `add_stock_batch`, `manual_stock_adjustment`,
`delete_stock_transaction` — defined in
[`supabase/migrations/0011_stock_engine_functions.sql`](supabase/migrations/0011_stock_engine_functions.sql).
They still run as the calling user (RLS still applies underneath); they
exist for correctness, not privilege escalation.

The core invariant: a batch's `quantity` only ever changes in the same
statement that writes `stock_transactions` + `stock_transaction_allocations`
rows explaining why. Reversing a change writes a new `'reversal'` row and
marks the original `reversed = true` — history is never erased, and nothing
can be reversed twice. See [`src/lib/stockAllocation.ts`](src/lib/stockAllocation.ts)
for a pure, unit-tested mirror of the batch-walk ordering/shortfall rules the
SQL implements.

### Timezone-safe timestamps

Every health record stores a civil "local" timestamp (`occurred_local`,
e.g. `"2026-10-07T20:00:00"`, no zone) alongside a true UTC instant used only
for sorting/filtering. Display always reads the local value — see
[`src/lib/dateTime.ts`](src/lib/dateTime.ts) — so a record made at 8pm in New
Zealand still reads "8:00 PM" after the user travels, rather than silently
shifting to whatever the device's new timezone implies.

## Local setup

```bash
npm install
cp .env.example .env   # fill in the values below
npx expo start
```

You'll need a development build (not Expo Go) because of the native modules
(Apple/Google sign-in, camera, notifications, purchases, reanimated):

```bash
npx expo install -- --fix   # if expo-doctor flags anything after an update
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile development --platform android
```

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Link it and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   This applies every file in `supabase/migrations/` in order — profiles,
   providers, medications, treatment records, the stock engine, reminders,
   symptoms/weight/notes, appointments, entitlements, Apple credentials, the
   stock engine RPC functions, and a read-only `medication_stock_totals` view.
3. Project Settings → API → copy the Project URL and anon public key into
   `.env` as `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy the Edge Functions:
   ```bash
   npx supabase functions deploy revenuecat-webhook --no-verify-jwt
   npx supabase functions deploy sync-entitlement
   npx supabase functions deploy apple-token-exchange
   npx supabase functions deploy delete-account
   ```
5. Set their secrets (never put these in `.env` — see the bottom half of
   `.env.example` for the full list):
   ```bash
   npx supabase secrets set \
     REVENUECAT_WEBHOOK_AUTH_SECRET=... \
     REVENUECAT_PUBLIC_API_KEY_IOS=... REVENUECAT_PUBLIC_API_KEY_ANDROID=... \
     APPLE_CLIENT_ID=... APPLE_TEAM_ID=... APPLE_KEY_ID=... APPLE_PRIVATE_KEY="$(cat AuthKey_XXXX.p8)"
   ```

### Authentication (Sign in with Apple / Google — native only, no email/password)

**Apple**: Apple Developer → Certificates, IDs & Profiles → enable "Sign In
with Apple" on the app's App ID, and create a "Sign in with Apple" key (gives
you `APPLE_TEAM_ID` / `APPLE_KEY_ID` / the `.p8` file for
`APPLE_PRIVATE_KEY`). No extra client-side config beyond the
`usesAppleSignIn: true` already set in `app.config.ts`.

**Google**: Google Cloud Console → APIs & Services → Credentials → create a
Web OAuth client (its ID is `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, used for both
platforms by `@react-native-google-signin/google-signin`) and an iOS OAuth
client (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; its reversed form is
`EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`, consumed by `app.config.ts`'s config
plugin).

Sessions persist until explicit sign-out (`AsyncStorage` + supabase-js
auto-refresh); Apple and Google accounts stay separate identities in V1 (no
account linking), matching the spec.

### RevenueCat (Lifetime Access — NZ$16.99, no subscription, no ads)

1. Create a RevenueCat project, add the iOS app (App Store Connect in-app
   purchase, non-consumable, `nz.mediary.app.lifetime`) and the Android app
   (Play Console in-app product, `lifetime_access`).
2. Create a `lifetime` entitlement, attach both products to it, and build a
   `lifetime` offering/package. `src/lib/revenuecat.ts` looks up
   `offerings.current.lifetime` first, falling back to a product-id match.
3. Project → API keys → the **public** per-platform keys go in
   `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `_ANDROID` (client-safe). The
   **same** public keys (not the secret `sk_` key) are what
   `sync-entitlement` reads server-side from its own secrets.
4. Project settings → Integrations → Webhooks → point it at the deployed
   `revenuecat-webhook` function URL, with an Authorization header matching
   `REVENUECAT_WEBHOOK_AUTH_SECRET`. This is the source of truth that writes
   `entitlements.lifetime_purchased_at`; `sync-entitlement` is only a
   client-triggered fallback for the few seconds right after a purchase.
5. **Verify `sync-entitlement`'s REST call against current RevenueCat API
   docs before shipping** — it targets the v1 `/subscribers/{id}` read
   endpoint, which has moved around across RevenueCat SDK/API versions.

Real IAP testing needs a development/TestFlight build signed with real App
Store Connect / Play Console sandbox credentials — it cannot be exercised in
Expo Go or a simulator alone.

### Notifications

Local only (no push server). Permission is requested contextually — the
first time the user sets a medication or appointment reminder, not on cold
launch. A tapped notification deep-links into the relevant Log screen; it
never marks anything Taken/Not Taken/Completed on its own (section 26) — see
`src/app/_layout.tsx`'s notification-routing effect.

### EAS

```bash
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development   # dev client, local testing
npx eas-cli@latest build --profile production     # store submission
npx eas-cli@latest submit
```

Set `EAS_PROJECT_ID` in `.env` once `eas build:configure` creates the
project.

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest — dateTime, entitlement, stock allocation
```

The Jest suite covers the pure logic that's safe to test without a database:
timezone-preserving timestamp capture/format, trial/Lifetime Access state
transitions (including the exact moment a trial lapses into read-only), and
the stock batch-allocation algorithm (multi-batch deduction matching the
spec's worked example, insufficient-stock shortfall, earliest-expiry-first
ordering).

The transactional stock engine itself — multi-batch deduction, reversal on
delete/edit, Taken↔Not Taken, a medication change on an existing record, the
single-active-stock-unit guard, and RLS isolation between two users — is
covered by a pgTAP suite:

```bash
npx supabase start      # requires Docker
npx supabase test db
```

`supabase/tests/stock_engine_test.sql` was authored against the exact
behaviour implemented in `0011_stock_engine_functions.sql`, but this
environment had no Docker available to run `supabase start`, so it has not
been executed — run it once Docker is available, before trusting it in CI.

## Production build & store setup

See [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) for the exact
App Store Connect / Google Play Console / RevenueCat console steps, and
[`docs/COMPLIANCE_CHECKLIST.md`](docs/COMPLIANCE_CHECKLIST.md) for the NZ
privacy + platform-policy checklist (account deletion, data-use
declarations, Health apps declaration, etc.) — several items there need the
app owner's or legal's sign-off, not an engineering decision.

## Known placeholders

- `assets/icon.png`, `splash-icon.png`, and the Android adaptive-icon layers
  are still the generic Expo template artwork — replace with Mediary's real
  brand icon before any store submission. No notification icon is configured
  yet (`app.config.ts`), so Android falls back to the app icon in the status
  bar.
- `src/app/(app)/settings.tsx` links to `https://mediary.app/privacy` and
  `/terms` — placeholder URLs; point them at the real, legally-reviewed
  documents before release.
