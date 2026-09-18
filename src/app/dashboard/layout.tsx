import { LegalAcceptanceGate } from "@/components/legal-acceptance-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LegalAcceptanceGate>{children}</LegalAcceptanceGate>;
}
