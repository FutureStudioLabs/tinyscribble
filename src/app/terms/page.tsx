import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { SUPPORT_EMAIL } from "@/constants/support";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — TinyScribble",
  description:
    "Terms governing your use of TinyScribble, subscriptions, and user content.",
};

const UPDATED = "March 20, 2026";

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service" updated={UPDATED}>
      <section className="space-y-3">
        <p>
          These Terms of Service (“Terms”) govern your access to and use of
          TinyScribble (the “Service”), a product operated by{" "}
          <strong>Future Studio LLC</strong> (“Future Studio,” “we,” “us,” or “our”).
          By accessing or using the Service, you agree to these Terms. If you do not
          agree, do not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          1. Eligibility and accounts
        </h2>
        <p>
          You must be able to form a binding contract in your jurisdiction. If you
          use the Service on behalf of a child or family, you represent that you are
          the parent or legal guardian (or have appropriate authorization) and accept
          these Terms on their behalf where applicable. You are responsible for
          maintaining the confidentiality of your account and for activity under
          your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          2. The Service
        </h2>
        <p>
          TinyScribble helps you upload drawings or images and generate stylized or
          animated outputs using automated and AI-assisted tools. Features may change;
          we do not guarantee uninterrupted or error-free operation. Outputs are
          generated automatically and may be imperfect or unsuitable for your intended
          use.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          3. Subscriptions and billing
        </h2>
        <p>
          Paid plans, trials, renewals, and cancellations are handled according to the
          offering presented at checkout and our payment processor’s flows. Fees are
          charged in the currency and intervals shown at purchase unless stated
          otherwise. You authorize us and our payment partners to charge your chosen
          payment method. Unless required by law or the specific offer terms, payments
          may be non-refundable. You can manage or cancel subscriptions through the
          billing tools we provide or via your payment provider where applicable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          4. Your content
        </h2>
        <p>
          You retain ownership of content you upload, subject to the rights you grant
          us below. You represent that you have the rights needed to upload the
          content and that it does not violate law or third-party rights. You grant
          Future Studio a worldwide, non-exclusive license to host, process, transmit,
          display, and create derivative works from your content solely to operate,
          improve, and provide the Service (including AI processing and storage with
          subprocessors). We may remove content that violates these Terms or that we
          reasonably believe is harmful or unlawful.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          5. Acceptable use
        </h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>Use the Service for unlawful, harassing, hateful, or exploitative purposes.</li>
          <li>Upload content you do not have rights to use, or that infringes others’ IP or privacy.</li>
          <li>Attempt to reverse engineer, scrape, overload, or disrupt the Service or others’ use.</li>
          <li>Circumvent access controls, billing, or security measures.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          6. Intellectual property
        </h2>
        <p>
          The Service, branding, and software (excluding your content) are owned by
          Future Studio or its licensors and are protected by intellectual property
          laws. Except for the limited rights to use the Service under these Terms, no
          rights are granted to you.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          7. Disclaimers
        </h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF
          ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          WE DO NOT WARRANT THAT OUTPUTS WILL MEET YOUR EXPECTATIONS OR BE ACCURATE OR
          SAFE FOR ANY PARTICULAR USE.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          8. Limitation of liability
        </h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, FUTURE STUDIO AND ITS AFFILIATES,
          OFFICERS, EMPLOYEES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
          PROFITS, DATA, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE
          SERVICE. OUR AGGREGATE LIABILITY FOR CLAIMS ARISING OUT OF OR RELATING TO THE
          SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE
          SERVICE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S.
          DOLLARS (US $100), EXCEPT WHERE PROHIBITED BY LAW.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          9. Indemnity
        </h2>
        <p>
          You will defend and indemnify Future Studio and its affiliates against any
          claims, damages, losses, and expenses (including reasonable attorneys’ fees)
          arising from your content, your use of the Service, or your violation of
          these Terms or applicable law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          10. Termination
        </h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate
          access if you violate these Terms, create risk or legal exposure, or if we
          discontinue the Service. Provisions that by their nature should survive
          will survive termination.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          11. Governing law; disputes
        </h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, USA, without
          regard to conflict-of-law rules, except where mandatory consumer protections
          in your jurisdiction apply. Exclusive jurisdiction and venue for disputes
          will be in state or federal courts located in Delaware, unless applicable
          law requires otherwise.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          12. Changes
        </h2>
        <p>
          We may modify these Terms by posting an updated version on this page and
          updating the “Last updated” date. If changes are material, we may provide
          additional notice where appropriate. Continued use after the effective date
          constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-fredoka)" }}>
          13. Contact
        </h2>
        <p>
          For questions about these Terms:{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Terms of Service question")}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {SUPPORT_EMAIL}
          </a>
          . See also our{" "}
          <Link
            href="/privacy"
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
