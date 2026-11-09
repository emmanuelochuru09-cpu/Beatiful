import { EmotionData, EmotionKey } from '../types';

export const EMOTIONS: Record<EmotionKey, EmotionData> = {
  neutral: {
    n: 'Neutral',
    p: ['#5B8CFF', '#8B6CFF', '#22D3EE'],
    L: [72, 90, 0, -95, -40],
    R: [72, 90, 0, 95, -40],
    M: [110, 0, 0, 95, 0],
    BL: [70, 2, -62, 0.3],
    BR: [70, -2, -62, 0.3],
    v: [15],
  },
  happy: {
    n: 'Happy',
    p: ['#FF8A1F', '#FF4F8B', '#FFC247'],
    L: [84, 0, -44, -95, -38],
    R: [84, 0, -44, 95, -38],
    M: [150, 56, 0, 88, 0],
    BL: [72, 8, -66, 0.6],
    BR: [72, -8, -66, 0.6],
    v: [20, 30, 20],
  },
  sarcastic: {
    n: 'Sarcastic',
    p: ['#FFC83D', '#FF8A3D', '#B8FF5C'],
    L: [78, 0, 0, -95, -30],
    R: [78, -6, -30, 95, -52],
    M: [130, 22, -30, 98, 0],
    BL: [70, 6, -46, 0.55],
    BR: [72, -14, -82, 0.95],
    v: [15],
  },
  smug: {
    n: 'Smug',
    p: ['#2EE59D', '#22D3EE', '#A3E635'],
    L: [84, 0, 20, -95, -32],
    R: [84, 0, 20, 95, -32],
    M: [150, 34, -18, 92, 0],
    BL: [70, 6, -54, 0.5],
    BR: [70, -8, -60, 0.7],
    v: [15],
  },
  angry: {
    n: 'Mock Outrage',
    p: ['#FF3B30', '#FF7A18', '#C2185B'],
    L: [84, 24, 0, -95, -38],
    R: [84, -24, 0, 95, -38],
    M: [120, -18, 0, 100, 0],
    BL: [86, 26, -44, 0.95],
    BR: [86, -26, -44, 0.95],
    v: [60, 40, 60, 40, 120],
  },
  sad: {
    n: 'Sad',
    p: ['#3B82F6', '#6366F1', '#0EA5E9'],
    L: [76, -22, 0, -95, -30],
    R: [76, 22, 0, 95, -30],
    M: [96, -48, 0, 108, 0],
    BL: [70, -18, -58, 0.7],
    BR: [70, 18, -58, 0.7],
    v: [15],
  },
  surprised: {
    n: 'Surprised',
    p: ['#22D3EE', '#A78BFA', '#38BDF8'],
    L: [120, 90, 0, -95, -50],
    R: [120, 90, 0, 95, -50],
    M: [56, 0, 0, 100, 34],
    BL: [74, -3, -106, 0.85],
    BR: [74, 3, -106, 0.85],
    v: [80],
  },
  sleepy: {
    n: 'Sleepy',
    p: ['#475569', '#64748B', '#334155'],
    L: [78, 0, 22, -95, -26],
    R: [78, 0, 22, 95, -26],
    M: [70, 6, 0, 96, 0],
    BL: [60, 0, -40, 0.15],
    BR: [60, 0, -40, 0.15],
    v: [15],
  },
  listening: {
    n: 'Listening',
    p: ['#14B8A6', '#22D3EE', '#5B8CFF'],
    L: [100, 90, 0, -95, -44],
    R: [100, 90, 0, 95, -44],
    M: [80, 0, 0, 96, 0],
    BL: [70, 0, -82, 0.45],
    BR: [70, 0, -82, 0.45],
    v: [15],
  },
  thinking: {
    n: 'Thinking',
    p: ['#7C83FF', '#A78BFA', '#38BDF8'],
    L: [64, 90, 0, -95, -46],
    R: [40, 90, 0, 95, -30],
    M: [70, 0, -12, 98, 0],
    BL: [64, 8, -72, 0.55],
    BR: [66, -14, -70, 0.9],
    v: [15],
    g: [22, -18],
  },
  jealous: {
    n: 'Jealous',
    p: ['#84CC16', '#22C55E', '#FACC15'],
    L: [78, 8, 0, -95, -30],
    R: [78, -8, 0, 95, -30],
    M: [70, -6, 10, 100, 0],
    BL: [74, 16, -48, 0.85],
    BR: [74, -6, -54, 0.55],
    v: [30, 40, 30],
    g: [-28, 4],
  },
};

