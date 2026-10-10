# Mediary Privacy Policy

**Last updated:** 10 October 2026

Mediary ("Mediary", "we", "us") helps you record and organise your own injection and treatment information. This policy explains what information Mediary collects, why, and what rights you have over it.

Mediary is **not** a medical device and does **not** provide medical advice, diagnosis, or treatment recommendations. Always follow the instructions given to you by your healthcare professional.

If you have any question about this policy or your information, contact us at **help@artifactai.co.nz**.

---

## 1. Information we collect

### Account information
Mediary does **not** use passwords and never asks you to create one. You sign in only with **Sign in with Apple** or **Sign in with Google**. Depending on which you use and what you choose to share, we receive:
- A unique identifier for your account
- Your email address (or an Apple-provided private relay address, if you choose to hide your email)
- Your name, if you choose to share it

We never see or store your Apple ID or Google account password.

If you sign in with Apple, we also store one Apple-issued refresh token on our servers. We never use it to read anything from your Apple account — it exists for a single purpose: so that when you delete your Mediary account, we can tell Apple to revoke this app's access, which Apple's own guidelines require us to do. It is stored where the app itself cannot read it, and it is deleted along with your account.

### Health and treatment information you enter
Everything else in Mediary is information **you** choose to enter in order to use the app:
- Medications and treatments you track (name, category, dose, stock/batch and expiry details)
- Injection or treatment records (date, time, amount, injection site, notes)
- Symptoms you log
- Weight entries
- Free-text notes you write
- Healthcare provider or clinic names you add
- Appointments and appointment notes

This is health information. We treat it accordingly, as described below.

### Purchase and subscription status
Mediary offers a 30-day free trial and a one-time "Lifetime Access" purchase (NZ$16.99). Purchases are handled entirely by the Apple App Store or Google Play Store — **Mediary never sees or stores your card details**. We use RevenueCat to confirm your purchase and keep your entitlement status in sync with your account (e.g. "trial active" or "lifetime unlocked").

### Camera (barcode scanning)
If you use the barcode scanner to quickly fill in a medication's stock details, Mediary briefly uses your camera to read the barcode on-screen. **No photo or video is captured, stored, or uploaded** — only the decoded barcode text is used to pre-fill a form field.

### Notifications
Reminders you set are scheduled **locally on your device** using your operating system's notification system. Mediary does not operate a push-notification server, and no reminder content ever leaves your device.

### What we do *not* collect
Mediary does not include any advertising, analytics, or tracking SDKs. We do not track you across other apps or websites, and we do not build an advertising profile of you.

---

## 2. How we use your information

We use the information above only to:
- Create and secure your account
- Store and show you back the medication, treatment, and health information you entered
- Send you the local reminders you set
- Verify your free trial / Lifetime Access status
- Operate, maintain, and improve the app, and fix problems
- Meet our legal obligations

We do not use your health information for advertising, and we do not sell it.

---

## 3. Who we share information with

We share information only with the service providers that help us run Mediary, and only to the extent needed for them to provide that service:

| Who | What they do | What they see |
|---|---|---|
| **Supabase** | Our database and authentication provider | Your account data and everything you enter in the app |
| **Apple** / **Google** | Sign-in, and (for purchases) payment processing | Identity information you share when signing in; purchase/payment details for Lifetime Access |
| **RevenueCat** | Confirms and tracks your purchase/trial status | Your purchase and trial status linked to your account ID, plus the basic device and app-version information their SDK needs to validate a purchase |

We do not sell your information, and we do not share it with third parties for their own marketing purposes.

We may disclose information if required to by law, or to protect the rights, safety, or property of Mediary or others.

---

## 4. Where your information is stored

Your information is stored on servers operated by our database provider, Supabase, located in **Australia**. This means your information is transferred outside New Zealand, though it stays within the Australasian region rather than crossing to a more distant jurisdiction.

Under the New Zealand Privacy Act 2020, we take steps to ensure your information continues to receive comparable protection once it leaves New Zealand. Australia has its own comparable privacy law (the Privacy Act 1988 and the Australian Privacy Principles), and we also rely on Supabase's own security and privacy commitments, encryption in transit and at rest, and strict access controls (see below).

---

## 5. How we protect your information

- All data is encrypted in transit (TLS) and at rest.
- Our database enforces **Row Level Security**: the database itself only ever returns *your* rows to *your* account — not just the app's logic, but a hard rule enforced server-side.
- Because you sign in with Apple or Google, there is no Mediary password that could be guessed, reused, or leaked.
- Access to production data by us is limited to what is necessary to operate and support the service.

No method of storage or transmission is 100% secure, but we take reasonable, industry-standard steps to protect your information.

---

## 6. How long we keep your information

We keep your information for as long as your account is active, so the app can show you your own history.

If you delete your account (Settings → Delete Account & All Data), your account and all the health, treatment, and personal information associated with it are **permanently deleted** from our active systems. If you signed in with Apple, deletion also tells Apple to revoke this app's access to your Apple account. This cannot be undone.

---

## 7. Your rights

Under the New Zealand **Privacy Act 2020** and the **Health Information Privacy Code 2020**, you have the right to:
- Ask us what personal and health information we hold about you
- Ask us to correct information that is wrong
- Ask us to delete your information

You can exercise most of this yourself at any time, directly in the app:
- View and correct your data within the app's own screens
- Permanently delete your account and all data via **Settings → Delete Account & All Data**

For anything else — or if you'd rather we handle a request for you — email **help@artifactai.co.nz**. We will respond within the timeframes required by the Privacy Act.

If you believe we have not handled your information correctly and we haven't resolved it to your satisfaction, you may complain to the **Office of the Privacy Commissioner** (New Zealand) at [privacy.org.nz](https://www.privacy.org.nz).

---

## 8. Children

Mediary is not directed at, and is not intended to be used by, children under 16. We do not knowingly collect information from children under 16.

---

## 9. Changes to this policy

We may update this policy from time to time, for example as the app changes. We'll update the "Last updated" date above when we do. If a change is significant, we'll let you know in the app.

---

## 10. Contact us

**Email:** help@artifactai.co.nz

For data access, correction, or deletion requests, see Section 7 above.
