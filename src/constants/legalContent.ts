/**
 * Mediary's legal documents, rendered natively in-app by
 * `src/app/legal/[doc].tsx`.
 *
 * The wording here is the source of truth and must stay in sync with
 * `docs/legal/*.md` (kept in the repo for review/hosting) and with
 * whatever is served at the public Privacy Policy URL that App Store
 * Connect and Play Console require.
 *
 * `**bold**` markers inside `text` are rendered as bold runs — see
 * `renderInline` in the screen component.
 */

export const LEGAL_LAST_UPDATED = '10 October 2026';
export const LEGAL_CONTACT_EMAIL = 'help@artifactai.co.nz';

export type LegalBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'callout'; text: string };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  subtitle: string;
  intro: LegalBlock[];
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Privacy Policy',
  subtitle: 'How Mediary collects, uses, and protects your information.',
  intro: [
    {
      kind: 'paragraph',
      text: '**Mediary** helps you record and organise your own injection and treatment information. This policy explains what Mediary collects, why, and what rights you have over it.',
    },
    {
      kind: 'callout',
      text: 'Mediary is **not** a medical device and does **not** provide medical advice, diagnosis, or treatment recommendations. Always follow the instructions given to you by your healthcare professional.',
    },
  ],
  sections: [
    {
      title: 'Information we collect',
      blocks: [
        { kind: 'heading', text: 'Account information' },
        {
          kind: 'paragraph',
          text: 'Mediary does not use passwords and never asks you to create one. You sign in only with **Sign in with Apple** or **Sign in with Google**. Depending on which you use and what you choose to share, we receive a unique identifier for your account, your email address (or an Apple-provided private relay address, if you choose to hide your email), and your name, if you choose to share it. We never see or store your Apple ID or Google account password.',
        },
        {
          kind: 'paragraph',
          text: "If you sign in with Apple, we also store one Apple-issued refresh token on our servers. We never use it to read anything from your Apple account — it exists for a single purpose: so that when you delete your Mediary account, we can tell Apple to revoke this app's access, which Apple's own guidelines require us to do. It is stored where the app itself cannot read it, and it is deleted along with your account.",
        },
        { kind: 'heading', text: 'Health and treatment information you enter' },
        {
          kind: 'paragraph',
          text: 'Everything else in Mediary is information **you** choose to enter in order to use the app:',
        },
        {
          kind: 'list',
          items: [
            'Medications and treatments you track (name, category, dose, stock/batch and expiry details)',
            'Injection or treatment records (date, time, amount, injection site, notes)',
            'Symptoms you log',
            'Weight entries',
            'Free-text notes you write',
            'Healthcare provider or clinic names you add',
            'Appointments and appointment notes',
          ],
        },
        {
          kind: 'paragraph',
          text: 'This is health information. We treat it accordingly, as described throughout this policy.',
        },
        { kind: 'heading', text: 'Purchase status' },
        {
          kind: 'paragraph',
          text: 'Mediary offers a 30-day free trial and a one-time "Lifetime Access" purchase (NZ$16.99). Purchases are handled entirely by the Apple App Store or Google Play Store — **Mediary never sees or stores your card details**. We use RevenueCat to confirm your purchase and keep your entitlement status in sync with your account.',
        },
        { kind: 'heading', text: 'Camera (barcode scanning)' },
        {
          kind: 'paragraph',
          text: "If you use the barcode scanner to quickly fill in a medication's stock details, Mediary briefly uses your camera to read the barcode on-screen. **No photo or video is captured, stored, or uploaded** — only the decoded barcode text is used to pre-fill a form field.",
        },
        { kind: 'heading', text: 'Notifications' },
        {
          kind: 'paragraph',
          text: "Reminders you set are scheduled **locally on your device** using your operating system's notification system. Mediary does not operate a push-notification server, and no reminder content ever leaves your device.",
        },
        { kind: 'heading', text: "What we don't collect" },
        {
          kind: 'paragraph',
          text: "Mediary includes no advertising, analytics, or tracking SDKs. We don't track you across other apps or websites, and we don't build an advertising profile of you.",
        },
      ],
    },
    {
      title: 'How we use your information',
      blocks: [
        { kind: 'paragraph', text: 'We use the information above only to:' },
        {
          kind: 'list',
          items: [
            'Create and secure your account',
            'Store and show you back the medication, treatment, and health information you entered',
            'Send you the local reminders you set',
            'Verify your free trial / Lifetime Access status',
            'Operate, maintain, and improve the app, and fix problems',
            'Meet our legal obligations',
          ],
        },
        {
          kind: 'paragraph',
          text: "We don't use your health information for advertising, and we don't sell it.",
        },
      ],
    },
    {
      title: 'Who we share information with',
      blocks: [
        {
          kind: 'paragraph',
          text: 'We share information only with the service providers that help us run Mediary, and only to the extent needed for them to provide that service:',
        },
        {
          kind: 'list',
          items: [
            '**Supabase** — our database and authentication provider. Sees your account data and everything you enter in the app.',
            '**Apple / Google** — sign-in, and (for purchases) payment processing. See the identity information you share when signing in, and your purchase details for Lifetime Access.',
            '**RevenueCat** — confirms and tracks your purchase/trial status. Sees your purchase and trial status linked to your account ID, plus the basic device and app-version information their SDK needs to validate a purchase.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'We do not sell your information, and we do not share it with third parties for their own marketing purposes. We may disclose information if required to by law, or to protect the rights, safety, or property of Mediary or others.',
        },
      ],
    },
    {
      title: 'Where your information is stored',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Your information is stored on servers operated by our database provider, Supabase, located in **Australia**. This means your information is transferred outside New Zealand, though it stays within the Australasian region rather than crossing to a more distant jurisdiction.',
        },
        {
          kind: 'paragraph',
          text: "Under the New Zealand Privacy Act 2020, we take steps to ensure your information continues to receive comparable protection once it leaves New Zealand. Australia has its own comparable privacy law (the Privacy Act 1988 and the Australian Privacy Principles), and we also rely on Supabase's own security and privacy commitments, encryption in transit and at rest, and strict access controls.",
        },
      ],
    },
    {
      title: 'How we protect your information',
      blocks: [
        {
          kind: 'list',
          items: [
            'All data is encrypted in transit (TLS) and at rest.',
            'Our database enforces **Row Level Security**: the database itself only ever returns your rows to your account — not just the app\'s logic, but a hard rule enforced server-side.',
            'Because you sign in with Apple or Google, there is no Mediary password that could be guessed, reused, or leaked.',
            'Access to production data by us is limited to what is necessary to operate and support the service.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'No method of storage or transmission is 100% secure, but we take reasonable, industry-standard steps to protect your information.',
        },
      ],
    },
    {
      title: 'How long we keep your information',
      blocks: [
        {
          kind: 'paragraph',
          text: 'We keep your information for as long as your account is active, so the app can show you your own history.',
        },
        {
          kind: 'paragraph',
          text: 'If you delete your account (Settings → Delete Account & All Data), your account and all the health, treatment, and personal information associated with it are **permanently deleted** from our active systems. If you signed in with Apple, deletion also tells Apple to revoke this app\'s access to your Apple account. This cannot be undone.',
        },
      ],
    },
    {
      title: 'Your rights',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Under the New Zealand **Privacy Act 2020** and the **Health Information Privacy Code 2020**, you have the right to ask us what personal and health information we hold about you, ask us to correct information that is wrong, and ask us to delete your information.',
        },
        {
          kind: 'paragraph',
          text: "You can exercise most of this yourself at any time, directly in the app: view and correct your data within the app's own screens, or permanently delete your account and all data via **Settings → Delete Account & All Data**.",
        },
        {
          kind: 'paragraph',
          text: `For anything else — or if you'd rather we handle a request for you — email **${LEGAL_CONTACT_EMAIL}**. We will respond within the timeframes required by the Privacy Act.`,
        },
        {
          kind: 'paragraph',
          text: "If you believe we have not handled your information correctly and we haven't resolved it to your satisfaction, you may complain to the **Office of the Privacy Commissioner** (New Zealand) at privacy.org.nz.",
        },
      ],
    },
    {
      title: 'Children',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Mediary is not directed at, and is not intended to be used by, children under 16. We do not knowingly collect information from children under 16.',
        },
      ],
    },
    {
      title: 'Changes to this policy',
      blocks: [
        {
          kind: 'paragraph',
          text: 'We may update this policy from time to time, for example as the app changes. We\'ll update the "Last updated" date at the top of this page when we do. If a change is significant, we\'ll let you know in the app.',
        },
      ],
    },
    {
      title: 'Contact us',
      blocks: [
        { kind: 'paragraph', text: `Email: **${LEGAL_CONTACT_EMAIL}**` },
        {
          kind: 'paragraph',
          text: 'For data access, correction, or deletion requests, see "Your rights" above.',
        },
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Terms of Use',
  subtitle: 'The agreement between you and Mediary.',
  intro: [
    {
      kind: 'paragraph',
      text: 'These Terms govern your use of the **Mediary** mobile app. By creating an account or using Mediary, you agree to them.',
    },
    {
      kind: 'callout',
      text: '**Mediary is not a medical device.** It does not provide medical advice, diagnosis, or treatment recommendations, and it is not a substitute for professional medical care. Always follow the instructions given to you by your doctor, pharmacist, or other qualified healthcare professional. If you have a medical emergency, contact emergency services immediately — do not rely on Mediary.',
    },
  ],
  sections: [
    {
      title: "What Mediary is — and isn't",
      blocks: [
        {
          kind: 'paragraph',
          text: 'Mediary helps you record and organise your own injection and treatment information: medications, doses, treatment records, symptoms, weight, notes, provider details, and appointments.',
        },
        {
          kind: 'paragraph',
          text: 'Reminders are a convenience feature only. You are responsible for your own treatment schedule; Mediary is not responsible for missed, late, or incorrectly logged doses.',
        },
      ],
    },
    {
      title: 'Eligibility',
      blocks: [
        {
          kind: 'paragraph',
          text: "Mediary is intended for use by adults managing their own (or, where appropriate, a dependant's) treatment. You must be at least 16 years old to create an account. If you are managing treatment on behalf of someone else — for example a child or a person in your care — you confirm you are authorised to do so.",
        },
      ],
    },
    {
      title: 'Your account',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Mediary uses **Sign in with Apple** or **Sign in with Google** only — there is no Mediary password. You are responsible for keeping your Apple or Google account secure, since access to it gives access to Mediary.',
        },
        {
          kind: 'paragraph',
          text: "You agree to provide accurate information and to keep your account information up to date. You're responsible for all activity that happens under your account.",
        },
      ],
    },
    {
      title: 'Free trial and Lifetime Access',
      blocks: [
        {
          kind: 'list',
          items: [
            'New accounts get a **30-day free trial** with full access to the app.',
            'After the trial, continued use requires a one-time **"Lifetime Access" purchase (NZ$16.99)**.',
            "Purchases are processed by the **Apple App Store** or **Google Play Store**, not by Mediary directly. Billing, receipts, and refunds are handled under Apple's or Google's own purchase and refund policies — Mediary does not process payments or issue refunds directly.",
            'Lifetime Access applies to the account it was purchased on and is not transferable between accounts.',
          ],
        },
      ],
    },
    {
      title: 'Your content',
      blocks: [
        {
          kind: 'paragraph',
          text: "You own the information you enter into Mediary. You're responsible for making sure it's accurate — Mediary only stores and displays what you give it; it does not verify or validate medical accuracy.",
        },
        {
          kind: 'paragraph',
          text: "By using Mediary you confirm you have the right to enter any information you add — for example, if you're tracking treatment for a dependant.",
        },
      ],
    },
    {
      title: 'Acceptable use',
      blocks: [
        { kind: 'paragraph', text: 'You agree not to:' },
        {
          kind: 'list',
          items: [
            'Use Mediary for any unlawful purpose',
            "Try to access another user's account or data",
            'Attempt to reverse-engineer, disrupt, or interfere with the app or its backend',
            'Use Mediary to provide medical advice or treatment decisions to others as if it were a clinical tool',
          ],
        },
      ],
    },
    {
      title: 'No warranty',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Mediary is provided "as is" and "as available". To the maximum extent permitted by law, we make no warranty that the app will be uninterrupted, error-free, or fit for a particular purpose. You use Mediary\'s record-keeping, stock tracking, and reminder features at your own discretion and risk, alongside — never instead of — your healthcare professional\'s guidance.',
        },
      ],
    },
    {
      title: 'Limitation of liability',
      blocks: [
        {
          kind: 'paragraph',
          text: 'To the maximum extent permitted by New Zealand law, Mediary and its operator are not liable for any indirect, incidental, or consequential loss arising from your use of (or inability to use) the app, including any health outcome related to a missed, late, mislogged, or incorrectly tracked dose or appointment. Nothing in these Terms limits any right you have under the **New Zealand Consumer Guarantees Act 1993** that cannot lawfully be excluded.',
        },
      ],
    },
    {
      title: 'Ending your account',
      blocks: [
        {
          kind: 'paragraph',
          text: 'You may stop using Mediary at any time. You can permanently delete your account and all associated data at any time via **Settings → Delete Account & All Data** — this cannot be undone.',
        },
        { kind: 'paragraph', text: 'We may suspend or terminate accounts that breach these Terms.' },
      ],
    },
    {
      title: 'Changes',
      blocks: [
        {
          kind: 'paragraph',
          text: "We may update these Terms or the app from time to time. If a change is significant, we'll let you know in the app. Continuing to use Mediary after a change means you accept the updated Terms.",
        },
      ],
    },
    {
      title: 'Governing law',
      blocks: [
        {
          kind: 'paragraph',
          text: 'These Terms are governed by the laws of **New Zealand**, and any dispute will be subject to the exclusive jurisdiction of the courts of New Zealand.',
        },
      ],
    },
    {
      title: 'Contact',
      blocks: [{ kind: 'paragraph', text: `Email: **${LEGAL_CONTACT_EMAIL}**` }],
    },
  ],
};
