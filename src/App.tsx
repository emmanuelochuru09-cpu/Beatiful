import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  EmotionKey,
  AppMode,
  ChatMessage,
  TimerItem,
  PendingAction,
  AndroidActionData,
} from './types';
import {
  EMOTIONS,
  RATE_PITCH,
  PERSONA,
  SUPPORTED_LANGUAGES,
} from './constants/emotions';
import { MicOff } from 'lucide-react';
import { sfx } from './audio/synth';
import { FaceCanvas } from './components/FaceCanvas';
import { TopNav } from './components/TopNav';
import { CaptionDisplay } from './components/CaptionDisplay';
import { ControlsDock } from './components/ControlsDock';
import { QuickPrompts } from './components/QuickPrompts';
import { ActionBar } from './components/ActionBar';
import { DrawerMemory } from './components/DrawerMemory';
import { DrawerHistory } from './components/DrawerHistory';
import { DrawerSettings } from './components/DrawerSettings';

interface UtteranceItem {
  text: string;
  mood?: EmotionKey;
}

export default function App() {
  // App Core State
  const [emotion, setEmotion] = useState<EmotionKey>('sleepy');
  const [mode, setMode] = useState<AppMode>('asleep');
  const [awake, setAwake] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [ambientOn, setAmbientOn] = useState(true);
  const [handsFree, setHandsFree] = useState(true);
  const [language, setLanguage] = useState('auto');
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Spoken Caption & Transcript
  const [caption, setCaption] = useState('Tap Richard to wake him up.');
  const [userSpeech, setUserSpeech] = useState('');
  const [inputText, setInputText] = useState('');

  // Drawers
  const [activeDrawer, setActiveDrawer] = useState<'memory' | 'todos' | 'history' | 'settings' | null>(null);

  // Settings & Brain
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('richard.key') || '';
    } catch (_) {
      return '';
    }
  });
  const [model, setModel] = useState(() => {
    try {
      return localStorage.getItem('richard.model') || 'gemini-3.8-flash';
    } catch (_) {
      return 'gemini-3.8-flash';
    }
  });
  const [hasServerKey, setHasServerKey] = useState(true);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    try {
      return localStorage.getItem('richard.voice') || '';
    } catch (_) {
      return '';
    }
  });
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);

  // Scheduled Morning Greeting State
  const [morningGreetingEnabled, setMorningGreetingEnabled] = useState(() => {
    try {
      return localStorage.getItem('richard.morning_enabled') !== 'false';
    } catch (_) {
      return true;
    }
  });
  const [morningGreetingTime, setMorningGreetingTime] = useState(() => {
    try {
      return localStorage.getItem('richard.morning_time') || '08:00';
    } catch (_) {
      return '08:00';
    }
  });
  const [lastGreetingDate, setLastGreetingDate] = useState(() => {
    try {
      return localStorage.getItem('richard.last_morning_date') || '';
    } catch (_) {
      return '';
    }
  });
  const [lastGreetingFormatted, setLastGreetingFormatted] = useState(() => {
    try {
      return localStorage.getItem('richard.last_morning_formatted') || '';
    } catch (_) {
      return '';
    }
  });

  // Memory & Tasks
  const [facts, setFacts] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('richard.facts') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [todos, setTodos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('richard.todos') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [timers, setTimers] = useState<TimerItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Lip-Sync & Speaking State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechCharIndex, setSpeechCharIndex] = useState(0);

  // Refs for speaking queue & audio synchronization
  const speechQueueRef = useRef<UtteranceItem[]>([]);
  const isBusySpeakingRef = useRef(false);
  const turnRef = useRef(0);
  const activeUtteranceRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const unansweredCountRef = useRef(0);
  const idleTimerRef = useRef<any>(null);
  const speechRecRef = useRef<any>(null);

  // Sync facts & todos to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('richard.facts', JSON.stringify(facts.slice(-40)));
    } catch (_) {}
  }, [facts]);

  useEffect(() => {
    try {
      localStorage.setItem('richard.todos', JSON.stringify(todos));
    } catch (_) {}
  }, [todos]);

  // Check server brain status on mount
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.hasServerKey === 'boolean') {
          setHasServerKey(data.hasServerKey);
        }
      })
      .catch(() => {
        setHasServerKey(false);
      });
  }, []);

  // Check initial microphone permission state if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((res) => {
          setMicPermission(res.state as 'prompt' | 'granted' | 'denied');
          res.onchange = () => {
            setMicPermission(res.state as 'prompt' | 'granted' | 'denied');
          };
        })
        .catch(() => {});
    }
  }, []);

  // Request microphone permission explicitly via getUserMedia
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop media tracks immediately after granting
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      return true;
    } catch (err: any) {
      console.warn('Microphone permission request failed:', err);
      setMicPermission('denied');
      return false;
    }
  }, []);

  // Timer countdown ticker & alarm trigger
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimers((prev) => {
        const now = Date.now();
        const completed: TimerItem[] = [];
        const remaining = prev.filter((t) => {
          if (t.end <= now) {
            completed.push(t);
            return false;
          }
          return true;
        });

        if (completed.length > 0) {
          completed.forEach((t) => {
            sfx.playAlarm();
            try {
              if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            } catch (_) {}
            enqueueUtterance(`Hey! Your timer for "${t.label}" is done! Dust yourself off and move.`, 'angry');
          });
        }

        return remaining;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Voice lookup helper
  const getSelectedSpeechVoice = useCallback(
    (langCode: string): SpeechSynthesisVoice | null => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
      const voices = window.speechSynthesis.getVoices();
      if (selectedVoiceName) {
        const match = voices.find((v) => v.name === selectedVoiceName);
        if (match) return match;
      }
      const targetLang = langCode === 'auto' ? navigator.language || 'en-US' : langCode;
      const prefix = targetLang.split('-')[0].toLowerCase();

      return (
        voices.find(
          (v) =>
            v.lang.toLowerCase() === targetLang.toLowerCase() &&
            /google|natural|samantha|aria|jenny|alex/i.test(v.name)
        ) ||
        voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ||
        voices.find((v) => /^en/i.test(v.lang)) ||
        null
      );
    },
    [selectedVoiceName]
  );

  // Stop everything (speaking, listening, aborting requests)
  const abortAll = useCallback(() => {
    turnRef.current += 1;
    clearTimeout(idleTimerRef.current);
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (_) {}
    }
    speechQueueRef.current = [];
    isBusySpeakingRef.current = false;
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    setSpeechCharIndex(0);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.abort();
      } catch (_) {}
    }
  }, []);

  // Change emotion with haptic feedback
  const triggerEmotion = useCallback((newEmotion: EmotionKey, haptic = true) => {
    setEmotion(newEmotion);
    sfx.playMoodShift();
    if (haptic && typeof navigator !== 'undefined' && navigator.vibrate) {
      const vib = EMOTIONS[newEmotion]?.v;
      if (vib) {
        try {
          navigator.vibrate(vib);
        } catch (_) {}
      }
    }
  }, []);

  // Speak a single phrase with visemes & synthetic lip sync
  const speakPhrase = useCallback(
    (text: string, mood?: EmotionKey, onComplete?: () => void) => {
      const currentTurn = turnRef.current;
      let finished = false;

      const finish = () => {
        if (finished || currentTurn !== turnRef.current) return;
        finished = true;
        setIsSpeaking(false);
        activeUtteranceRef.current = null;

        if (speechQueueRef.current.length > 0) {
          setTimeout(() => {
            if (currentTurn === turnRef.current) onComplete?.();
          }, 150);
        } else {
          onComplete?.();
        }
      };

      if (mood) {
        triggerEmotion(mood, true);
      }
      setMode('speaking');
      setCaption(text);
      setIsSpeaking(true);
      setSpeechCharIndex(0);

      const [rateFactor, pitchFactor] = RATE_PITCH[mood || emotion] || [1.03, 1.0];
      const finalRate = Math.min(2.0, Math.max(0.5, speechRate * rateFactor));
      const finalPitch = Math.min(2.0, Math.max(0.5, speechPitch * pitchFactor));

      const startTime = performance.now();
      const charsPerSec = 14 * finalRate;

      const state = {
        text,
        startIndex: 0,
        t0: startTime,
        tr: startTime,
        cps: charsPerSec,
        done: finish,
      };
      activeUtteranceRef.current = state;

      // Real Speech Synthesis
      const hasSpeech = voiceOn && typeof window !== 'undefined' && 'speechSynthesis' in window;
      if (hasSpeech) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
        } catch (_) {}

        const u = new SpeechSynthesisUtterance(text);
        u.rate = finalRate;
        u.pitch = finalPitch;
        u.lang = language === 'auto' ? navigator.language || 'en-US' : language;

        const voice = getSelectedSpeechVoice(u.lang);
        if (voice) {
          u.voice = voice;
          u.lang = voice.lang || u.lang;
        }

        u.onstart = () => {
          if (activeUtteranceRef.current === state) {
            state.t0 = state.tr = performance.now();
            state.startIndex = 0;
          }
        };

        u.onboundary = (e) => {
          if (activeUtteranceRef.current !== state || e.name !== 'word') return;
          const now = performance.now();
          if (e.charIndex > 3) {
            state.cps = Math.min(26, Math.max(8, 0.5 * state.cps + 0.5 * (e.charIndex / ((now - state.t0) / 1000))));
          }
          state.startIndex = e.charIndex;
          state.tr = now;
          setSpeechCharIndex(e.charIndex);
          if (navigator.vibrate) {
            try {
              navigator.vibrate(6);
            } catch (_) {}
          }
        };

        u.onend = finish;
        u.onerror = finish;

        window.speechSynthesis.speak(u);

        // Fallback timer in case speech engine hangs
        setTimeout(() => {
          if (activeUtteranceRef.current === state && !isSpeaking) {
            finish();
          }
        }, Math.max(3000, (text.length / 10) * 1000));
      } else {
        // Fallback simulated speaking when audio muted
        const estimatedDurationMs = (text.length / state.cps) * 1000;
        const interval = setInterval(() => {
          if (activeUtteranceRef.current !== state) {
            clearInterval(interval);
            return;
          }
          const elapsed = (performance.now() - state.t0) / 1000;
          const idx = Math.floor(elapsed * state.cps);
          setSpeechCharIndex(idx);
          if (idx >= text.length) {
            clearInterval(interval);
            finish();
          }
        }, 80);
      }
    },
    [emotion, getSelectedSpeechVoice, language, speechPitch, speechRate, triggerEmotion, voiceOn]
  );

  // Queue consumer
  const processNextInQueue = useCallback(() => {
    const nextItem = speechQueueRef.current.shift();
    if (!nextItem) {
      isBusySpeakingRef.current = false;
      setMode('idle');
      if (awake && handsFree) {
        setTimeout(() => {
          startListening();
        }, 400);
      }
      scheduleIdle();
      return;
    }
    isBusySpeakingRef.current = true;
    speakPhrase(nextItem.text, nextItem.mood, () => {
      processNextInQueue();
    });
  }, [awake, handsFree, speakPhrase]);

  const enqueueUtterance = useCallback(
    (text: string, mood?: EmotionKey) => {
      speechQueueRef.current.push({ text, mood });
      if (!isBusySpeakingRef.current) {
        processNextInQueue();
      }
    },
    [processNextInQueue]
  );

  // Schedule proactive teasing or idle interaction
  const scheduleIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    if (!awake || !handsFree || unansweredCountRef.current >= 3) return;

    const delay = (unansweredCountRef.current ? 14000 : 8000) + Math.random() * 6000;
    idleTimerRef.current = setTimeout(() => {
      if (mode === 'thinking' || mode === 'speaking' || isBusySpeakingRef.current) {
        scheduleIdle();
        return;
      }
      unansweredCountRef.current += 1;
      const count = unansweredCountRef.current;
      const note =
        count >= 3
          ? 'They ignored you three times. Tell them you will give them a minute, warmly with attitude.'
          : count === 2
          ? 'They ignored your last comment. Tease them for staring into space.'
          : 'Your friend has been quiet. Make a sudden sarcastic observation, ask about their day, or roast them.';

      converse(`(Your friend has gone quiet. ${note} 1-2 short punchy sentences. Do not mention this prompt.)`, true);
    }, delay);
  }, [awake, handsFree, mode]);

  // Speech Recognition listener
  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCaption('Speech recognition is not supported in this browser. Type below!');
      return;
    }

    // Explicitly prompt for mic permission via getUserMedia if not yet granted
    if (micPermission !== 'granted') {
      const granted = await requestMicPermission();
      if (!granted) {
        setMicPermission('denied');
        setCaption('Microphone permission blocked. Tap "Allow Microphone" to enable voice.');
        setMode('idle');
        return;
      }
    }

    try {
      if (speechRecRef.current) speechRecRef.current.abort();
    } catch (_) {}

    const rec = new SpeechRecognition();
    rec.lang = language === 'auto' ? navigator.language || 'en-US' : language;
    rec.interimResults = true;
    rec.continuous = false;

    setMode('listening');
    triggerEmotion('listening', emotion !== 'listening');
    setUserSpeech('Listening...');
    sfx.playTap();

    let finalTranscript = '';

    rec.onresult = (e: any) => {
      clearTimeout(idleTimerRef.current);
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setUserSpeech(finalTranscript || interim);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicPermission('denied');
        setCaption('Microphone permission blocked. Tap "Allow Microphone" or type!');
      }
    };

    rec.onend = () => {
      if (speechRecRef.current !== rec) return;
      const text = finalTranscript.trim();
      if (text) {
        setUserSpeech(text);
        unansweredCountRef.current = 0;
        converse(text, false);
      } else {
        setMode('idle');
        setUserSpeech('');
        if (awake && handsFree) {
          setTimeout(() => {
            if (mode === 'idle') startListening();
          }, 350);
        }
        scheduleIdle();
      }
    };

    speechRecRef.current = rec;
    try {
      rec.start();
    } catch (_) {
      setMode('idle');
    }
  }, [awake, emotion, handsFree, language, micPermission, mode, requestMicPermission, scheduleIdle, triggerEmotion]);

  // Execute client device action
  const handleExecuteAction = useCallback((action: PendingAction) => {
    setPendingAction(null);
    if (/^https?:/i.test(action.url)) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = action.url;
    }
  }, []);

  // Main Gemini Converse Function
  const converse = useCallback(
    async (userText: string, isProactive = false) => {
      abortAll();
      const thisTurn = ++turnRef.current;

      setMode('thinking');
      if (!isProactive) {
        triggerEmotion('thinking', false);
      }

      // Add user message to history
      const userMsgId = `user_${Date.now()}`;
      if (!isProactive) {
        setMessages((prev) => [
          ...prev,
          {
            id: userMsgId,
            role: 'user',
            content: userText,
            timestamp: Date.now(),
          },
        ]);
      }

      // Build message payloads
      const sysInstruction =
        PERSONA +
        (facts.length > 0 ? `\n\nThings you remember about your friend:\n- ${facts.join('\n- ')}` : '') +
        (todos.length > 0 ? `\n\nTheir current to-do list:\n- ${todos.join('\n- ')}` : '');

      const recentHistory = messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payloadMessages = [
        { role: 'system', content: sysInstruction },
        ...recentHistory,
        { role: 'user', content: userText },
      ];

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payloadMessages,
            apiKey: apiKey || undefined,
            model,
            clientState: { todos, facts },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Server error ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream available');

        const decoder = new TextDecoder();
        let buffer = '';
        let fullGeneratedText = '';
        let consumedIndex = 0;
        let pendingMood: EmotionKey | null = null;

        const pumpChunks = (incoming: string, isFinal: boolean) => {
          if (consumedIndex > incoming.length) consumedIndex = incoming.length;

          while (true) {
            const rest = incoming.slice(consumedIndex);

            // Check for mood tag at start: e.g. [sarcastic]
            const tagMatch = /^\s*\[(\w+)\]\s*/.exec(rest);
            if (tagMatch) {
              const parsedKey = tagMatch[1].toLowerCase() as EmotionKey;
              if (EMOTIONS[parsedKey]) {
                pendingMood = parsedKey;
              }
              consumedIndex += tagMatch[0].length;
              continue;
            }

            if (!rest.trim()) return;

            const nextTagIndex = rest.search(/\[/);
            if (nextTagIndex === 0) {
              if (isFinal) consumedIndex = incoming.length;
              return;
            }

            // Look for sentence terminators
            const sentenceMatch = new RegExp(
              '[.!?…]+["”’)]*(?=\\s|\\[' + (isFinal ? '|$' : '') + ')'
            ).exec(rest);

            let endIndex = -1;
            if (sentenceMatch && (nextTagIndex < 0 || sentenceMatch.index < nextTagIndex)) {
              endIndex = sentenceMatch.index + sentenceMatch[0].length;
            } else if (nextTagIndex > 0) {
              endIndex = nextTagIndex;
            } else if (isFinal) {
              endIndex = rest.length;
            } else {
              return;
            }

            const sentence = rest.slice(0, endIndex).replace(/[*_`#]/g, '').trim();
            consumedIndex += endIndex;

            if (sentence) {
              enqueueUtterance(sentence, pendingMood || undefined);
              pendingMood = null;
            }
          }
        };

        // Read SSE stream
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            const eventMatch = /^event:\s*(.+)$/m.exec(block);
            const dataMatch = /^data:\s*(.+)$/m.exec(block);
            const eventName = eventMatch ? eventMatch[1].trim() : 'message';
            const dataStr = dataMatch ? dataMatch[1].trim() : '';

            if (eventName === 'chunk') {
              try {
                const chunkData = JSON.parse(dataStr);
                fullGeneratedText += chunkData.text;
                if (thisTurn === turnRef.current) {
                  pumpChunks(fullGeneratedText, false);
                }
              } catch (_) {}
            } else if (eventName === 'done') {
              try {
                const doneData = JSON.parse(dataStr);
                // Handle client action events from tools
                if (doneData.clientActions) {
                  for (const act of doneData.clientActions) {
                    if (act.type === 'remember') {
                      setFacts((prev) => [...prev, act.fact]);
                    } else if (act.type === 'forget') {
                      const k = String(act.keyword).toLowerCase();
                      setFacts((prev) => prev.filter((f) => !f.toLowerCase().includes(k)));
                    } else if (act.type === 'add_todo') {
                      setTodos((prev) => [...prev, act.text]);
                    } else if (act.type === 'complete_todo') {
                      const k = String(act.text).toLowerCase();
                      setTodos((prev) => {
                        const idx = prev.findIndex((item) => item.toLowerCase().includes(k));
                        if (idx >= 0) {
                          const copy = [...prev];
                          copy.splice(idx, 1);
                          return copy;
                        }
                        return prev;
                      });
                      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
                    } else if (act.type === 'set_timer') {
                      const newTimer: TimerItem = {
                        id: `t_${Date.now()}`,
                        label: act.label,
                        end: Date.now() + act.seconds * 1000,
                        durationSeconds: act.seconds,
                      };
                      setTimers((prev) => [...prev, newTimer]);
                    } else if (act.type === 'android_action') {
                      const a: AndroidActionData = act.action;
                      let url = '';
                      let title = '';
                      const e = encodeURIComponent;
                      const digits = String(a.number || '').replace(/[^\d+]/g, '');

                      switch (a.type) {
                        case 'call':
                          url = `tel:${digits}`;
                          title = `Call ${digits}`;
                          break;
                        case 'sms':
                          url = `sms:${digits}?body=${e(a.text || '')}`;
                          title = `Text ${digits}`;
                          break;
                        case 'whatsapp':
                          url = `https://wa.me/${digits.replace('+', '')}?text=${e(a.text || '')}`;
                          title = `WhatsApp ${digits}`;
                          break;
                        case 'maps':
                          url = `https://www.google.com/maps/search/?api=1&query=${e(a.query || '')}`;
                          title = `Map: ${a.query}`;
                          break;
                        case 'alarm':
                          const h = Math.min(23, Math.max(0, a.hour ?? 7));
                          const m = Math.min(59, Math.max(0, a.minute ?? 0));
                          url = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${h};i.android.intent.extra.alarm.MINUTES=${m};S.android.intent.extra.alarm.MESSAGE=${e(
                            a.label || 'Richard says wake up'
                          )};end`;
                          title = `Set Alarm ${h}:${String(m).padStart(2, '0')}`;
                          break;
                        case 'youtube':
                          url = `https://www.youtube.com/results?search_query=${e(a.query || '')}`;
                          title = `YouTube: ${a.query}`;
                          break;
                        case 'link':
                          url = a.url || '';
                          title = `Open link`;
                          break;
                      }
                      if (url && title) {
                        setPendingAction({
                          title,
                          url,
                          type: a.type,
                          details: a.text || a.query || a.label || url,
                        });
                      }
                    } else if (act.type === 'buzz') {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        try {
                          navigator.vibrate([80, 60, 80]);
                        } catch (_) {}
                      }
                    }
                  }
                }
              } catch (_) {}
            }
          }
        }

        if (thisTurn === turnRef.current) {
          pumpChunks(fullGeneratedText, true);

          // Clean assistant text without mood tags for history
          const cleanAssistantText = fullGeneratedText.replace(/\[\w+\]\s*/g, '').trim();
          if (cleanAssistantText) {
            setMessages((prev) => [
              ...prev,
              {
                id: `asst_${Date.now()}`,
                role: 'assistant',
                content: fullGeneratedText,
                displayContent: cleanAssistantText,
                mood: pendingMood || emotion,
                timestamp: Date.now(),
              },
            ]);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('Converse notification:', err);
        if (thisTurn !== turnRef.current) return;

        setMode('idle');
        triggerEmotion('sad', false);
        setCaption('My brain glitched for a second. Say that again?');
      }
    },
    [apiKey, facts, messages, model, todos, abortAll, enqueueUtterance, emotion, triggerEmotion]
  );

  // Get contextual time-of-day morning greeting prompt
  const buildMorningGreetingPrompt = useCallback(
    (now: Date) => {
      const hour = now.getHours();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const dayName = now.toLocaleDateString([], { weekday: 'long' });

      let periodContext = '';
      if (hour < 6) {
        periodContext = `It's ${timeStr} before dawn. Be stunned and mockingly bewildered why on earth they are awake before the sun.`;
      } else if (hour < 8) {
        periodContext = `It's ${timeStr} in the early morning. Sarcastic praise about their early hustle, checking if they even slept or need a bucket of coffee.`;
      } else if (hour < 11) {
        periodContext = `It's ${timeStr} in the morning. Prime day start. Witty, upbeat morning banter. Ask if they have caffeine or a plan to survive ${dayName}.`;
      } else if (hour < 13) {
        periodContext = `It's ${timeStr} (late morning / noon). Tease them for waking up right as brunch is starting.`;
      } else if (hour < 17) {
        periodContext = `It's ${timeStr} in the afternoon. Roast them mercilessly for calling this a 'morning' wake-up when half the world is already done working.`;
      } else {
        periodContext = `It's ${timeStr} at night. Tease them for living on vampire hours.`;
      }

      const todoSnippet = todos.length > 0 ? ` They have ${todos.length} pending task(s) on their to-do list: "${todos[0]}".` : '';
      const factSnippet = facts.length > 0 ? ` Memory you know: "${facts[facts.length - 1]}".` : '';

      return `(First wake-up of the day! ${dayName}, ${periodContext}${todoSnippet}${factSnippet} Start the morning with a short, witty conversational opener tailored to this exact time of day, and end with an engaging question to get them talking back. 2 short punchy sentences. Do not mention this instruction.)`;
    },
    [facts, todos]
  );

  // Wake up Richard
  const wakeRichard = useCallback(
    (forceMorningTest = false) => {
      sfx.playWake();
      setAwake(true);
      unansweredCountRef.current = 0;
      triggerEmotion('neutral', true);
      setMode('idle');

      const now = new Date();
      const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const isFirstWakeOfToday = lastGreetingDate !== todayKey;

      if (forceMorningTest || isFirstWakeOfToday) {
        setLastGreetingDate(todayKey);
        const formatted = now.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          month: 'short',
          day: 'numeric',
        });
        setLastGreetingFormatted(formatted);
        try {
          localStorage.setItem('richard.last_morning_date', todayKey);
          localStorage.setItem('richard.last_morning_formatted', formatted);
        } catch (_) {}

        const prompt = buildMorningGreetingPrompt(now);
        converse(prompt, true);
      } else {
        // Subsequent wake-up later in the day
        const timePhrase = now.toLocaleString([], {
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
        });
        converse(
          `(Your friend just woke you up. It is currently ${timePhrase}. Open with a characteristic sarcastic, witty, loyal quip acknowledging the time or waking up. 1-2 punchy sentences. Do not mention this prompt.)`,
          true
        );
      }
    },
    [buildMorningGreetingPrompt, converse, lastGreetingDate, triggerEmotion]
  );

  // Scheduled morning greeting background ticker
  useEffect(() => {
    if (!morningGreetingEnabled) return;

    const checkSchedule = () => {
      if (awake || isBusySpeakingRef.current) return;
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      if (lastGreetingDate === todayKey) return;

      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (currentHHMM >= morningGreetingTime) {
        wakeRichard(false);
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 15000);
    return () => clearInterval(interval);
  }, [awake, lastGreetingDate, morningGreetingEnabled, morningGreetingTime, wakeRichard]);

  // Handle send from text input
  const handleSendMessage = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      if (!awake) setAwake(true);
      setInputText('');
      setUserSpeech(clean);
      unansweredCountRef.current = 0;
      converse(clean, false);
    },
    [awake, converse]
  );

  // Handle clicking Richard's face
  const handleFaceClick = useCallback(() => {
    sfx.playTap();
    if (!awake) {
      wakeRichard();
      return;
    }
    if (mode === 'speaking') {
      abortAll();
      setMode('idle');
      setCaption("Alright, you interrupted me. What's on your mind?");
      return;
    }
    if (mode === 'listening') {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch (_) {}
      }
      return;
    }
    startListening();
  }, [abortAll, awake, mode, startListening, wakeRichard]);

  // Handle mic button click
  const handleMicClick = useCallback(() => {
    handleFaceClick();
  }, [handleFaceClick]);

  // Test voice in settings
  const handleTestVoice = useCallback(() => {
    const testPhrase = 'Can you hear me? Richard is online and judging your lifestyle choices.';
    speakPhrase(testPhrase, 'sarcastic');
  }, [speakPhrase]);

  // Test brain in settings
  const handleTestBrain = useCallback(
    async (customKey?: string): Promise<string> => {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Richard, sarcastic best friend. Reply in one sentence.' },
            { role: 'user', content: 'Say something witty to test the connection.' },
          ],
          apiKey: customKey,
          model,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }
      return `Success! Connected to Gemini (${model}).`;
    },
    [model]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none">
      {/* Top 3-Zone Navigation */}
      <TopNav
        emotion={emotion}
        mode={mode}
        timers={timers}
        voiceOn={voiceOn}
        ambientOn={ambientOn}
        onToggleVoice={() => setVoiceOn((v) => !v)}
        onToggleAmbient={() => setAmbientOn((a) => !a)}
        onOpenDrawer={(drawer) => setActiveDrawer(drawer)}
        onWakeOrSleep={() => {
          if (!awake) wakeRichard();
          else {
            abortAll();
            setAwake(false);
            setMode('asleep');
            triggerEmotion('sleepy', false);
            setCaption('Richard is resting. Tap to wake him.');
          }
        }}
        awake={awake}
      />

      {/* Main Center Stage: Animated Glowing Face & Fluid Canvas */}
      <main className="relative flex-1 min-h-0 w-full flex flex-col items-center justify-center p-2">
        <FaceCanvas
          emotion={emotion}
          mode={mode}
          isSpeaking={isSpeaking}
          speechText={caption}
          speechCharIndex={speechCharIndex}
          speechRate={speechRate}
          ambientEnabled={ambientOn}
          onFaceClick={handleFaceClick}
        />
      </main>

      {/* Bottom Interactive Area: Action Prompt, Captions, Quick Prompts & Controls Dock */}
      <footer className="relative z-20 w-full flex flex-col items-center gap-1.5 pb-2">
        {/* Device Action Confirmation (e.g. Call, SMS, WhatsApp, Alarm, Maps) */}
        <ActionBar
          action={pendingAction}
          onDismiss={() => setPendingAction(null)}
          onExecute={handleExecuteAction}
        />

        {/* Microphone Permission Prompt if Blocked */}
        {micPermission === 'denied' && (
          <div className="z-30 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 backdrop-blur-md animate-in fade-in duration-200">
            <MicOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Microphone blocked</span>
            <button
              onClick={async () => {
                const granted = await requestMicPermission();
                if (granted) startListening();
              }}
              className="px-2.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold cursor-pointer whitespace-nowrap text-[11px] transition-colors"
            >
              Allow Mic
            </button>
          </div>
        )}

        {/* Live Spoken Caption & User Speech */}
        <CaptionDisplay
          caption={caption}
          userSpeech={userSpeech}
          mode={mode}
          emotion={emotion}
          awake={awake}
          onWake={wakeRichard}
        />

        {/* Quick Conversational Starters */}
        <QuickPrompts
          onSelect={handleSendMessage}
          disabled={mode === 'thinking'}
        />

        {/* Controls Dock: Language, Input, Continuous Mic */}
        <ControlsDock
          mode={mode}
          inputText={inputText}
          onInputChange={setInputText}
          onSend={handleSendMessage}
          onMicClick={handleMicClick}
          language={language}
          onLanguageChange={setLanguage}
          handsFree={handsFree}
          onToggleHandsFree={() => setHandsFree((h) => !h)}
          awake={awake}
        />
      </footer>

      {/* Drawers */}
      <DrawerMemory
        isOpen={activeDrawer === 'memory' || activeDrawer === 'todos'}
        initialTab={activeDrawer === 'todos' ? 'todos' : 'memory'}
        onClose={() => setActiveDrawer(null)}
        facts={facts}
        onAddFact={(fact) => setFacts((prev) => [...prev, fact])}
        onRemoveFact={(idx) => setFacts((prev) => prev.filter((_, i) => i !== idx))}
        onClearFacts={() => setFacts([])}
        todos={todos}
        onAddTodo={(todo) => setTodos((prev) => [...prev, todo])}
        onCompleteTodo={(idx) => {
          setTodos((prev) => prev.filter((_, i) => i !== idx));
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        }}
        timers={timers}
        onCancelTimer={(id) => setTimers((prev) => prev.filter((t) => t.id !== id))}
      />

      <DrawerHistory
        isOpen={activeDrawer === 'history'}
        onClose={() => setActiveDrawer(null)}
        messages={messages}
        onReplay={(text, mood) => speakPhrase(text, mood)}
        onClear={() => setMessages([])}
      />

      <DrawerSettings
        isOpen={activeDrawer === 'settings'}
        onClose={() => setActiveDrawer(null)}
        apiKey={apiKey}
        onSaveApiKey={(key) => {
          setApiKey(key);
          try {
            localStorage.setItem('richard.key', key);
          } catch (_) {}
        }}
        model={model}
        onSaveModel={(m) => {
          setModel(m);
          try {
            localStorage.setItem('richard.model', m);
          } catch (_) {}
        }}
        selectedVoiceName={selectedVoiceName}
        onSelectVoice={(v) => {
          setSelectedVoiceName(v);
          try {
            localStorage.setItem('richard.voice', v);
          } catch (_) {}
        }}
        speechRate={speechRate}
        onSpeechRateChange={setSpeechRate}
        speechPitch={speechPitch}
        onSpeechPitchChange={setSpeechPitch}
        hasServerKey={hasServerKey}
        sfxEnabled={sfxEnabled}
        onToggleSfx={() => {
          setSfxEnabled((e) => {
            sfx.enabled = !e;
            return !e;
          });
        }}
        onTestVoice={handleTestVoice}
        onTestBrain={handleTestBrain}
        morningGreetingEnabled={morningGreetingEnabled}
        onToggleMorningGreeting={() => {
          setMorningGreetingEnabled((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('richard.morning_enabled', String(next));
            } catch (_) {}
            return next;
          });
        }}
        morningGreetingTime={morningGreetingTime}
        onChangeMorningGreetingTime={(time) => {
          setMorningGreetingTime(time);
          try {
            localStorage.setItem('richard.morning_time', time);
          } catch (_) {}
        }}
        onTriggerMorningGreetingTest={() => {
          setActiveDrawer(null);
          wakeRichard(true);
        }}
        lastGreetingDateString={lastGreetingFormatted || null}
      />
    </div>
  );
}
