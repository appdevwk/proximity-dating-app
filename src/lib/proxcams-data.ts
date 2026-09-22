export type CamCategory = 'female' | 'male' | 'couples' | 'trans';
export type CamFilter = 'all' | CamCategory;

export interface CamRoom {
  id: string;
  slug: string;
  name: string;
  age?: number;
  category: CamCategory;
  region: string;
  flag: string;
  viewers: number;
  hd: boolean;
  isNew: boolean;
  trending: boolean;
  vip: boolean;
  gradient: string;
  bio: string;
  tags: string[];
  embedUrl?: string;
  chaturbateUser?: string;
}

export function chaturbateEmbedUrl(username: string): string {
  return `https://chaturbate.com/${username}/embed/`;
}

export function chaturbateProfileUrl(username: string): string {
  return `https://chaturbate.com/${username}/`;
}

export const PARTNER_JOIN_URL =
  'https://www.xvlivecams.com/teen-cams/female/?campaign=7CGuc&tour=EuIR&track=xv-tab&disable_sound=0';

export const CATEGORY_JOIN_URLS: Record<CamCategory, string> = {
  female: PARTNER_JOIN_URL,
  male: PARTNER_JOIN_URL,
  couples: PARTNER_JOIN_URL,
  trans: PARTNER_JOIN_URL,
};

export function joinUrlForCategory(category: CamCategory): string {
  return CATEGORY_JOIN_URLS[category];
}

export interface CamCategoryInfo {
  key: CamCategory;
  label: string;
  blurb: string;
}

export const CAM_CATEGORIES: CamCategoryInfo[] = [
  { key: 'female', label: 'Female', blurb: 'Female cam models stream 24/7' },
  { key: 'male', label: 'Male', blurb: 'Male models ready to interact' },
  { key: 'couples', label: 'Couples', blurb: 'Couples cam together live' },
  { key: 'trans', label: 'Trans', blurb: 'Trans cam stars streaming now' },
];

export const REGIONS = [
  { key: 'all', label: 'All Regions' },
  { key: 'North America', label: 'North America', flag: '🇺🇸' },
  { key: 'Europe', label: 'Europe', flag: '🇪🇺' },
  { key: 'Latin America', label: 'Latin America', flag: '🇧🇷' },
  { key: 'Asia', label: 'Asia', flag: '🇯🇵' },
  { key: 'Oceania', label: 'Oceania', flag: '🇦🇺' },
  { key: 'Spain', label: 'Spain', flag: '🇪🇸' },
];

export const CAM_GRADIENT_PALETTE = [
  'from-rose-500 via-pink-600 to-fuchsia-600',
  'from-orange-400 via-rose-500 to-pink-600',
  'from-purple-500 via-violet-600 to-indigo-600',
  'from-pink-400 via-rose-500 to-red-500',
  'from-amber-400 via-rose-500 to-purple-600',
  'from-fuchsia-500 via-purple-600 to-indigo-700',
  'from-red-400 via-rose-500 to-fuchsia-600',
  'from-violet-500 via-fuchsia-600 to-pink-600',
  'from-indigo-500 via-purple-600 to-fuchsia-600',
  'from-teal-400 via-cyan-500 to-blue-600',
  'from-lime-400 via-emerald-500 to-teal-600',
  'from-blue-500 via-indigo-600 to-purple-600',
];

let camSeed = 0;
function room(partial: Omit<CamRoom, 'id'>): CamRoom {
  camSeed += 1;
  return { ...partial, id: `cam-${camSeed}` };
}

const g = (i: number) => CAM_GRADIENT_PALETTE[i % CAM_GRADIENT_PALETTE.length];

