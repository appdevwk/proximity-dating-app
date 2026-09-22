import type { AiGirlfriend } from './ai-girlfriends-data';

const MATCHES: { hint: string; re: RegExp }[] = [
  { hint: 'sex', re: /\b(sex|fuck|fuck me|make love|bed now|naughty|dirty)\b/i },
  { hint: 'sexting', re: /\b(sext|dirty talk|roleplay|rp|tease)\b/i },
  { hint: 'photo', re: /\b(photo|picture|image|pic|snap|selfie|nudes?)\b/i },
  { hint: 'voice', re: /\b(voice|call|audio|mic|sing)\b/i },
  { hint: 'name', re: /\b(your name|who are you|name is|what.*name)\b/i },
  { hint: 'love', re: /\b(love|date|marry|mine|forever|kiss|miss you)\b/i },
  { hint: 'how', re: /\b(how are you|how.*day|you ok|whats up|wyd)\b/i },
  { hint: 'hi', re: /\b(hi|hello|hey|yo|sup|good (morning|evening|night))\b/i },
];

const RANDOM_LINES = [
  'You always know exactly what to say. Keep going.',
  'I like that about you. Most people never say the real thing out loud.',
  'Say that again… but slower, I want to remember it.',
  'You are making this way more interesting than my whole week.',
  'Okay, now I am officially curious about you.',
  'Careful, keep talking like that and I will want you around every night.',
  'You have my full attention now. Do not waste it.',
  'I was about to log off… and then you sent that. I am staying.',
];

export interface AiReplyResult {
  text: string;
  photoEvent?: boolean;
  voiceEvent?: boolean;
}

export function getAiReply(gf: AiGirlfriend, message: string, adult: boolean): AiReplyResult {
  const lower = message.toLowerCase();

  const pools = [
    ...(adult ? gf.adultLines : []),
    ...gf.lines,
  ];

  for (const line of pools) {
    const matcher = MATCHES.find((m) => m.hint === line.hint);
    if (matcher && matcher.re.test(lower)) {
      const result: AiReplyResult = { text: line.reply };
      if (line.hint === 'photo') result.photoEvent = adult;
      if (line.hint === 'voice') result.voiceEvent = true;
      return result;
    }
  }

  const probe = gf.lines.find((l) => l.hint === 'hi');
  const random = RANDOM_LINES[Math.floor(Math.random() * RANDOM_LINES.length)];
  const reply = probe ? `${probe.reply} ${random}` : random;
  return { text: reply };
}

export function openingMessage(gf: AiGirlfriend): string {
  return gf.opening;
}