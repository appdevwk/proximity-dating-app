const socials = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/proximitydating',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 3.4a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8Zm0 10.6a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4Zm6.6-10.9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/proximitydating',
    path: 'M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.4l4.4 5.9L18.9 2Zm-1 18h1.7L7.2 3.8H5.4L17.9 20Z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@proximitydating',
    path: 'M16.6 5.8a5.7 5.7 0 0 1-1.3-2.9 6 6 0 0 1-.1-1h-3.2v13.3a2.9 2.9 0 1 1-2-2.8V8.9a6.1 6.1 0 1 0 5.2 6V9.4a8.8 8.8 0 0 0 5 1.5V7.7a5.7 5.7 0 0 1-3.6-1.9Z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/proximitydating',
    path: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@proximitydating',
    path: 'M23 12s0-3.5-.4-5.2a2.6 2.6 0 0 0-1.9-1.9C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.7.4a2.6 2.6 0 0 0-1.9 2C1 8.5 1 12 1 12s0 3.5.4 5.2a2.6 2.6 0 0 0 1.9 1.9c1.8.4 8.7.4 8.7.4s6.9 0 8.7-.4a2.6 2.6 0 0 0 1.9-2c.4-1.6.4-5.1.4-5.1ZM9.8 15.7V8.3l6 3.7-6 3.7Z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/proximity-dating-app',
    path: 'M20.4 20.4h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.2V9h3.4v1.6a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.4 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm1.8 13H3.6V9h3.6v11.4Z',
  },
  {
    label: 'Pinterest',
    href: 'https://www.pinterest.com/proximitydating',
    path: 'M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2.1 0-3l1.4-5.8s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5.1-5a5.3 5.3 0 0 0-5.5 5.3c0 1 .4 2.1.9 2.7a.4.4 0 0 1 .1.4l-.3 1.2c-.1.2-.2.3-.4.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5a2.8 2.8 0 0 1-2.4-1.2l-.6 2.5c-.2.9-.8 2-.1 2.3A10 10 0 1 0 12 2Z',
  },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t py-6 text-center text-sm text-muted-foreground/80">
      <div className="mx-auto flex flex-col items-center justify-center gap-1 px-4">
        <div className="mb-2 flex items-center justify-center gap-4">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className="text-muted-foreground/70 transition-colors hover:text-pink-500"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d={s.path} />
              </svg>
            </a>
          ))}
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSS feed"
            title="RSS feed"
            className="text-muted-foreground/70 transition-colors hover:text-orange-500"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M6.2 15.4a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6ZM3.5 8.6C8.1 8.6 15.4 15.9 15.4 20.5h3.1C18.5 13.6 10.4 5.5 3.5 5.5v3.1Zm0-5.1C11.5 3.5 20.5 12.5 20.5 20.5H3.5V3.5Z"/>
            </svg>
          </a>
        </div>
        <p>&copy; 1996 WhiteKnight Studio</p>
        <p>Holiday, Florida, United States</p>
      </div>
    </footer>
  );
}