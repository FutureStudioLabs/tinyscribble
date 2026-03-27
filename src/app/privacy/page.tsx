import { LegalPageShell } from "@/components/legal/LegalPageShell";
import type { Metadata } from "next";
import Link from "next/link";

const LEGAL_EMAIL = "hello@tinyscribble.com";

export const metadata: Metadata = {
  title: "Privacy Policy — TinyScribble",
  description:
    "How TinyScribble collects, uses, and protects your information when you use our service.",
};

const EFFECTIVE = "April 1, 2026";

const h2 = "text-lg font-bold text-[#1A1A1A]" as const;
const h2Style = { fontFamily: "var(--font-fredoka)" } as const;
const h3 = "mt-4 text-base font-bold text-[#1A1A1A]" as const;

function MailTo() {
  return (
    <a
      href={`mailto:${LEGAL_EMAIL}`}
      className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
    >
      {LEGAL_EMAIL}
    </a>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      updated={EFFECTIVE}
      updatedLabel="Effective date"
    >
      <section className="space-y-3">
        <p>
          Future Studio LLC (“we,” “us,” or “our”) operates the TinyScribble web
          application.
        </p>
        <p className="text-sm text-[#6B6B6B]">
          Future Studio LLC · 30 N Gould St, Ste R, Sheridan, WY 82801
          <br />
          <MailTo />
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          1. Introduction
        </h2>
        <p>
          This Privacy Policy explains how Future Studio LLC (“we,” “us,” or “our”)
          collects, uses, stores, and shares information when you use TinyScribble (the
          “Service”). By using the Service, you agree to the practices described here.
        </p>
        <p>If you do not agree with this policy, please do not use the Service.</p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          2. Who This Service Is For
        </h2>
        <p>
          TinyScribble is intended exclusively for use by adults aged 18 and older. We
          do not knowingly collect personal information directly from children under
          18. The Service is designed for parents and caregivers who upload their
          children&apos;s artwork on the child&apos;s behalf. If you believe a minor has
          registered without parental consent, please contact us at <MailTo /> and we
          will delete the account promptly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          3. Information We Collect
        </h2>
        <h3 className={h3} style={h2Style}>
          3.1 Information You Provide
        </h3>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>
            <strong>Email address</strong> — collected at checkout via Stripe and used
            to create your account and send transactional communications.
          </li>
          <li>
            <strong>Uploaded drawings</strong> — photographs of your child&apos;s artwork
            that you upload to the Service.
          </li>
          <li>
            <strong>Payment information</strong> — processed directly by Stripe. We do not
            store your credit card number, CVV, or full payment details on our servers.
          </li>
        </ul>
        <h3 className={h3} style={h2Style}>
          3.2 Information We Generate
        </h3>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>
            <strong>AI-generated scenes and videos</strong> — created from your
            uploaded drawings using the AI models described in Section 5.
          </li>
          <li>
            <strong>Usage data</strong> — including pages visited, features used,
            generation times, and error logs, collected via PostHog analytics.
          </li>
          <li>
            <strong>Session data</strong> — including IP address, device type, browser
            type, and referral source.
          </li>
        </ul>
        <h3 className={h3} style={h2Style}>
          3.3 Information We Do Not Collect
        </h3>
        <p>
          We do not collect biometric data, health data, government ID numbers, or any
          information directly from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          4. How We Use Your Information
        </h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>
            To provide and operate the Service, including generating scenes and videos
            from uploaded drawings.
          </li>
          <li>
            To send transactional emails (trial reminders, video-ready notifications,
            sign-in codes). These are required for the Service to function.
          </li>
          <li>
            To send marketing and promotional emails, only if you have opted in during
            account creation. You may opt out at any time by clicking &quot;Unsubscribe&quot;
            in any marketing email.
          </li>
          <li>
            To improve the Service, including diagnosing errors, analyzing usage
            patterns, and improving AI output quality.
          </li>
          <li>
            To comply with legal obligations and enforce our{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
            >
              Terms of Use
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          5. AI Processing and Third-Party Models
        </h2>
        <p>
          When you upload a drawing, it is transmitted to third-party AI providers for
          processing. We currently use the following providers: Google (Nano Banana for
          image generation, Veo for video generation). We may also use alternative AI
          models — including but not limited to Kling 3.0, Sora 2.0, and other
          commercially available models — when primary providers are unavailable,
          experience technical issues, or when we determine an alternative produces
          better results. We will not notify you when model switching occurs, as this
          happens automatically in the background.
        </p>
        <p>
          By using the Service, you acknowledge and consent to your uploaded drawings
          being processed by these third-party AI providers. We select providers that
          maintain reasonable data security practices, but we do not control their
          internal data handling policies. We recommend reviewing the privacy policies
          of Google (for Gemini/Veo) if you have concerns about how your data is
          processed by these providers.
        </p>
        <p>
          We retain broad discretion to add, remove, or replace AI providers at any
          time. This policy will be updated when material changes to our AI provider
          list occur.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          6. Data Retention
        </h2>
        <h3 className={h3} style={h2Style}>
          6.1 Uploaded Drawings
        </h3>
        <p>
          We retain original uploaded drawing photographs for the duration of your
          active subscription and for 30 days after account deactivation. We retain
          these images to enable future features such as physical artwork books and
          print services. If you would like your uploaded drawings deleted earlier,
          please contact us at <MailTo />.
        </p>
        <h3 className={h3} style={h2Style}>
          6.2 Generated Scenes and Videos
        </h3>
        <p>
          Generated scenes and videos are retained for the duration of your active
          subscription and for 30 days after account deactivation. After this period,
          all generated content is permanently deleted. If you reactivate your account
          within the 30-day window, your content will be restored.
        </p>
        <h3 className={h3} style={h2Style}>
          6.3 Account and Payment Data
        </h3>
        <p>
          Account data (email, subscription status) is retained for as long as your
          account exists and for a reasonable period thereafter to comply with legal
          obligations. Payment transaction records are retained as required by
          applicable tax and accounting laws.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          7. Sharing Your Information
        </h2>
        <p>We do not sell your personal information. We share information only in the following circumstances:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>
            <strong>Service providers</strong> — including Stripe (payment processing),
            Supabase (database and authentication), Cloudflare R2 (file storage),
            PostHog (analytics), Resend (email delivery), and AI providers listed in
            Section 5. These providers process data on our behalf under contractual
            obligations.
          </li>
          <li>
            <strong>Legal compliance</strong> — if required by law, court order, or
            government authority, or to protect the rights, property, or safety of
            Future Studio LLC, our users, or others.
          </li>
          <li>
            <strong>Business transfer</strong> — in the event of a merger, acquisition,
            or sale of assets, your information may be transferred. We will notify you
            by email before such a transfer takes effect.
          </li>
          <li>
            <strong>With your explicit consent</strong> — for any other purpose not
            described in this policy.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          8. Marketing Use of Generated Content
        </h2>
        <p>
          We may use AI-generated scenes and videos (not the original drawings) for
          marketing and promotional purposes, including on our website, social media,
          and advertising materials, only if you have provided explicit consent during
          onboarding. This consent is optional and will not affect your ability to use
          the Service. You may withdraw this consent at any time by contacting us at{" "}
          <MailTo />.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          9. Cookies and Tracking
        </h2>
        <p>
          We use essential cookies required for the Service to function (authentication
          sessions). We use PostHog for analytics, which may set cookies to track usage
          patterns. You may disable non-essential cookies through your browser settings,
          though this may affect Service functionality.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          10. International Users and GDPR
        </h2>
        <p>
          TinyScribble is operated from the United States. If you access the Service
          from the European Economic Area (EEA), United Kingdom, or other regions with
          data protection laws, please be aware that your data may be transferred to
          and processed in the United States.
        </p>
        <p>
          For EEA and UK users, our lawful bases for processing are: (a) contractual
          necessity for delivering the Service; (b) legitimate interest for analytics
          and service improvement; and (c) your consent for marketing communications.
        </p>
        <p>
          EEA and UK users have the right to: access their personal data, correct
          inaccurate data, request deletion, restrict processing, object to
          processing, and data portability. To exercise these rights, contact us at{" "}
          <MailTo />.
        </p>
        <p>
          For South African users, we process your data in accordance with the
          Protection of Personal Information Act (POPIA). You have the right to access,
          correct, and request deletion of your personal information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          11. Data Security
        </h2>
        <p>
          We implement reasonable technical and organisational security measures to
          protect your information, including encrypted data transmission (HTTPS),
          access controls, and secure cloud storage via Cloudflare R2. However, no
          method of transmission or storage is 100% secure, and we cannot guarantee
          absolute security.
        </p>
        <p>
          In the event of a data breach that affects your rights and freedoms, we will
          notify affected users as required by applicable law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          12. Children&apos;s Privacy
        </h2>
        <p>
          The Service is not directed to children under 18. We do not knowingly collect
          personal information from children. The drawings uploaded to the Service are
          the creative works of children, uploaded by their parents or guardians. We
          handle this content with particular care and do not use it for any purpose
          beyond those described in this policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          13. Changes to This Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of
          material changes by email and by posting the updated policy on our website
          with a revised effective date. Your continued use of the Service after changes
          are posted constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          14. Contact Us
        </h2>
        <p>
          If you have questions, concerns, or requests regarding this Privacy Policy,
          please contact us:
        </p>
        <p>
          Future Studio LLC
          <br />
          30 N Gould St, Ste R, Sheridan, WY 82801
          <br />
          <a
            href={`mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent("Privacy Policy question")}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>
        </p>
        <p>
          For terms of use, see our{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            Terms of Use
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
