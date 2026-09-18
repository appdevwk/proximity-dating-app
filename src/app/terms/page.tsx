import { Metadata } from 'next';
import Link from 'next/link';
import { LegalShell } from '@/components/legal-shell';

export const metadata: Metadata = {
  title: 'Terms of Service - Proximity',
  description: 'Proximity Terms of Service for the 18+ adult dating app.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updatedLabel="September 17, 2026">
      <p>
        Welcome to Proximity, an 18+ adult dating platform. These Terms of Service
        (“Terms”) form a legal agreement between you and Proximity. By registering,
        you confirm you have read, understood, and accepted these Terms and our{" "}
        <Link href="/privacy" className="text-pink-400 underline">
          Privacy Policy
        </Link>
        .
      </p>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">1. Eligibility — 18+ Only</h2>
        <p>
          Proximity is strictly for adults aged 18 and older. You must confirm you are
          18 or older at registration and prove it during profile verification. Age is
          verified from evidence: the date of birth read from a government-issued ID
          (driver's license, passport MRZ, or national ID) you upload, cross-checked
          against your verification photo. Members who misstate their age or who are,
          in fact, under 18 will be removed immediately and their account banned.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">2. Explicit Consent</h2>
        <p>
          As an adult platform we record your informed consent. When you register or
          update your profile verification you are asked to (a) confirm you are 18 or
          older and (b) accept these Terms and the Privacy Policy. Your acceptance is
          stored with a timestamp, the version of the Terms you accepted, and the IP
          address used. This gives you and the platform an auditable record of consent.
          You can withdraw your consent at any time by deleting your account.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">3. Profile Verification</h2>
        <p>
          To browse, match, and message other members you must complete profile
          verification, which has four tiers:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>18+ declaration & consent</strong> — you confirm you are an adult
            and accept these Terms and the Privacy Policy (recorded with a timestamp and
            IP address).
          </li>
          <li>
            <strong>Verification photo</strong> — a clear, frontal selfie from which a
            unique facial fingerprint is derived (see the Privacy Policy).
          </li>
          <li>
            <strong>Government ID</strong> — an upload of your driver's license,
            passport, or national ID. We read the date of birth printed on it to confirm
            18+ and match the portrait against your verification photo.
          </li>
          <li>
            <strong>Liveness check</strong> — a short live camera check (e.g. blinking)
            to confirm a real person, not a photograph, is registering.
          </li>
        </ul>
        <p>
          Uploaded ID documents are stored privately and are never shown publicly. We
          may suspend accounts that do not complete verification.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">3A. One Account Per Person</h2>
        <p>
          Proximity allows one account per person. To enforce this we use the facial
          fingerprint derived from your verification photo to detect duplicate-account
          attempts with the same face, and we record a hash of each government-issued ID
          to prevent the same document being used on multiple accounts. If the same face
          or the same ID document is detected on another account, the later account will
          be refused or removed.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">4. Your Account</h2>
        <p>
          You are responsible for keeping your credentials confidential. Your account is
          personal and you may not transfer it. You agree to provide accurate information,
          including a real date of birth and a current photo. We may refuse, suspend, or
          terminate your account at any time if you breach these Terms or harm the
          community.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">5. Prohibited Conduct</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Misrepresenting your age, identity, or current location.</li>
          <li>Harassment, hate speech, threats, or non-consensual messaging.</li>
          <li>Posting content that is illegal, violent, or non-consensually intimate.</li>
          <li>Using Proximity for solicitation, scams, or any illegal purpose.</li>
          <li>Impersonating other people or creating fake profiles.</li>
          <li>Attempting to harvest member data, scrape, or interfere with the service.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">6. Adult Content</h2>
        <p>
          Proximity is an adult dating platform. Profile content must remain consensual
          and lawful. Explicit imagery is permitted only where legal where you are, only
          between consenting adults, and never involving minors. We remove unlawful content
          and cooperate with authorities when required.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">7. Reporting & Moderation</h2>
        <p>
          You can report profiles and messages using the in-app reporting tools. Our team
          reviews reports and may ban offending accounts. We may also use automated checks
          to detect fraud, scams, and underage accounts.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">8. No Guarantees</h2>
        <p>
          Proximity is provided “as is”. We do not warrant uninterrupted or error-free
          service and we do not guarantee that you will find matches. To the maximum extent
          permitted by law we disclaim warranties of merchantability, fitness for a
          particular purpose, and non-infringement.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Proximity, its owners, and operators are
          not liable for indirect, incidental, special, consequential, or punitive damages,
          or for loss of profits, data, or goodwill arising out of or related to your use of
          the service. You are solely responsible for your interactions with other members,
          including any in-person meetings, which you accept are at your own risk.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">10. Termination</h2>
        <p>
          You may stop using Proximity and request account deletion at any time. We may
          suspend or terminate your account for breaches of these Terms, fraudulent
          activity, reports of unlawful content, or to protect the safety of the community.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">11. Changes to These Terms</h2>
        <p>
          We may update these Terms. When we make material changes we prompt you to accept
          the updated Terms before continuing to use the service. Continued use after an
          update means you accept the revised Terms, and your acceptance is recorded.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">12. Contact</h2>
        <p>
          Questions about these Terms or your consent records can be sent to us via the
          contact details on the site. We respond to verified account holders promptly.
        </p>
      </section>
    </LegalShell>
  );
}