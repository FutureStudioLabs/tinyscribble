import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { SUPPORT_EMAIL } from "@/constants/support";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — TinyScribble",
  description:
    "How TinyScribble collects, uses, and protects your information when you use our service.",
};

const UPDATED = "March 20, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated={UPDATED}>
      <section className="space-y-3">
        <p>
          TinyScribble (“we,” “us,” or “our”) is operated by{" "}
          <strong>Future Studio LLC</strong> (“Future Studio”). This Privacy Policy
          describes how we collect, use, disclose, and safeguard information when you
          use TinyScribble at tinyscribble.com and related services (the “Service”).
        </p>
        <p>
          By using the Service, you agree to this Privacy Policy. If you do not agree,
          please do not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          1. Information we collect
        </h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>
            <strong>Account information.</strong> Email address and authentication
            data when you sign in (for example, magic-link or OAuth, depending on what
            we offer).
          </li>
          <li>
            <strong>Content you provide.</strong> Images or files you upload (such as
            drawings), prompts or settings you submit, and generated outputs (for
            example, rendered images or videos) produced through the Service.
          </li>
          <li>
            <strong>Billing information.</strong> Subscription and payment-related
            information is processed by our payment provider (for example, Stripe). We
            do not store full payment card numbers on our servers.
          </li>
          <li>
            <strong>Technical data.</strong> Log data, device or browser type, general
            location derived from IP, and similar diagnostics used to operate and
            secure the Service.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          2. How we use information
        </h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>Provide, maintain, and improve the Service and generated results.</li>
          <li>Authenticate users, prevent fraud and abuse, and enforce our terms.</li>
          <li>Process subscriptions and communicate about billing or your account.</li>
          <li>Respond to support requests and comply with legal obligations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          3. Children’s privacy
        </h2>
        <p>
          TinyScribble is designed for families, but accounts should be created and
          managed by a parent or legal guardian. We do not knowingly collect personal
          information directly from children under 13 without appropriate parental
          consent where required by law. If you believe we have collected information
          from a child inappropriately, contact us and we will take reasonable steps to
          delete it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          4. Service providers and AI processing
        </h2>
        <p>
          We use trusted third parties to host data, authenticate users, process
          payments, store files, and run AI or media generation. These providers may
          process information only as needed to perform services for us and are bound
          by contractual obligations. Categories may include cloud hosting, database
          and auth, payment processing, object storage, and AI inference providers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          5. Retention
        </h2>
        <p>
          We retain information for as long as your account is active or as needed to
          provide the Service, comply with law, resolve disputes, and enforce our
          agreements. You may request deletion of your account or certain data subject
          to legal and technical limits; contact us using the email below.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          6. Security
        </h2>
        <p>
          We use reasonable administrative, technical, and organizational measures to
          protect information. No method of transmission or storage is 100% secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          7. Your rights and choices
        </h2>
        <p>
          Depending on where you live, you may have rights to access, correct, delete,
          or export personal data, or to object to certain processing. To exercise
          these rights, email us. You may also unsubscribe from marketing emails using
          the link in those messages, if applicable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          8. International users
        </h2>
        <p>
          If you access the Service from outside the United States, your information
          may be transferred to and processed in the United States or other countries
          where we or our providers operate.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          9. Changes
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated
          version on this page and revise the “Last updated” date. Continued use of
          the Service after changes means you accept the updated policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          10. Contact
        </h2>
        <p>
          Questions about this Privacy Policy:{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Privacy Policy question")}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {SUPPORT_EMAIL}
          </a>
          . For terms of use, see our{" "}
          <Link
            href="/terms"
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
