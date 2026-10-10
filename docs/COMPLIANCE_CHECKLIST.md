# Compliance checklist

This is an engineering-level checklist of what Mediary's architecture
already does to support New Zealand privacy law and Apple/Google policy,
and what still needs the app owner's or a lawyer's sign-off before release.
**Nothing here is legal advice or a legal conclusion** — where that
distinction matters, it's called out explicitly.

## New Zealand privacy

Mediary handles health information, which the **Privacy Act 2020** and the
**Health Information Privacy Code 2020** treat with extra care. This app
was built conservatively against both without asserting a specific legal
classification (e.g. "health agency") for the business — that determination
needs the owner/legal, not the codebase.

| Principle (plain terms) | What the app does | Owner/legal action needed |
|---|---|---|
| Collect only what's needed | Onboarding asks for a category and a medication name only; everything else (stock, reminders, provider) is optional and added later. Auth collects only what Apple/Google return (name, email). | Confirm no additional data collection has crept in during future feature work. |
| Tell people what you collect and why | First-run disclaimer (`src/app/(onboarding)/welcome.tsx`) states the app's purpose and limits. A Privacy Policy and Terms of Use have been drafted (`docs/legal/`) and are live at the URLs linked from `src/app/(app)/settings.tsx`. | **Get the drafts legally reviewed** before public release, and move them from their current interim hosting onto a real `mediary.app` domain once that exists (update the two URLs in `settings.tsx`). |
| Keep it secure | TLS to Supabase by default (HTTPS). RLS on every user-owned table (`auth.uid() = user_id`). `entitlements` and `apple_credentials` have no client-writable policies at all — only Edge Functions (service role) touch them. | Confirm Supabase project settings have no public/anon write grants beyond what migrations define (`npx supabase db diff` before each release). |
| Let people see/correct/delete their data | Every record is user-editable/deletable in-app. "Delete Account & All Data" (section 73) cascades through every table via `on delete cascade` from `auth.users`. | None outstanding. |
| Don't keep it longer than needed | No automatic data retention/expiry job exists — data lives until the user deletes a record or their account. | Decide and document a retention policy if the business wants one; none is currently enforced. |
| Don't use it for something else | No analytics SDK, no advertising SDK, no third-party data sharing beyond Supabase (storage) and RevenueCat (purchase receipts only — never health data). | Confirm this remains true as the app evolves; audit any new dependency that could phone home. |

Launch items requiring sign-off, not code:
- [x] Privacy Policy and Terms of Use drafted (`docs/legal/`), reviewed
      against the actual codebase, and linked from both the sign-in screen
      and Settings (`src/constants/legal.ts`).
- [ ] **BLOCKING — host both documents at a publicly reachable URL.** The
      two URLs in `src/constants/legal.ts` currently point at private
      Claude artifacts that prompt "Sign in to view this page" for anyone
      who isn't the owner. Apple and Google both fetch the Privacy Policy
      URL during review, so this will fail submission as-is. Only
      `src/constants/legal.ts` needs to change once real hosting exists.
- [ ] Drafts legally reviewed.
- [ ] A decision on whether Mediary needs to register anything with the
      Office of the Privacy Commissioner, or falls under an existing
      registration — this is a legal determination, not a technical one.
- [ ] A named contact/process for a user's Privacy Act information request
      (access/correction) — the in-app settings cover self-service
      access/export informally (every screen shows the user's own data),
      but a formal request channel (e.g. a support email) should exist.

## Apple App Store

- [x] **Sign in with Apple**: implemented natively
  (`expo-apple-authentication` → `supabase.auth.signInWithIdToken`).
- [x] **Account deletion**: in-app, permanent, via the `delete-account` Edge
  Function — required by Apple's guidelines whenever an app offers account
  creation.
- [x] **Apple token revocation on deletion**: `delete-account` revokes the
  stored refresh token via Apple's `/auth/revoke` endpoint before deleting
  the user. Requires the `APPLE_*` secrets to be set (section "Setup" in
  the README) — without them, deletion still succeeds but the revocation
  step is skipped (logged, not blocking).
- [ ] **App Privacy ("Privacy Nutrition Label") in App Store Connect**: fill
  in accurately once the final data map is confirmed — at minimum, declare
  Health & Fitness data (injection/treatment records, symptoms, weight) and
  Identifiers (auth id) as collected and linked to the user, not used for
  tracking. No advertising/analytics data types apply (the app doesn't
  collect them).
- [ ] **In-App Purchase**: lifetime, non-consumable product configured in
  App Store Connect matching `nz.mediary.app.lifetime`
  (`src/lib/revenuecat.ts`).
- [ ] Encryption export compliance: `ITSAppUsesNonExemptEncryption: false`
  is already set in `app.config.ts` (standard HTTPS/TLS only) — confirm
  this stays accurate.

## Google Play

- [x] **Account deletion — in-app**: Settings → "Delete Account & All
  Data".
- [ ] **Account deletion — external web page**: Google Play requires a web
  URL (reachable without installing the app) describing how to request
  deletion, *in addition to* the in-app flow, whenever an app supports
  account creation. A starting point is published at
  [`docs/account-deletion-page/index.html`](account-deletion-page/index.html)
  — **host it at a real URL** (e.g. `https://mediary.app/delete-account`)
  and enter that URL in Play Console → App content → Data safety.
- [ ] **Data safety section**: declare health/fitness data collected,
  stored securely (Supabase/Postgres over TLS), deletable on request, and
  not shared with third parties for advertising.
- [ ] **Health apps declaration**: Play Console's "Health" content
  questionnaire — answer based on the final feature set (tracks personal
  injection/treatment records; does not provide medical advice or
  diagnosis).
- [ ] **Google Play Billing**: lifetime, non-consumable in-app product
  configured matching `lifetime_access` (`src/lib/revenuecat.ts`).
- [ ] **Google Sign-In OAuth consent screen**: scopes requested are limited
  to basic profile/email — confirm the consent screen in Google Cloud
  Console reflects that and nothing broader.

## Cross-cutting

- [ ] Decide a support/contact email and put it in both the Privacy Policy
  and the account-deletion web page.
- [ ] Before the first production build, grep the codebase for any
  remaining `console.log`/`console.warn` that could leak health data to
  device logs in production (`rg "console\\." src` is a reasonable start —
  the codebase currently only logs error objects, never record content,
  but re-check after future changes).
- [ ] Confirm no crash-reporting/analytics SDK has been added without
  updating this checklist and the relevant store privacy disclosures.
