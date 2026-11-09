export type EmotionKey =
  | 'neutral'
  | 'happy'
  | 'sarcastic'
  | 'smug'
  | 'angry'
  | 'sad'
  | 'surprised'
  | 'sleepy'
  | 'listening'
  | 'thinking'
  | 'jealous';

export type AppMode = 'asleep' | 'idle' | 'listening' | 'thinking' | 'speaking';

export interface EmotionData {
  n: string; // name
  p: [string, string, string]; // glow palette colors (hex)
  L: [number, number, number, number, number]; // Left eye [len, angle, bend, x, y]
  R: [number, number, number, number, number]; // Right eye [len, angle, bend, x, y]
  M: [number, number, number, number, number]; // Mouth [width, curve, skew, y, open]
  BL: [number, number, number, number]; // Left brow [len, angle, dy, alpha]
  BR: [number, number, number, number]; // Right brow [len, angle, dy, alpha]
  v: number[]; // haptic vibration pattern
  g?: [number, number]; // gaze bias [gx, gy]
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayContent?: string;
  mood?: EmotionKey;
  timestamp: number;
  groundingSources?: { title: string; url: string }[];
}

export interface TimerItem {
  id: string;
  label: string;
  end: number;
  durationSeconds: number;
}

export interface AndroidActionData {
  type: 'call' | 'sms' | 'whatsapp' | 'maps' | 'alarm' | 'youtube' | 'link';
  number?: string;
  text?: string;
  query?: string;
  hour?: number;
  minute?: number;
  label?: string;
  url?: string;
}

export interface PendingAction {
  title: string;
  url: string;
  type: string;
  details?: string;
}
