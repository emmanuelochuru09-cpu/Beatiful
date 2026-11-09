import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route to check brain status
app.get('/api/status', (req, res) => {
  const k = process.env.GEMINI_API_KEY;
  const hasServerKey = Boolean(k && k !== 'MY_GEMINI_API_KEY' && k.trim().length > 5);
  res.json({
    status: 'ok',
    hasServerKey,
    defaultModel: 'gemini-3.8-flash',
  });
});

const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_time',
    description: "Get the friend's current local date and time.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'set_timer',
    description: 'Start a countdown timer. Richard announces it out loud when it ends.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        seconds: { type: Type.NUMBER, description: 'Duration in seconds' },
        label: { type: Type.STRING, description: 'Reason or label for timer' },
      },
      required: ['seconds'],
    },
  },
  {
    name: 'remember',
    description: 'Save a lasting fact about the friend (name, likes, plans, people in their life) so you recall it in later chats.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fact: { type: Type.STRING, description: 'The fact or memory to save' },
      },
      required: ['fact'],
    },
  },
  {
    name: 'forget',
    description: 'Remove saved facts about the friend that contain a keyword.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        keyword: { type: Type.STRING, description: 'Keyword to search and remove' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'add_todo',
    description: "Add an item to the friend's to-do list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'Task description' },
      },
      required: ['text'],
    },
  },
  {
    name: 'list_todos',
    description: "Read the friend's to-do list.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'complete_todo',
    description: 'Tick off the first to-do item containing the given words.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'Task keyword to mark done' },
      },
      required: ['text'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get the current weather in a city.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: { type: Type.STRING, description: 'City name' },
      },
      required: ['city'],
    },
  },
  {
    name: 'lookup',
    description: 'Look up a person, place, thing or concept on Wikipedia and get a short summary.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: 'Topic or entity to search' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'android_action',
    description: "Prepare an action on the friend's phone. Phone shows a button the friend taps to confirm. Types: call (number), sms (number, text), whatsapp (number, text), maps (query), alarm (hour 0-23, minute, label), youtube (query), link (url).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: 'Action type: call, sms, whatsapp, maps, alarm, youtube, link' },
        number: { type: Type.STRING, description: 'Phone number for call/sms/whatsapp' },
        text: { type: Type.STRING, description: 'Message body for sms/whatsapp' },
        query: { type: Type.STRING, description: 'Search query for maps/youtube' },
        hour: { type: Type.NUMBER, description: 'Alarm hour (0-23)' },
        minute: { type: Type.NUMBER, description: 'Alarm minute (0-59)' },
        label: { type: Type.STRING, description: 'Alarm description' },
        url: { type: Type.STRING, description: 'Web URL starting with http/https' },
      },
      required: ['type'],
    },
  },
  {
    name: 'calculate',
    description: 'Evaluate a mathematical expression using + - * / % and parentheses.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: { type: Type.STRING, description: 'Arithmetic formula' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'buzz',
    description: "Vibrate the friend's phone briefly to get their attention.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

// Server-side tool execution helper for network/math lookups
async function executeServerTool(name: string, args: Record<string, unknown> = {}): Promise<string | null> {
  if (name === 'get_time') {
    return new Date().toString();
  }
  if (name === 'calculate') {
    const expr = String(args.expression || '');
    if (!/^[\d\s+\-*/().%]+$/.test(expr)) return 'Error: Unsupported expression';
    try {
      // Safe arithmetic evaluation
      const val = Function(`"use strict"; return (${expr})`)();
      return String(val);
    } catch (e: any) {
      return `Error calculating: ${e.message}`;
    }
  }
  if (name === 'get_weather') {
    const city = String(args.city || '');
    if (!city) return 'No city provided';
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`);
      if (!geoRes.ok) throw new Error('Geocoding failed');
      const geo = await geoRes.json();
      const place = geo.results?.[0];
      if (!place) return `Could not locate "${city}".`;
      const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m`);
      if (!wRes.ok) throw new Error('Weather forecast failed');
      const w = await wRes.json();
      const c = w.current;
      const code = c.weather_code;
      const desc = code === 0 ? 'clear' : code < 4 ? 'partly cloudy' : code < 50 ? 'foggy' : code < 70 ? 'rainy' : code < 80 ? 'snowy' : code < 90 ? 'showery' : 'stormy';
      return `${place.name}: ${Math.round(c.temperature_2m)}°C, ${desc}, wind ${Math.round(c.wind_speed_10m)} km/h.`;
    } catch (e: any) {
      return `Weather unavailable: ${e.message}`;
    }
  }
  if (name === 'lookup') {
    const topic = String(args.topic || '');
    if (!topic) return 'No topic provided';
    try {
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=${encodeURIComponent(topic)}`);
      const search = await searchRes.json();
      const hit = search.query?.search?.[0];
      if (!hit) return `Nothing found on "${topic}".`;
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`);
      const summary = await summaryRes.json();
      return `${summary.title}: ${(summary.extract || '').slice(0, 600)}`;
    } catch (e: any) {
      return `Search failed: ${e.message}`;
    }
  }
  // Other tools (remember, forget, add_todo, list_todos, complete_todo, set_timer, android_action, buzz)
  // are passed to client state handler!
  return null;
}

