import { Metadata } from 'next';
import { LegalShell } from '@/components/legal-shell';
import { isAdult } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Privacy Policy - Proximity',
  description: 'Proximity Privacy Policy for the dating app.',
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updatedLabel="September 18, 2026 (v2.0)">
      <p>
        This Privacy Policy explains what information Proximity collects, why we collect
        it, and how you can control it.{isAdult ? ' Because Proximity is an adult dating platform we pay particular attention to age verification and consent records.' : ''}
      </p>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account data:</strong> email, name, password (hashed), date of birth,
            gender, preferences.
          </li>
          <li>
            <strong>Verification data:</strong> your 18+ declaration, Terms & Privacy
            consent with timestamp, Terms version, the IP address used to consent, your
            verification photo, your government-issued ID upload and the date of birth
            read from it, the comment of your liveness check, and the facial fingerprint
            described in the biometrics section below.
          </li>
          <li>
            <strong>Profile & social data:</strong> bio, photos, location you provide,
            and coarse location data used for nearby matching.
          </li>
          <li>
            <strong>Usage data:</strong> matches, swipes, messages, report tickets, and
            ad activity.
          </li>
          <li>
            <strong>Device data:</strong> mobile platform, push notification tokens when
            you enable notifications.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">2. Why We Process This Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To operate the service: matching, messaging, and profile features.</li>
          <li>To verify you are 18 or older, as required for an adult platform.</li>
          <li>To record your explicit consent to the Terms and Privacy Policy.</li>
          <li>To keep the platform safe: detecting fraud, scams, and underage accounts.</li>
          <li>To provide advertising that funds the free tier of the service.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">3. Consent Records</h2>
        <p>
          When you accept our Terms and Privacy Policy we record the acceptance date,
          the version you accepted, and the IP address of the consenting request. These
          records exist so both you and the platform can prove that consent was given
          freely, specifically, and knowingly. You may request a copy of your consent
          history at any time.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">3A. Facial Recognition & Biometric Data</h2>
        <p>
          To keep Proximity an adult, real-people community we process a small amount of
          biometric data, transparently:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Facial fingerprint</strong> — a mathematical embedding (1,024 numbers)
            derived from your verification photo using a FaceNet recognition model. You
            cannot reconstruct a face from an embedding. It is used only to (a) verify the
            photo shows one, real, frontal face and (b) detect the same face registering
            more than one account (one account per person).
          </li>
          <li>
            <strong>Government-ID document</strong> — an image of your driver's license,
            passport, or national ID. We read the printed date of birth to confirm 18+ and
            match the portrait to your verification photo. The image is stored privately on
            our servers, is never displayed publicly, and is not served to any URL.
          </li>
          <li>
            <strong>Liveness result</strong> — a pass/fail outcome and blink count from a
            live camera check. The raw frames are processed on our server to detect a live
            person and are not retained.
          </li>
        </ul>
        <p>
          We do not sell biometric data, use it for advertising, or share it for any
          third-party identification purpose. You may delete your account at any time to
          have this data removed. We may retain a hash or embedding where needed to
          prevent duplicate accounts and to comply with law, as described under Retention.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">4. How We Share Data</h2>
        <p>
          We do not sell your personal data. We share data only with:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Infrastructure providers that host the service (located in the EU/US).</li>
          <li>Analytics providers (e.g. Google Analytics) that help us improve the product.</li>
          <li>Ad networks that show ads to support the free tier.</li>
          <li>Law enforcement where legally required.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">5. Cookies & Analytics</h2>
        <p>
          We use cookies for session management and analytics. Google Analytics uses
          cookies to measure how the site is used; we enable IP anonymization. You can
          block cookies in your browser; this may limit some functionality.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">6. Security</h2>
        <p>
          Passwords are hashed and never stored in plain text. Verification photos and
          uploaded ID documents are stored privately and are never exposed through any
          public URL or shown to other members. Communications between your browser and
          the platform are encrypted. No method of transmission is 100% secure; we work
          hard to protect your data but cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">7. Your Rights</h2>
        <p>
          You may access, correct, or delete your personal data, withdraw consent, or
          export a copy of your data. Deleting your account removes your profile and
          associated records. To exercise any right, contact us using the details on the
          site.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">8. Retention</h2>
        <p>
          We keep account and verification data for as long as your account is active.
          A redacted hash of your ID document and your facial fingerprint may be retained
          after account deletion where needed to prevent re-registration and duplicate
          accounts, or to defend legal claims and comply with law. Consent and
          verification records may be retained for a reasonable period after account
          deletion for the same purposes. Liveness frames are not retained.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">9. Changes & Contact</h2>
        <p>
          We may update this policy; material changes are announced and you will be asked
          to accept the revised policy before continuing. Questions or requests can be
          sent to us via the contact details on the site.
        </p>
      </section>
    </LegalShell>
  );
}