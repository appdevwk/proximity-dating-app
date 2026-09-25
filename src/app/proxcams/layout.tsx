import type { ReactNode } from 'react';
import Link from 'next/link';
import { Clapperboard, ShieldCheck } from 'lucide-react';
import { ProxCamsNav } from '@/components/proxcams/proxcams-nav';
import { CAM_CATEGORIES, REGIONS, PARTNER_JOIN_URL } from '@/lib/proxcams-data';

export const metadata = {
  title: 'PROXCAMS — Live Sex Cams, Free Cam Girls & Couples | Proximity',
  description:
    'Watch live sex cams and free cam girls streaming now. Browse female, male, trans and couples cam rooms in HD — join the action through our verified adult cam partner.',
};

export default function ProxCamsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background:
          'linear-gradient(180deg, rgba(31,3,38,1) 0%, rgba(28,8,34,1) 32%, rgba(15,2,22,1) 100%)',
      }}
    >
      <ProxCamsNav />
      <div className="flex-1">{children}</div>

      <footer className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-purple-700">
                  <Clapperboard className="h-4 w-4 text-white" />
                </span>
                <span className="text-sm font-black uppercase tracking-widest text-white">
                  PROX<span className="text-rose-400">CAMS</span>
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/50">
                Live adult webcams inside the Proximity dating app. Free to browse, HD streams,
                thousands of verified models online 24/7.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-white/70">
                Categories
              </h3>
              <ul className="space-y-2">
                {CAM_CATEGORIES.map((c) => (
                  <li key={c.key}>
                    <Link
                      href={`/proxcams?category=${c.key}`}
                      className="text-xs font-semibold text-white/50 hover:text-rose-300"
                    >
                      {c.label} Cams
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/proxcams/categories"
                    className="text-xs font-semibold text-white/50 hover:text-rose-300"
                  >
                    All Categories
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-white/70">
                Regions
              </h3>
              <ul className="space-y-2">
                {REGIONS.filter((r) => r.key !== 'all')
                  .slice(0, 6)
                  .map((r) => (
                    <li key={r.key}>
                      <Link
                        href={`/proxcams?region=${encodeURIComponent(r.key)}`}
                        className="text-xs font-semibold text-white/50 hover:text-rose-300"
                      >
                        {r.flag} {r.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-white/70">
                Info
              </h3>
              <ul className="space-y-2">
                {[
                  ['Info', 'https://www.xvlivecams.com/info/'],
                  ['Help', 'https://www.xvlivecams.com/help/'],
                  ['Terms of Use', 'https://www.xvlivecams.com/terms/'],
                  ['Privacy Policy', 'https://www.xvlivecams.com/privacy/'],
                  ['Report Abuse', 'https://www.xvlivecams.com/report-abuse/'],
                  ['Copyright Notice', 'https://www.xvlivecams.com/dmca/'],
                  ['Webmasters', 'https://www.xvlivecams.com/webmasters/'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-xs font-semibold text-white/50 hover:text-rose-300"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-white/70">
                Partner
              </h3>
              <a
                href={PARTNER_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-xs font-semibold text-white/50 hover:text-rose-300"
              >
                Join Live Cams →
              </a>
              <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/40">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ProxCams is strictly 18+. All performers are verified adults. Browsing is free;
                tipping and private shows are optional.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-center text-[10px] text-white/30">
            © {new Date().getFullYear()} Proximity · PROXCAMS is an adult entertainment module for
            members 18+. All models are 18+ and verified by our partner network.
          </div>
        </div>
      </footer>
    </div>
  );
}