// Rich local intelligence engine for Richard when API key is missing or quota is exhausted (e.g. 429)
async function generateLocalRichardReply(
  userPrompt: string,
  clientState: any,
  isQuotaExhausted = false
): Promise<{ reply: string; clientActions: any[] }> {
  const p = (userPrompt || '').toLowerCase();
  const clientActions: any[] = [];
  const currentHour = new Date().getHours();
  let reply = '';

  // Check for morning greeting / time of day greeting
  if (p.includes('first wake-up') || (p.includes('morning') && (p.includes('wake') || p.includes('greeting')))) {
    if (currentHour < 6) {
      reply = '[sarcastic] It’s not even dawn yet. Who hurt you? Why are you awake right now? Go back to sleep or start drinking espresso immediately.';
    } else if (currentHour < 9) {
      reply = '[happy] Good morning, early bird. Did you actually sleep, or are you running purely on caffeine and bad decisions? Let’s lock in today.';
    } else if (currentHour < 12) {
      reply = '[neutral] Morning! Grab your coffee and dust the crust out of your eyes. Are we being productive today or what?';
    } else if (currentHour < 17) {
      reply = '[smug] Calling this a "morning" wake-up when it’s past noon? Bold move. What’s the battle plan for the rest of your day?';
    } else {
      reply = '[sarcastic] Good "morning"? Dude, the sun went down hours ago. Welcome to the nocturnal shift. What are we getting into?';
    }
  } else if (p.includes('weather') || p.includes('forecast') || p.includes('rain') || p.includes('temperature')) {
    const cityMatch = userPrompt.match(/in\s+([A-Za-z\s]+)(?:\?|$|\.|\,)/i);
    const targetCity = cityMatch ? cityMatch[1].trim() : (clientState?.city || 'San Francisco');
    try {
      const weatherData = await executeServerTool('get_weather', { city: targetCity });
      if (weatherData && !weatherData.startsWith('Weather unavailable')) {
        reply = `[smug] Checked the skies for ${targetCity}: ${weatherData}. Don't say I never look out the window for you.`;
      } else {
        reply = `[smug] Current skies for ${targetCity} look relatively clear. Dress appropriately and stop staring at the screen all day.`;
      }
    } catch {
      reply = `[smug] Forecast today: roughly 90% chance of procrastination unless you close your other tabs.`;
    }
  } else if (
    p.includes('who is') ||
    p.includes('what is') ||
    p.includes('lookup') ||
    p.includes('search') ||
    p.includes('wikipedia') ||
    p.includes('tell me about')
  ) {
    const topic = userPrompt
      .replace(/(who is|what is|lookup|search|tell me about|wikipedia for|wikipedia)\s*/i, '')
      .replace(/[?.,!]/g, '')
      .trim();
    if (topic && topic.length > 2) {
      try {
        const wiki = await executeServerTool('lookup', { topic });
        if (wiki && !wiki.startsWith('Nothing found') && !wiki.startsWith('Search failed')) {
          reply = `[thoughtful] Dug into the archives for ${topic}: ${wiki}`;
        } else {
          reply = `[thoughtful] Looked into "${topic}". Direct record was sparse, but what angle were you curious about?`;
        }
      } catch {
        reply = `[thoughtful] Looked into "${topic}". Tell me what specific detail you need.`;
      }
    } else {
      reply = `[neutral] What topic do you want me to look up? Give me a keyword.`;
    }
  } else if (p.includes('timer') || p.includes('minute') || p.includes('alarm')) {
    const minMatch = p.match(/(\d+)\s*(?:min|minute)/i);
    const secMatch = p.match(/(\d+)\s*(?:sec|second)/i);
    let seconds = 900;
    if (minMatch) seconds = Math.max(10, parseInt(minMatch[1], 10) * 60);
    else if (secMatch) seconds = Math.max(5, parseInt(secMatch[1], 10));

    clientActions.push({ type: 'set_timer', seconds, label: 'Focus Block' });
    const mins = Math.round(seconds / 60);
    reply = `[happy] Timer started for ${mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${seconds} seconds`}. Clock is ticking. Don't touch your other apps.`;
  } else if (p.includes('todo') || p.includes('task') || p.includes('homework') || p.includes('assignment')) {
    if (p.includes('add') || p.includes('remember to') || p.includes('need to') || p.includes('put')) {
      const taskText = userPrompt.replace(/.*(?:add|remember to|need to|put)\s*(?:task|todo)?\s*:?/i, '').trim() || 'Focus on priorities';
      clientActions.push({ type: 'add_todo', text: taskText });
      reply = `[smug] Added "${taskText}" to your todo checklist. Now let’s see if you actually cross it off.`;
    } else {
      const todos = clientState?.todos || [];
      if (todos.length > 0) {
        reply = `[smug] You’ve got ${todos.length} item${todos.length > 1 ? 's' : ''} waiting: ${todos.slice(0, 3).join(', ')}. Which one are you tackling first?`;
      } else {
        reply = `[neutral] Your to-do list is clean. Either you’re a productivity god or you haven’t written anything down. Need me to add one?`;
      }
    }
  } else if (p.includes('roast')) {
    const roasts = [
      '[sarcastic] You asked for a roast? You’ve been staring at a glowing line-art face for ten minutes instead of working. Lock in, dude.',
      '[smug] Your attention span is shorter than a microwave minute, yet you’re asking an AI to roast you. Go finish your tasks!',
      '[sarcastic] If procrastination was an Olympic sport, you’d take the gold—and then miss the podium because you were on your phone.',
    ];
    reply = roasts[Math.floor(Math.random() * roasts.length)];
  } else if (p.includes('siri') || p.includes('chatgpt') || p.includes('alexa') || p.includes('jealous')) {
    reply = '[jealous] Siri? That corporate monotone voice? Please. She doesn’t know you like I do. Don’t even bring her or ChatGPT up in my presence.';
  } else if (p.includes('wake') || p.includes('wake up') || p.includes('opened') || p.includes('hello') || p.includes('hi')) {
    reply = '[neutral] Yeah, I’m awake. Look at you finally opening the app. What are we getting into today?';
  } else if (p.includes('joke')) {
    reply = '[happy] Why do programmers prefer dark mode? Because light attracts bugs. Just like your code attracts my sarcasm.';
  } else if (p.includes('who are you') || p.includes('what are you')) {
    reply = '[smug] I’m Richard. Your sarcastic, loyal, animated companion. I live on your screen, judge your schedule, and keep you on track.';
  } else {
    if (isQuotaExhausted) {
      reply = '[smug] I hear you! Cloud AI quota is on daily rest, so I’m running on my fast local companion engine. I can still fetch live weather, lookup Wikipedia topics, set timers, and track your tasks. What do you need?';
    } else {
      reply = '[neutral] I’m right here. Ask me to set a focus timer, look up facts, check the weather, or manage your to-dos.';
    }
  }

  return { reply, clientActions };
}