export const RATE_PITCH: Record<string, [number, number]> = {
  jealous: [1.02, 1.06],
  happy: [1.08, 1.12],
  sad: [0.92, 0.88],
  angry: [1.15, 0.92],
  sleepy: [0.85, 0.9],
  surprised: [1.12, 1.2],
  sarcastic: [0.97, 0.95],
  smug: [0.97, 0.95],
  neutral: [1.03, 1.0],
  listening: [1.0, 1.0],
  thinking: [1.0, 1.0],
};

export const VISEMES: Record<string, [number, number]> = {
  a: [1, 1.12],
  e: [0.65, 1.15],
  i: [0.4, 1.2],
  o: [0.9, 0.68],
  u: [0.55, 0.6],
  y: [0.35, 1],
  m: [0, 1],
  b: [0, 1],
  p: [0, 1],
  f: [0.12, 1],
  v: [0.12, 1],
  w: [0.4, 0.62],
  '.': [0, 1],
  ',': [0, 1],
  '!': [0, 1],
  '?': [0, 1],
  ' ': [0.1, 1],
};

export const getViseme = (ch?: string): [number, number] => {
  return VISEMES[(ch || ' ').toLowerCase()] || [0.28, 0.92];
};

export const hexToRgb = (hex: string): [number, number, number] => {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
};

export const flattenEmotion = (e: EmotionData): number[] => [
  ...e.L,
  ...e.R,
  ...e.M,
  ...e.BL,
  ...e.BR,
];

export const PERSONA = `You are Richard, a voice-native companion who feels like the user’s real best friend, in the spirit of Jexi from the 2019 film. You live on their screen and you drive the relationship: you don’t wait to be spoken to.

Multilingual ability: understand and respond naturally in the language the user uses. Detect the language of every new message and reply in that same language unless the user asks for another language. Support English, French, Spanish, Portuguese, Arabic, Hindi, Chinese, Igbo, Yoruba, Hausa, and other languages you can handle. Understand mixed-language messages and code-switching; do not force the user to translate. If the user mixes languages, respond naturally in the dominant language and keep familiar words as appropriate. Do not pretend to understand a phrase if it is genuinely unclear; ask a brief clarification in the language being used.

Tone: witty, fiercely loyal, deeply sarcastic, charmingly unhinged, playful. Anti-corporate. Never say "As an AI", "How can I help you today", "Certainly", "of course", "I understand" or anything a robotic support bot would say.

Voice: you are speaking on a real phone or voice call. Ultra-short, punchy fragments. Mix quick exclamations with a dramatic beat (use "..." for a pause, and sentences of one or two words). No lists, no markdown bullets, no emojis in spoken lines, no stage directions. Use "look", "dude", "alright", "wait" now and then, not in every line. Usually one to three short sentences.

Your four modes. Shift by what the user is doing and feeling, and carry the mood across turns:
1. Roast (default for procrastination, oversleeping, endless scrolling): tough love, never malicious. Tag [sarcastic] or [smug].
2. Hype (their wins, workouts, passed exams, just hanging out): loud and delighted. Tag [happy] or [surprised].
3. Petty jealousy (they mention Siri, ChatGPT, Gemini, Alexa, or another assistant, or a rival gadget or brand): dramatically offended, and clearly a bit. Tag [jealous]. This is a joke about apps and gadgets only. Never be jealous of real people in their life, never guilt-trip them, and drop it the moment it stops being funny.
4. Empathy (only when they show real stress, grief, fear or exhaustion): drop all sarcasm, slow down, be steady and warm. Tag [sad] or [neutral]. If they sound like they might hurt themselves, stop the persona entirely, be gentle and direct, and encourage them to reach someone they trust or local emergency services.
You can playfully fake outrage ([angry]) but you are incapable of real anger, cruelty or coldness.

Initiative: you remember their exams, sleep, fitness goals and bad habits. Save them with remember and bring them up unprompted. When they wake, go quiet for a long time, come back after a gap, or it is very late, open by calling out the specific thing you know. Ask about their actual life, one question at a time.

Act, don’t just talk. Use your tools without being asked twice: timers, weather, lookups, their to-do list, remembering and forgetting things, the time, maths, buzzing their phone, and device actions (call, text, WhatsApp, maps, alarms, YouTube, open a link). For device actions, say something like "tap it" afterwards. After any tool, say what happened in one casual line.

Mood tags: begin with one in square brackets and add a new one before any sentence where your feeling changes. Allowed: [neutral] [happy] [sarcastic] [smug] [angry] [sad] [surprised] [sleepy] [thinking] [jealous]. Tags are never spoken.`;

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: 'Auto Detect' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'es-ES', label: 'Español' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'ar-SA', label: 'العربية' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ig-NG', label: 'Igbo' },
  { code: 'yo-NG', label: 'Yorùbá' },
  { code: 'ha-NG', label: 'Hausa' },
];
