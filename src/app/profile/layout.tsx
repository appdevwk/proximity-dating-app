import { LegalAcceptanceGate } from "@/components/legal-acceptance-gate";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LegalAcceptanceGate>{children}</LegalAcceptanceGate>;
}