export const CAM_ROOMS: CamRoom[] = [
  room({
    slug: 'whiteknightaimaster',
    name: 'White Knight AI',
    age: 22,
    category: 'female',
    region: 'North America',
    flag: '🇺🇸',
    viewers: 2730,
    hd: true,
    isNew: false,
    trending: true,
    vip: true,
    gradient: g(7),
    bio: 'An AI-themed model whose streams blend tech talk, cosplay and interactive fun.',
    tags: ['Female', 'English'],
    chaturbateUser: 'whiteknightaimaster',
  }),
  room({
    slug: 'valentina-rio',
    name: 'Valentina Rio',
    age: 24,
    category: 'female',
    region: 'Latin America',
    flag: '🇧🇷',
    viewers: 4820,
    hd: true,
    isNew: false,
    trending: true,
    vip: true,
    gradient: g(0),
    bio: 'Late-night Rio model who loves to tease and chat.',
    tags: ['Latin', 'English', 'Portuguese'],
  }),
  room({
    slug: 'mika-tokyo',
    name: 'Mika Tokyo',
    age: 22,
    category: 'female',
    region: 'Asia',
    flag: '🇯🇵',
    viewers: 3110,
    hd: true,
    isNew: true,
    trending: true,
    vip: true,
    gradient: g(1),
    bio: 'Shy by day, electric on cam. Speaks perfect English.',
    tags: ['Asian', 'English', 'Japanese'],
  }),
  room({
    slug: 'scarlett-fox',
    name: 'Scarlett Fox',
    age: 26,
    category: 'female',
    region: 'Europe',
    flag: '🇬🇧',
    viewers: 2750,
    hd: true,
    isNew: false,
    trending: true,
    vip: false,
    gradient: g(2),
    bio: 'Redhead with a wicked laugh and a chatty vibe.',
    tags: ['Redhead', 'English'],
  }),
  room({
    slug: 'marisol-vales',
    name: 'Marisol Vales',
    age: 28,
    category: 'female',
    region: 'Latin America',
    flag: '🇨🇴',
    viewers: 1980,
    hd: false,
    isNew: false,
    trending: true,
    vip: false,
    gradient: g(3),
    bio: 'Salsa nights, honest smiles, always in a good mood.',
    tags: ['Latin', 'Spanish', 'English'],
  }),
  room({
    slug: 'kitt-oakhart',
    name: 'Kitt Oakhart',
    age: 21,
    category: 'female',
    region: 'North America',
    flag: '🇺🇸',
    viewers: 1640,
    hd: true,
    isNew: false,
    trending: true,
    vip: false,
    gradient: g(4),
    bio: 'Gamer girl streaming cam and con talk between rounds.',
    tags: ['Gamer', 'English'],
  }),
  room({
    slug: 'dasha-volkov',
    name: 'Dasha Volkov',
    age: 25,
    category: 'female',
    region: 'Europe',
    flag: '🇺🇦',
    viewers: 1430,
    hd: true,
    isNew: true,
    trending: false,
    vip: false,
    gradient: g(5),
    bio: 'Cool blonde with a dry sense of humor.',
    tags: ['Blonde', 'English', 'Russian'],
  }),
  room({
    slug: 'rio-and-annika',
    name: 'Rio & Annika',
    age: 28,
    category: 'couples',
    region: 'Europe',
    flag: '🇩🇪',
    viewers: 2210,
    hd: true,
    isNew: false,
    trending: true,
    vip: true,
    gradient: g(6),
    bio: 'Real couple, real chemistry, zero acting.',
    tags: ['Couples', 'German', 'English'],
  }),
  room({
    slug: 'leo-vale',
    name: 'Leo Vale',
    age: 27,
    category: 'male',
    region: 'Europe',
    flag: '🇮🇹',
    viewers: 1240,
    hd: true,
    isNew: false,
    trending: true,
    vip: true,
    gradient: g(7),
    bio: 'Mediterranean charm, gym physique, big energy.',
    tags: ['Male', 'Italian', 'English'],
  }),
  room({
    slug: 'sana-noor',
    name: 'Sana Noor',
    age: 23,
    category: 'trans',
    region: 'Asia',
    flag: '🇹🇭',
    viewers: 1870,
    hd: true,
    isNew: true,
    trending: true,
    vip: true,
    gradient: g(8),
    bio: 'Bangkok star with an unforgettable smile.',
    tags: ['Trans', 'English', 'Thai'],
  }),
  room({
    slug: 'cassia-morel',
    name: 'Cassia Morel',
    age: 29,
    category: 'female',
    region: 'Europe',
    flag: '🇫🇷',
    viewers: 980,
    hd: true,
    isNew: false,
    trending: false,
    vip: true,
    gradient: g(9),
    bio: 'Parisian artist who paints between private shows.',
    tags: ['European', 'French', 'English'],
  }),
  room({
    slug: 'aiden-tanaka',
    name: 'Aiden Tanaka',
    age: 26,
    category: 'male',
    region: 'Asia',
    flag: '🇯🇵',
    viewers: 760,
    hd: true,
    isNew: false,
    trending: false,
    vip: false,
    gradient: g(10),
    bio: 'Quiet strength, honest talk, long private sessions.',
    tags: ['Male', 'Japanese', 'English'],
  }),
  room({
    slug: 'nox-london',
    name: 'Nox London',
    age: 24,
    category: 'trans',
    region: 'Europe',
    flag: '🇬🇧',
    viewers: 1120,
    hd: true,
    isNew: false,
    trending: true,
    vip: false,
    gradient: g(11),
    bio: 'East London energy with a rockstar wardrobe.',
    tags: ['Trans', 'English'],
  }),
  room({
    slug: 'yuki-and-marc',
    name: 'Yuki & Marc',
    age: 25,
    category: 'couples',
    region: 'Asia',
    flag: '🇯🇵',
    viewers: 690,
    hd: false,
    isNew: true,
    trending: false,
    vip: false,
    gradient: g(0),
    bio: 'First-time cam couple easing into the spotlight.',
    tags: ['Couples', 'English', 'Japanese'],
  }),
  room({
    slug: 'gia-colombo',
    name: 'Gia Colombo',
    age: 27,
    category: 'female',
    region: 'North America',
    flag: '🇺🇸',
    viewers: 1540,
    hd: true,
    isNew: false,
    trending: false,
    vip: true,
    gradient: g(1),
    bio: 'Glam model who runs high-energy tip battles.',
    tags: ['Fitness', 'English'],
  }),
  room({
    slug: 'enzo-mares',
    name: 'Enzo Mares',
    age: 24,
    category: 'male',
    region: 'Latin America',
    flag: '🇲🇽',
    viewers: 540,
    hd: false,
    isNew: true,
    trending: false,
    vip: false,
    gradient: g(2),
    bio: 'Laid-back surfer vibe and easy conversation.',
    tags: ['Male', 'Spanish', 'English'],
  }),
  room({
    slug: 'shae-rourke',
    name: 'Shae Rourke',
    age: 23,
    category: 'female',
    region: 'Oceania',
    flag: '🇦🇺',
    viewers: 1310,
    hd: true,
    isNew: false,
    trending: true,
    vip: false,
    gradient: g(3),
    bio: 'Sydney fun-girl streaming from her tiny flat.',
    tags: ['Beach', 'English'],
  }),
  room({
    slug: 'amara-okafor',
    name: 'Amara Okafor',
    age: 27,
    category: 'female',
    region: 'Europe',
    flag: '🇬🇧',
    viewers: 880,
    hd: true,
    isNew: false,
    trending: false,
    vip: true,
    gradient: g(4),
    bio: 'Voice of velvet, chatty in three languages.',
    tags: ['Conversation', 'English', 'French'],
  }),
  room({
    slug: 'zade-el-amin',
    name: 'Zade El Amin',
    age: 22,
    category: 'male',
    region: 'Asia',
    flag: '🇦🇪',
    viewers: 410,
    hd: false,
    isNew: true,
    trending: false,
    vip: false,
    gradient: g(5),
    bio: 'Smooth talker streaming pranks and private shows.',
    tags: ['Male', 'English', 'Arabic'],
  }),
  room({
    slug: 'carla-del-camino',
    name: 'Carla del Camino',
    age: 24,
    category: 'female',
    region: 'Spain',
    flag: '🇪🇸',
    viewers: 3115,
    hd: true,
    isNew: true,
    trending: true,
    vip: false,
    gradient: g(2),
    bio: 'Sevillana in a rooftop studio — flamenco, flirting and very candid chat.',
    tags: ['Female', 'Spanish', 'English'],
    chaturbateUser: 'carladelcamino',
  }),
  room({
    slug: 'marcos-iberia',
    name: 'Marcos Iberia',
    age: 26,
    category: 'male',
    region: 'Spain',
    flag: '🇪🇸',
    viewers: 2180,
    hd: true,
    isNew: false,
    trending: false,
    vip: true,
    gradient: g(5),
    bio: 'Gym-bred Madrid boy hosting tease shows from a beach-house terrace.',
    tags: ['Male', 'Spanish'],
    chaturbateUser: 'marcosiberia',
  }),
];

export const FEATURED_CAMS = CAM_ROOMS.filter((c) => c.trending).slice(0, 8);

export function getCamRoom(slug: string): CamRoom | undefined {
  return CAM_ROOMS.find((c) => c.slug === slug);
}

export function relatedCams(room: CamRoom, count = 12): CamRoom[] {
  const sameCategory = CAM_ROOMS.filter((c) => c.category === room.category && c.slug !== room.slug);
  const rest = CAM_ROOMS.filter((c) => c.category !== room.category && c.slug !== room.slug);
  return [...sameCategory, ...rest].slice(0, count);
}