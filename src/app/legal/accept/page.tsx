import { LegalAcceptanceGate } from "@/components/legal-acceptance-gate";
import Link from "next/link";

export const metadata = {
  title: "Accept Legal Terms | Proximity",
  robots: { index: false, follow: false },
};

export default function LegalAcceptPage() {
  return (
    <LegalAcceptanceGate>
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-300 p-6">
        <div className="text-center space-y-3">
          <p className="text-pink-400 font-semibold text-lg">You&apos;re all set</p>
          <p className="text-sm text-gray-400">
            Legal documents accepted. You can continue to the app.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-medium px-6 py-2.5 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </LegalAcceptanceGate>
  );
}
