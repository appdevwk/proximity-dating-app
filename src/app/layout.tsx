import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AdManager } from '@/components/ad-manager';
import { SiteModeProvider } from '@/components/site-mode-provider';
import { SiteFooter } from '@/components/site-footer';
import { siteConfig } from '@/lib/site-config';

const { title, description, keywords } = siteConfig;

export const metadata: Metadata = {
  title,
  description,
  keywords,
  authors: [{ name: "Proximity Team" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Proximity",
  },
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <meta name="theme-color" content="#171023" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="alternate" type="application/rss+xml" title="Proximity RSS Feed" href="/rss.xml" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FF513PQ8DT" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FF513PQ8DT', { anonymize_ip: true });
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}`,
          }}
        />
      </head>
      <body
        className="font-sans antialiased"
        style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}
      >
        <SiteModeProvider>
          {children}
          <SiteFooter />
          <Toaster />
          <AdManager />
        </SiteModeProvider>
      </body>
    </html>
  );
}