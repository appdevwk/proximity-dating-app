import { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Community Guidelines - Proximity",
  description:
    "Proximity Community Guidelines and Safety Standards for the 18+ adult dating app.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalShell
      title="Community Guidelines & Safety Standards"
      updatedLabel="September 18, 2026"
    >
      <p>
        These Community Guidelines explain the standards of behavior we expect from
        every member. They exist to keep Proximity a safer place for consenting adults
        and to help us comply with applicable law, including obligations related to
        child safety and the prohibition of sex trafficking and commercial sexual
        activity.
      </p>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">
          1. Zero Tolerance for Child Sexual Abuse &amp; Exploitation
        </h2>
        <p>
          Proximity has a strict zero-tolerance policy for child sexual abuse material
          (CSAM) and any content or conduct involving persons under 18.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Any content depicting, describing, or soliciting sexual activity involving a
            minor is prohibited and will result in immediate account termination and
            referral to the National Center for Missing &amp; Exploited Children (NCMEC)
            CyberTipline and/or law enforcement.
          </li>
          <li>Attempting to contact, groom, or engage minors is strictly forbidden.</li>
          <li>
            We use a combination of user reports, automated detection, and human review
            to identify and remove such material as quickly as possible.
          </li>
        </ul>
        <p>
          <strong>Child Safety Point of Contact:</strong> Reports related to child
          sexual abuse or exploitation should be submitted through the in-app reporting
          tools and/or the designated safety email published on the Service. We treat
          these reports with the highest priority.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">
          2. No Prostitution, Trafficking, or Commercial Sex
        </h2>
        <p>
          In accordance with U.S. federal law (including FOSTA-SESTA) and our commitment
          to user safety:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            You may not solicit, offer, arrange, or facilitate prostitution or any
            commercial sex act.
          </li>
          <li>
            &quot;Sugar&quot; arrangements, compensated dating, or any exchange of money,
            gifts, or financial support for sexual activity are prohibited.
          </li>
          <li>
            Content that promotes or advertises escort services, paid sexual encounters,
            or similar commercial activity is not allowed.
          </li>
          <li>
            Violations will result in account suspension or permanent ban and may be
            reported to law enforcement.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">3. Consent &amp; Respect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            All interactions must be consensual. Unwanted sexual advances, pressure, or
            continued contact after a clear &quot;no&quot; or block is harassment.
          </li>
          <li>
            Do not share intimate images of another person without their explicit
            consent.
          </li>
          <li>
            Non-consensual intimate imagery, deepfakes of real people in sexual contexts,
            and revenge pornography are strictly prohibited.
          </li>
          <li>
            Respect boundaries. If someone blocks or reports you, do not attempt to
            circumvent the restriction.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">4. Authentic Profiles Only</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Use your own recent photos. Catfishing, stolen photos, or heavily misleading
            imagery is prohibited.
          </li>
          <li>
            Do not create multiple accounts to evade bans or manipulate the matching
            system.
          </li>
          <li>
            Verification (photo, face match, and where applicable government ID +
            liveness) is required for full access. Attempts to spoof verification will
            result in permanent ban.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">
          5. Prohibited Content &amp; Behavior
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Harassment, hate speech, threats, stalking, or doxxing.</li>
          <li>Spam, scams, phishing, or financial solicitation.</li>
          <li>Illegal activity of any kind.</li>
          <li>Content that glorifies violence, self-harm, or illegal drug activity.</li>
          <li>Impersonation of another person or entity.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">6. Reporting &amp; Enforcement</h2>
        <p>
          Every member can report profiles, messages, and content through the in-app
          tools. When you report:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide as much detail as possible so our team can act quickly.</li>
          <li>
            We review reports and take action that may include content removal, temporary
            suspension, permanent ban, or referral to authorities.
          </li>
          <li>
            We may also act on automated signals (for example, image analysis or
            behavioral patterns) without a user report.
          </li>
        </ul>
        <p>
          Repeated or severe violations result in permanent removal from the platform. We
          reserve the right to remove any content or account that, in our judgment,
          creates legal risk or harms the community.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">7. Safety Tips for Members</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Complete verification — verified profiles are safer for everyone.</li>
          <li>Meet in public places for the first time and tell a friend your plans.</li>
          <li>Never send money or financial information to someone you met on the app.</li>
          <li>Trust your instincts; if something feels wrong, leave and report.</li>
          <li>Use the block and report tools freely.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-pink-400 mb-2">8. Updates</h2>
        <p>
          We may update these Guidelines as laws and safety practices evolve. Continued
          use of the Service after changes constitutes acceptance of the updated
          Guidelines. Material updates are versioned and may require re-acceptance
          through the in-app legal gate.
        </p>
      </section>
    </LegalShell>
  );
}