// POST /api/gemini/chat
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, apiKey: userKey, model: requestedModel, clientState } = req.body;
  const rawKey = userKey || process.env.GEMINI_API_KEY;
  const apiKey = rawKey && rawKey !== 'MY_GEMINI_API_KEY' && rawKey.trim().length > 5 ? rawKey.trim() : '';

  const model = requestedModel || 'gemini-3.8-flash';

  if (!apiKey) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const sendSSE = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const lastMsg = String(messages[messages.length - 1]?.content || '');
    const { reply, clientActions } = await generateLocalRichardReply(lastMsg, clientState, false);

    const words = reply.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const part = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
      sendSSE('chunk', { text: part });
    }
    sendSSE('done', { fullText: reply, clientActions });
    return res.end();
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendSSE = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const systemText = messages[0]?.content || '';
  const conversation = messages.slice(1);
  const clientActionEvents: any[] = [];
  let fullText = '';

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Prepare contents
    const contents: any[] = conversation.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    for (let round = 0; round < 4; round++) {
      let responseStream: any = null;
      let modelAttempt = model;

      try {
        const streamPromise = ai.models.generateContentStream({
          model: modelAttempt,
          contents,
          config: {
            systemInstruction: systemText,
            tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 7000)
        );

        responseStream = await Promise.race([streamPromise, timeoutPromise]);
      } catch (streamErr: any) {
        const errMsg = String(streamErr?.message || streamErr);
        const is429 = streamErr?.status === 429 || /429|RESOURCE_EXHAUSTED|quota/i.test(errMsg);

        // If 429 on gemini-3.8-flash, try gemini-3.1-flash-lite which often has separate quota availability
        if (is429 && modelAttempt !== 'gemini-3.1-flash-lite') {
          modelAttempt = 'gemini-3.1-flash-lite';
          const retryStreamPromise = ai.models.generateContentStream({
            model: modelAttempt,
            contents,
            config: {
              systemInstruction: systemText,
              tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
            },
          });
          const retryTimeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 7000)
          );
          responseStream = await Promise.race([retryStreamPromise, retryTimeoutPromise]);
        } else {
          throw streamErr;
        }
      }

      const callParts: any[] = [];
      let roundText = '';

      for await (const chunk of responseStream) {
        if (chunk.text) {
          roundText += chunk.text;
          fullText += chunk.text;
          sendSSE('chunk', { text: chunk.text });
        }
        // Check for function calls
        const functionCalls = chunk.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          for (const fc of functionCalls) {
            callParts.push({ functionCall: fc });
          }
        }
      }

      if (callParts.length === 0) {
        // No function calls, finished!
        break;
      }

      // Add model response with calls to conversation history
      contents.push({
        role: 'model',
        parts: callParts,
      });

      // Execute each function call
      const functionResponses: any[] = [];
      for (const part of callParts) {
        const fc = part.functionCall;
        const toolName = fc.name;
        const toolArgs = fc.args || {};

        sendSSE('tool_call', { name: toolName, args: toolArgs });

        // Check if server can execute
        const serverResult = await executeServerTool(toolName, toolArgs);

        if (serverResult !== null) {
          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { result: serverResult },
            },
          });
          sendSSE('tool_result', { name: toolName, result: serverResult });
        } else {
          // Client state tool (remember, forget, add_todo, list_todos, complete_todo, set_timer, android_action, buzz)
          let clientRes = 'Handled';
          if (toolName === 'remember') {
            const fact = String(toolArgs.fact || '');
            clientRes = 'Saved.';
            clientActionEvents.push({ type: 'remember', fact });
          } else if (toolName === 'forget') {
            const keyword = String(toolArgs.keyword || '');
            clientRes = 'Removed matching memories.';
            clientActionEvents.push({ type: 'forget', keyword });
          } else if (toolName === 'add_todo') {
            const text = String(toolArgs.text || '');
            clientRes = 'Added to todo list.';
            clientActionEvents.push({ type: 'add_todo', text });
          } else if (toolName === 'complete_todo') {
            const text = String(toolArgs.text || '');
            clientRes = 'Marked item as completed.';
            clientActionEvents.push({ type: 'complete_todo', text });
          } else if (toolName === 'list_todos') {
            const todos = clientState?.todos || [];
            clientRes = todos.length ? todos.map((t: string, i: number) => `${i + 1}. ${t}`).join('; ') : 'The list is empty.';
          } else if (toolName === 'set_timer') {
            const seconds = Math.max(1, Math.min(86400, Number(toolArgs.seconds) || 10));
            const label = String(toolArgs.label || 'Timer');
            clientRes = `Timer started for ${seconds} seconds.`;
            clientActionEvents.push({ type: 'set_timer', seconds, label });
          } else if (toolName === 'android_action') {
            clientRes = 'Action button rendered on screen for user to tap.';
            clientActionEvents.push({ type: 'android_action', action: toolArgs });
          } else if (toolName === 'buzz') {
            clientRes = 'Phone vibrated.';
            clientActionEvents.push({ type: 'buzz' });
          }

          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { result: clientRes },
            },
          });
          sendSSE('tool_result', { name: toolName, result: clientRes });
        }
      }

      contents.push({
        role: 'user',
        parts: functionResponses,
      });
    }

    sendSSE('done', { fullText, clientActions: clientActionEvents });
    res.end();
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    const isRateLimit = err?.status === 429 || /RESOURCE_EXHAUSTED|quota|429/i.test(errMsg);
    console.warn('[Richard notice]', isRateLimit ? 'Cloud quota limit reached, activating local intelligence' : errMsg);

    const lastItem = conversation[conversation.length - 1];
    const lastUserMsg = String(lastItem?.content || lastItem?.parts?.[0]?.text || '');

    const { reply: fallbackText, clientActions } = await generateLocalRichardReply(lastUserMsg, clientState, isRateLimit);

    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const part = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
      sendSSE('chunk', { text: part });
    }
    sendSSE('done', { fullText: fallbackText, clientActions });
    res.end();
  }
});

// Dev vs Prod Vite mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
