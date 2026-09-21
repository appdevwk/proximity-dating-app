export type SiteMode = 'mainstream' | 'adult';

export const SITE_MODE: SiteMode = (process.env.NEXT_PUBLIC_SITE_MODE as SiteMode) ?? 'mainstream';
export const isAdult = SITE_MODE === 'adult';

export const AD_SENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_AD_SENSE_CLIENT_ID ?? 'ca-pub-XXXXXXXXXXXXXXXX';
export const EXOCLICK_ZONE_ID =
  process.env.NEXT_PUBLIC_EXOCLICK_ZONE_ID ?? '1000000';

export const siteConfig = {
  mode: SITE_MODE,
  isAdult,
  appName: 'Proximity',
  title: isAdult ? 'Proximity - Adult Dating App' : 'Proximity - Dating App',
  description: isAdult
    ? 'Find your perfect match nearby. Advanced adult dating platform with biometric verification and ad-supported free access.'
    : 'Find your perfect match nearby. Advanced dating platform with biometric verification and ad-supported free access.',
  keywords: isAdult
    ? ['dating', 'adult dating', 'proximity', 'matchmaking', 'relationships', '18+', 'biometric verification']
    : ['dating', 'relationships', 'proximity', 'matchmaking', 'local singles', 'biometric verification'],
  adProvider: isAdult ? 'exoclick' : 'adsense',
  enabled: true,
};

export const adSlots = {
  loginBanner: '1234567890',
  registerBanner: '1234567891',
  bottomBanner: '1234567892',
  bottomBannerSecondary: '1234567894',
  interstitial: '1234567895',
  dashboardBanner: '1234567893',
};