# Release checklist (console configuration)

Manual steps outside the codebase, in the order you'd actually hit them.
Each references the exact file/section in the repo that depends on it.

## 1. Supabase

- [ ] Create the production project; note the project ref.
- [ ] `npx supabase link --project-ref <ref>` then `npx supabase db push`.
- [ ] Copy the Project URL + anon public key into production env config
      (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) — set
      these as EAS secrets (`eas env:create`), not just in a local `.env`.
- [ ] Deploy all four Edge Functions (see README "Supabase" section).
- [ ] Set every Edge Function secret listed in `.env.example`'s bottom
      half via `supabase secrets set`.
- [ ] Run `npx supabase db diff --linked` once more before go-live to
      confirm the deployed schema exactly matches `supabase/migrations/`.

## 2. Apple Developer / App Store Connect

- [ ] Register the bundle id `com.mediary.app` (or your real bundle id —
      update `app.config.ts` and this checklist together if it changes).
- [ ] Enable "Sign In with Apple" capability on the App ID.
- [ ] Create a "Sign in with Apple" key (Certificates, IDs & Profiles →
      Keys) → gives `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and the `.p8` file for
      `APPLE_PRIVATE_KEY` (Supabase Edge Function secrets, not EAS env).
- [ ] Create the app record in App Store Connect.
- [ ] In-App Purchases → create a **Non-Consumable** product
      `nz.mediary.app.lifetime`, price tier ≈ NZ$16.99 (App Store
      localised pricing handles other territories automatically).
- [ ] Fill in the App Privacy ("Nutrition Label") questionnaire — see
      `docs/COMPLIANCE_CHECKLIST.md`.
- [ ] TestFlight build for internal QA before any production submission —
      real IAP and Sign in with Apple can only be tested on a device build,
      never Expo Go or a simulator for IAP.

## 3. Google Play Console

- [ ] Register the app, package name `com.mediary.app`.
- [ ] Monetization → Products → In-app products → create
      `lifetime_access`, one-time, price ≈ NZ$16.99.
- [ ] App content → Data safety → fill in using
      `docs/COMPLIANCE_CHECKLIST.md` as the source of truth.
- [ ] App content → Account deletion → enter the hosted URL for
      `docs/account-deletion-page/index.html` alongside the in-app flow.
- [ ] App content → Health → complete the declaration.
- [ ] Internal testing track before production, same reasoning as
      TestFlight above.

## 4. Google Cloud Console (Sign-In)

- [ ] Create OAuth 2.0 Client IDs: one **Web application** (becomes
      `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`) and one **iOS** (becomes
      `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; its reversed form is
      `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`).
- [ ] Add the production bundle id / package name + SHA-1 (Android) to
      the respective OAuth client configs.
- [ ] OAuth consent screen: scopes limited to profile + email; app logo
      and support email filled in.

## 5. RevenueCat

- [ ] Create the project; add the iOS app (link to the App Store Connect
      app) and the Android app (link to the Play Console app).
- [ ] Create entitlement `lifetime`; attach both store products to it.
- [ ] Create offering/package `lifetime` containing both products —
      `src/lib/revenuecat.ts` looks this up by name first.
- [ ] Copy the **public** per-platform API keys into
      `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `_ANDROID` (EAS secrets) and
      into the matching Supabase Edge Function secrets
      (`REVENUECAT_PUBLIC_API_KEY_IOS` / `_ANDROID`, used by
      `sync-entitlement`).
- [ ] Integrations → Webhooks → point at the deployed
      `revenuecat-webhook` URL; set its Authorization header to match
      `REVENUECAT_WEBHOOK_AUTH_SECRET`.
- [ ] **Re-verify `supabase/functions/sync-entitlement/index.ts`'s REST
      endpoint against RevenueCat's current API docs** before relying on
      it — flagged in the code as unverified against the latest API
      version.

## 6. EAS

- [ ] `npx eas-cli@latest build:configure`; commit the generated
      `eas.json` profiles.
- [ ] Set `EAS_PROJECT_ID`.
- [ ] Push every secret above via `eas env:create` for the `production`
      environment (never commit real secrets to `.env`).
- [ ] `eas build --platform ios --profile production` /
      `--platform android --profile production`.
- [ ] `eas submit` for both platforms once builds are approved
      internally.

## 7. Before flipping the switch

- [ ] Replace the placeholder app icon/splash (`assets/`) with Mediary's
      real branding — see README "Known placeholders".
- [ ] Point the Privacy Policy / Terms links in
      `src/app/(app)/settings.tsx` at real, published, legally-reviewed
      documents.
- [ ] Run `npx supabase test db` once Docker is available, and address
      anything it surfaces in `supabase/tests/stock_engine_test.sql`
      before trusting the stock engine in production.
