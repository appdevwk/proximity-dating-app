import { LegalAcceptanceGate } from "@/components/legal-acceptance-gate";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LegalAcceptanceGate>{children}</LegalAcceptanceGate>;
}
