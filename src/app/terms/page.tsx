import { LegalPageShell } from "@/components/legal/LegalPageShell";
import type { Metadata } from "next";
import Link from "next/link";

const LEGAL_EMAIL = "hello@tinyscribble.com";

export const metadata: Metadata = {
  title: "Terms of Use — TinyScribble",
  description:
    "Terms governing your use of TinyScribble, subscriptions, and user content.",
};

const EFFECTIVE = "April 1, 2026";

const h2 =
  "text-lg font-bold text-[#1A1A1A] [&+p]:mt-0" as const;
const h2Style = { fontFamily: "var(--font-fredoka)" } as const;
const h3 =
  "mt-4 text-base font-bold text-[#1A1A1A]" as const;

export default function TermsOfUsePage() {
  return (
    <LegalPageShell title="Terms of Use" updated={EFFECTIVE} updatedLabel="Effective date">
      <section className="space-y-3">
        <p>Please read these Terms carefully before using TinyScribble.</p>
        <p className="text-sm text-[#6B6B6B]">
          Future Studio LLC · 30 N Gould St, Ste R, Sheridan, WY 82801
          <br />
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          1. Acceptance of Terms
        </h2>
        <p>
          These Terms of Use (“Terms”) constitute a legally binding agreement between
          you and Future Studio LLC (“we,” “us,” or “our”) governing your use of the
          TinyScribble web application and related services (the “Service”). By
          accessing or using the Service, you confirm that you are at least 18 years
          old and agree to be bound by these Terms.
        </p>
        <p>If you do not agree to these Terms, do not use the Service.</p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          2. Description of Service
        </h2>
        <p>
          TinyScribble is a subscription-based web application that allows users to
          upload photographs of hand-drawn artwork and receive AI-generated
          photorealistic scenes and animated videos inspired by those drawings. The
          Service is intended for parents and caregivers of children aged 2–10.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          3. Account Registration and Security
        </h2>
        <p>
          Account creation occurs automatically when you complete checkout via Stripe.
          You access your account using magic link authentication (a one-time code
          sent to your email). You are responsible for maintaining the security of
          your email account and for all activity that occurs under your TinyScribble
          account. You must notify us immediately at{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>{" "}
          if you suspect unauthorised access to your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          4. Subscription Plans and Billing
        </h2>
        <h3 className={h3} style={h2Style}>
          4.1 Free Trial
        </h3>
        <p>
          We offer a 3-day free trial. To start the trial, you must provide a valid
          payment method. Your payment method will not be charged during the trial
          period. If you do not cancel before the trial ends, your payment method will
          be automatically charged for the plan you selected.
        </p>
        <h3 className={h3} style={h2Style}>
          4.2 Subscription Plans
        </h3>
        <p>We currently offer the following plans:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>
            <strong>Starter Annual:</strong> $47.99/year ($3.99/month equivalent) —
            includes 3 videos and 20 scenes per month.
          </li>
          <li>
            <strong>Starter Monthly:</strong> $8.99/month — includes 3 videos and 20
            scenes per month.
          </li>
          <li>
            <strong>Family Annual:</strong> $83.99/year ($6.99/month equivalent) —
            includes 6 videos and 25 scenes per month.
          </li>
          <li>
            <strong>Power Annual:</strong> $119.99/year ($9.99/month equivalent) —
            includes 10 videos and 30 scenes per month.
          </li>
        </ul>
        <p>
          We reserve the right to change pricing with at least 30 days&apos; advance
          notice to existing subscribers.
        </p>
        <h3 className={h3} style={h2Style}>
          4.3 Credits
        </h3>
        <p>
          Video and scene credits are allocated monthly and do not roll over to the
          following month. Unused credits expire at the end of each billing cycle.
        </p>
        <h3 className={h3} style={h2Style}>
          4.4 Cancellation
        </h3>
        <p>
          You may cancel your subscription at any time through the Stripe billing
          portal accessible via your account settings. Cancellation stops future
          charges. Your subscription and access to the Service will continue until
          the end of the current billing period. Annual plan cancellations stop
          auto-renewal but do not entitle you to a pro-rated refund for the unused
          portion of the year.
        </p>
        <h3 className={h3} style={h2Style}>
          4.5 Refunds
        </h3>
        <p>
          All charges are final and non-refundable, except at our sole discretion. If
          you believe you were charged in error, you must contact us at{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>{" "}
          within 48 hours of the charge. We will review your request and, if we
          determine a refund is warranted, process it within 5–10 business days. This
          discretionary refund policy does not create an obligation to provide
          refunds in any future case.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          5. Acceptable Use
        </h2>
        <p>You agree to use the Service only for lawful purposes. You must not:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>
            Upload drawings that contain illegal content, obscene material, or content
            that violates any applicable law.
          </li>
          <li>
            Attempt to reverse engineer, decompile, or extract the AI models used by
            the Service.
          </li>
          <li>
            Use the Service to generate content intended to deceive, harm, or defraud
            others.
          </li>
          <li>Share, sell, or transfer your account credentials to any other person.</li>
          <li>
            Use automated tools, bots, or scripts to access or interact with the
            Service without our prior written consent.
          </li>
          <li>
            Attempt to circumvent any usage limits, access controls, or security
            measures.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          6. Intellectual Property and Content Ownership
        </h2>
        <h3 className={h3} style={h2Style}>
          6.1 Your Drawings
        </h3>
        <p>
          You retain all ownership rights to the original drawings you upload. We do
          not claim any ownership over your or your child&apos;s artwork.
        </p>
        <h3 className={h3} style={h2Style}>
          6.2 AI-Generated Output
        </h3>
        <p>
          AI-generated scenes and videos created from your uploaded drawings are
          owned by you. You may download, share, and use this content for personal and
          commercial purposes.
        </p>
        <h3 className={h3} style={h2Style}>
          6.3 Our Licence to Your Content
        </h3>
        <p>
          By using the Service, you grant Future Studio LLC a limited, non-exclusive,
          royalty-free licence to host, store, and display your uploaded drawings and
          generated content solely for the purpose of providing the Service to you
          (including displaying content in your gallery and generating AI output).
        </p>
        <h3 className={h3} style={h2Style}>
          6.4 Marketing Licence
        </h3>
        <p>
          If you have explicitly opted in to marketing use during account creation,
          you additionally grant us the right to use your AI-generated scenes and
          videos (not the original drawings) in our marketing materials, including on
          our website, social media, and promotional content. You may withdraw this
          consent at any time by contacting us at{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>
          . Withdrawal of marketing consent will not affect your subscription or
          access to the Service.
        </p>
        <h3 className={h3} style={h2Style}>
          6.5 Our Intellectual Property
        </h3>
        <p>
          The TinyScribble name, logo, website, software, and all associated
          intellectual property are owned by Future Studio LLC and are protected by
          applicable intellectual property laws. Nothing in these Terms grants you
          any right to use our intellectual property except as necessary to use the
          Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          7. AI-Generated Content Disclaimer
        </h2>
        <p>
          The Service uses artificial intelligence to generate visual content based
          on uploaded drawings. AI-generated outputs are produced algorithmically and
          may vary in quality, accuracy, and similarity to the original drawing. We
          make no warranty that generated content will meet your expectations. Outputs
          are AI-generated and may not always reflect the artistic intent of the
          original drawing.
        </p>
        <p>
          We are not responsible for any outputs that are unexpected, inaccurate, or do
          not match the input drawing. The quality of AI-generated content may vary
          depending on the AI model used at the time of generation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          8. Prohibited Content
        </h2>
        <p>You must not upload drawings or request generation of content that:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#FF7B5C]">
          <li>Depicts or promotes child sexual abuse or exploitation.</li>
          <li>
            Contains hate speech, violence, or content that promotes discrimination.
          </li>
          <li>Violates the intellectual property rights of any third party.</li>
          <li>Contains personal information of third parties without their consent.</li>
        </ul>
        <p>
          We reserve the right to remove any content that violates these prohibitions
          and to suspend or terminate accounts that repeatedly violate this section.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          9. Privacy
        </h2>
        <p>
          Your use of the Service is also governed by our Privacy Policy, available at{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            tinyscribble.com/privacy
          </Link>
          . By using the Service, you consent to our collection and use of your
          information as described in the Privacy Policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          10. Disclaimer of Warranties
        </h2>
        <p className="uppercase">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
          WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
          TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
          ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        </p>
        <p>
          We do not guarantee the availability, accuracy, or quality of any
          AI-generated content produced by the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          11. Limitation of Liability
        </h2>
        <p className="uppercase">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FUTURE STUDIO LLC AND ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
          LOSS OF DATA, LOSS OF REVENUE, OR LOSS OF GOODWILL, ARISING OUT OF OR IN
          CONNECTION WITH YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY
          OF SUCH DAMAGES.
        </p>
        <p className="uppercase">
          OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR
          USE OF THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12
          MONTHS PRECEDING THE CLAIM.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          12. Indemnification
        </h2>
        <p>
          You agree to indemnify, defend, and hold harmless Future Studio LLC and its
          officers, directors, employees, and agents from any claims, damages, losses,
          liabilities, costs, and expenses (including reasonable legal fees) arising
          from: (a) your use of the Service; (b) your violation of these Terms; (c)
          your violation of any third-party rights; or (d) any content you upload to
          the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          13. Dispute Resolution
        </h2>
        <h3 className={h3} style={h2Style}>
          13.1 Informal Resolution
        </h3>
        <p>
          Before initiating any formal dispute process, you agree to contact us at{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>{" "}
          and give us at least 30 days to attempt to resolve the dispute informally.
          Most disputes can be resolved this way.
        </p>
        <h3 className={h3} style={h2Style}>
          13.2 Binding Arbitration
        </h3>
        <p>
          If informal resolution fails, any dispute, claim, or controversy arising
          from or relating to these Terms or the Service shall be resolved by binding
          arbitration administered by the American Arbitration Association (AAA) under
          its Consumer Arbitration Rules, rather than in court. The arbitration shall
          be conducted in Sheridan County, Wyoming, or virtually if both parties
          agree.
        </p>
        <p className="uppercase">
          YOU AND FUTURE STUDIO LLC EACH WAIVE THE RIGHT TO A TRIAL BY JURY AND THE
          RIGHT TO PARTICIPATE IN CLASS ACTION LITIGATION.
        </p>
        <p>
          Notwithstanding the above, either party may seek emergency injunctive or
          other equitable relief from a court of competent jurisdiction to prevent
          irreparable harm pending arbitration.
        </p>
        <h3 className={h3} style={h2Style}>
          13.3 Governing Law
        </h3>
        <p>
          These Terms are governed by the laws of the State of Wyoming, without regard
          to its conflict of law provisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          14. Termination
        </h2>
        <p>
          We may suspend or terminate your account and access to the Service at any
          time, with or without notice, if you violate these Terms or if we determine
          that your use of the Service poses a risk to us, other users, or third
          parties.
        </p>
        <p>
          You may terminate your account at any time by cancelling your subscription
          and contacting us at{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>{" "}
          to request account deletion.
        </p>
        <p>
          Upon termination, your right to use the Service ends immediately. Content
          deletion timelines are described in our Privacy Policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          15. Changes to These Terms
        </h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you
          of material changes by email at least 14 days before they take effect. Your
          continued use of the Service after the effective date constitutes acceptance
          of the updated Terms. If you do not agree to the changes, you must cancel
          your subscription and stop using the Service before the effective date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          16. Severability
        </h2>
        <p>
          If any provision of these Terms is found to be unenforceable, the remaining
          provisions will continue in full force and effect. The unenforceable
          provision will be modified to the minimum extent necessary to make it
          enforceable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          17. Entire Agreement
        </h2>
        <p>
          These Terms, together with our Privacy Policy, constitute the entire
          agreement between you and Future Studio LLC with respect to the Service and
          supersede all prior agreements, understandings, and representations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={h2} style={h2Style}>
          18. Contact
        </h2>
        <p>For questions about these Terms, please contact:</p>
        <p>
          Future Studio LLC
          <br />
          30 N Gould St, Ste R, Sheridan, WY 82801
          <br />
          <a
            href={`mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent("Terms of Use question")}`}
            className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
          >
            {LEGAL_EMAIL}
          </a>
        </p>
      </section>
    </LegalPageShell>
  );
}
