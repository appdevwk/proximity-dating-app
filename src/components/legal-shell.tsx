import Link from 'next/link';

interface LegalShellProps {
  title: string;
  updatedLabel: string;
  children: React.ReactNode;
}

export function LegalShell({ title, updatedLabel, children }: LegalShellProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 bg-black/80 border-b border-pink-950 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-pink-500" style={{ textShadow: '0 0 15px rgba(236,72,153,0.8)' }}>
            PROXIMITY
          </Link>
          <Link href="/" className="text-sm text-pink-400 hover:text-pink-300">
            ← Back to Proximity
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black text-pink-500 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {updatedLabel}</p>
        <div className="space-y-6 text-sm leading-relaxed text-gray-300">{children}</div>
      </main>
    </div>
  );
}