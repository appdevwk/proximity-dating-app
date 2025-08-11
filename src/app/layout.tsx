import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Proximity - 18+ Adult Dating App",
  description: "Find your perfect match nearby. Advanced dating platform with biometric verification and ad-supported free access.",
  keywords: ["dating", "adult dating", "proximity", "matchmaking", "relationships", "18+", "biometric verification"],
  authors: [{ name: "Proximity Team" }],
  openGraph: {
    title: "Proximity - Adult Dating App",
    description: "Find your perfect match nearby with our advanced dating platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proximity - Adult Dating App",
    description: "Find your perfect match nearby",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="font-sans antialiased bg-background text-foreground"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
