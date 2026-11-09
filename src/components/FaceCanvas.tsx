import React, { useEffect, useRef } from 'react';
import { EmotionKey, AppMode } from '../types';
import { EMOTIONS, hexToRgb, flattenEmotion, getViseme } from '../constants/emotions';

interface FaceCanvasProps {
  emotion: EmotionKey;
  mode: AppMode;
  isSpeaking: boolean;
  speechText: string;
  speechCharIndex: number;
  speechRate?: number;
  ambientEnabled?: boolean;
  onFaceClick?: () => void;
}

export const FaceCanvas: React.FC<FaceCanvasProps> = ({
  emotion,
  mode,
  isSpeaking,
  speechText,
  speechCharIndex,
  speechRate = 1.0,
  ambientEnabled = true,
  onFaceClick,
}) => {
  const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gaze & pointer tracking
  const pointerRef = useRef({ px: 0, py: 0, gx: 0, gy: 0, gtx: 0, gty: 0 });

  // Spring physics state
  const physicsRef = useRef<{
    cur: number[];
    vel: number[];
    tgt: number[];
    pal: [number, number, number][];
    tpal: [number, number, number][];
    lastTime: number;
    nextBlink: number;
    blinkStart: number;
    mouthOpen: number;
    mouthWidth: number;
    energy: number;
  }>({
    cur: flattenEmotion(EMOTIONS.sleepy),
    vel: flattenEmotion(EMOTIONS.sleepy).map(() => 0),
    tgt: flattenEmotion(EMOTIONS.sleepy),
    pal: EMOTIONS.sleepy.p.map(hexToRgb),
    tpal: EMOTIONS.sleepy.p.map(hexToRgb),
    lastTime: performance.now(),
    nextBlink: performance.now() + 2500,
    blinkStart: -1,
    mouthOpen: 0,
    mouthWidth: 1,
    energy: 0,
  });

  // Track reduced motion preference
  const reduceMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // React to emotion prop changes
  useEffect(() => {
    const eData = EMOTIONS[emotion] || EMOTIONS.neutral;
    const p = physicsRef.current;
    p.tgt = flattenEmotion(eData);
    p.tpal = eData.p.map(hexToRgb);
    document.documentElement.style.setProperty('--acc', eData.p[0]);
  }, [emotion]);

  // Handle pointer tracking
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const px = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)));
      const py = Math.max(-1, Math.min(1, (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)));
      pointerRef.current.px = px;
      pointerRef.current.py = py;
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Main animation render loop
  useEffect(() => {
    const fc = faceCanvasRef.current;
    const bc = bgCanvasRef.current;
    if (!fc || !bc) return;

    const fx = fc.getContext('2d');
    const bx = bc.getContext('2d');
    if (!fx || !bx) return;

    let animId: number;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = fc.getBoundingClientRect();
      const W = Math.max(260, Math.round((rect.width || 420) * dpr));
      fc.width = fc.height = W;
      bc.width = Math.ceil(window.innerWidth / 4);
      bc.height = Math.ceil(window.innerHeight / 4);
    };

    resize();
    window.addEventListener('resize', resize);

    // Helpers for drawing
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
    const css = (c: number[], a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const ribbon = (pts: [number, number][], w: number, color: string) => {
      const n = pts.length;
      if (n < 2) return;
      const A: [number, number][] = [];
      const B: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(n - 1, i + 1)];
        let dx = b[0] - a[0];
        let dy = b[1] - a[1];
        const d = Math.hypot(dx, dy) || 1;
        dx /= d;
        dy /= d;
        const k = Math.pow(Math.sin((Math.PI * i) / (n - 1)), 0.5) * (w / 2) + 0.2;
        A.push([pts[i][0] - dy * k, pts[i][1] + dx * k]);
        B.push([pts[i][0] + dy * k, pts[i][1] - dx * k]);
      }
      fx.beginPath();
      fx.moveTo(A[0][0], A[0][1]);
      for (let i = 1; i < n; i++) fx.lineTo(A[i][0], A[i][1]);
      for (let i = n - 1; i >= 0; i--) fx.lineTo(B[i][0], B[i][1]);
      fx.closePath();
      fx.fillStyle = color;
      fx.fill();
    };

    const strand = (pts: [number, number][], w: number, a: number, core: number[], pal: [number, number, number][]) => {
      if (a < 0.02) return;
      ribbon(pts, w * 3.8, css(pal[1], 0.08 * a));
      ribbon(pts, w * 2.2, css(pal[2], 0.16 * a));
      ribbon(pts, w, css(core, a));
      ribbon(pts, w * 0.32, `rgba(255,255,255,${0.95 * a})`);
    };

    const curve = (len: number, ang: number, bend: number, cx: number, cy: number, n: number): [number, number][] => {
      const r = (ang * Math.PI) / 180;
      const c = Math.cos(r);
      const sn = Math.sin(r);
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const lx = (t - 0.5) * len;
        const ly = 2 * t * (1 - t) * bend;
        pts.push([cx + lx * c - ly * sn, cy + lx * sn + ly * c]);
      }
      return pts;
    };

    const eyePts = (p: number[], ox: number, oy: number, blink: number): [number, number][] => {
      let [len, a, b, x, y] = p;
      const s = Math.abs(Math.sin((a * Math.PI) / 180));
      len *= 1 - s * (1 - blink);
      b *= 1 - (1 - blink) * (1 - s);
      return curve(len, a, b, 300 + x + ox, 300 + y + oy, 10);
    };

    const mouthPts = (m: number[], ox: number, oy: number) => {
      const [w, c, s, y, open] = m;
      const top: [number, number][] = [];
      const bot: [number, number][] = [];
      const h = Math.max(0, open) / 2;
      for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        const x = 300 + ox + (t - 0.5) * w;
        const yb = 300 + y + oy + 2 * t * (1 - t) * c + s * (t - 0.5);
        const k = Math.sin(Math.PI * t) * h;
        top.push([x, yb - k]);
        bot.push([x, yb + k]);
      }
      return { top, bot };
    };

    const drawAmbient = (t: number, pal: [number, number, number][], en: number) => {
      const w = bc.width;
      const h = bc.height;
      bx.globalCompositeOperation = 'source-over';
      bx.fillStyle = '#04050A';
      bx.fillRect(0, 0, w, h);
      if (!ambientEnabled) return;

      bx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const a = t * (0.09 + i * 0.04) + i * 2.1;
        const x = w * (0.5 + 0.32 * Math.cos(a * 1.3 + i));
        const y = h * (0.5 + 0.28 * Math.sin(a + i * 1.7));
        const r = Math.max(w, h) * (0.55 + 0.12 * i + en * 0.18);
        const g = bx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, css(pal[i], 0.38 + en * 0.28));
        g.addColorStop(1, css(pal[i], 0));
        bx.fillStyle = g;
        bx.fillRect(0, 0, w, h);
      }
      bx.globalCompositeOperation = 'source-over';
    };

    const render = (now: number) => {
      const p = physicsRef.current;
      const ptr = pointerRef.current;
      const dt = Math.min(0.033, (now - p.lastTime) / 1000);
      p.lastTime = now;
      const t = now / 1000;

      // Spring physics
      const K = reduceMotion ? 1200 : 560;
      const D = reduceMotion ? 70 : 31;
      for (let i = 0; i < p.cur.length; i++) {
        p.vel[i] += ((p.tgt[i] - p.cur[i]) * K - p.vel[i] * D) * dt;
        p.cur[i] += p.vel[i] * dt;
      }

      // Color lerp
      const kc = 1 - Math.exp(-dt * 5);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          p.pal[i][j] += (p.tpal[i][j] - p.pal[i][j]) * kc;
        }
      }

      // Gaze bias
      const eData = EMOTIONS[emotion] || EMOTIONS.neutral;
      const g = eData.g || [0, 0];
      ptr.gtx = g[0] + ptr.px * 18 + (reduceMotion ? 0 : Math.sin(t * 0.7) * 3);
      ptr.gty = g[1] + ptr.py * 14 + (reduceMotion ? 0 : Math.cos(t * 0.9) * 2);
      ptr.gx += (ptr.gtx - ptr.gx) * (1 - Math.exp(-dt * 14));
      ptr.gy += (ptr.gty - ptr.gy) * (1 - Math.exp(-dt * 14));

      // Natural blink
      let blink = 1;
      if (now > p.nextBlink && p.blinkStart < 0) {
        p.blinkStart = now;
      }
      if (p.blinkStart >= 0) {
        const q = (now - p.blinkStart) / 180;
        if (q >= 1) {
          p.blinkStart = -1;
          p.nextBlink = now + 2600 + Math.random() * 3200;
        } else {
          blink = 1 - 0.92 * Math.sin(Math.PI * q);
        }
      }

      const face = p.cur.slice();
      if (emotion === 'listening') {
        const w = reduceMotion ? 0 : 14 * Math.sin(t * 7) + 8 * Math.sin(t * 11.3);
        face[0] += w;
        face[5] += w * 0.8;
      }

      // Lip-sync calculation
      let tv = 0;
      let tw = 1;
      if (isSpeaking && speechText) {
        const char = speechText[speechCharIndex] || speechText[Math.floor(speechCharIndex)];
        [tv, tw] = getViseme(char);
      }

      p.mouthOpen += (tv - p.mouthOpen) * (1 - Math.exp(-dt * 24));
      p.mouthWidth += (tw - p.mouthWidth) * (1 - Math.exp(-dt * 18));

      if (p.mouthOpen > 0.01) {
        face[14] = Math.max(face[14], 0) + p.mouthOpen * 36;
        face[13] += p.mouthOpen * 7;
        face[10] *= p.mouthWidth;
      }

      p.energy +=
        ((emotion === 'listening' ? 0.35 + 0.15 * Math.sin(t * 7) : 0) +
          p.mouthOpen * 0.85 -
          p.energy) *
        (1 - Math.exp(-dt * 10));

      // 1. Draw ambient background
      drawAmbient(t, p.pal, p.energy);

      // 2. Draw Richard's face
      const W = fc.width;
      fx.setTransform(1, 0, 0, 1, 0, 0);
      fx.clearRect(0, 0, fc.width, fc.height);

      // Subtle float oscillation
      const floatY = (reduceMotion ? 0 : Math.sin(t * 1.3) * 6) * (W / 600);
      fx.setTransform(W / 600, 0, 0, W / 600, 0, floatY);

      // Glowing voice aura / soundwaves around Richard when talking or listening
      if (p.energy > 0.05 || mode === 'listening') {
        const auraAlpha = Math.min(0.25, p.energy * 0.35);
        const radius = 230 + p.energy * 25 + Math.sin(t * 4) * 8;
        const auraGrad = fx.createRadialGradient(300, 300, 140, 300, 300, radius);
        auraGrad.addColorStop(0, css(p.pal[0], auraAlpha));
        auraGrad.addColorStop(0.7, css(p.pal[1], auraAlpha * 0.4));
        auraGrad.addColorStop(1, css(p.pal[2], 0));
        fx.fillStyle = auraGrad;
        fx.beginPath();
        fx.arc(300, 300, radius, 0, Math.PI * 2);
        fx.fill();

        // Delicate concentric sound ring
        fx.strokeStyle = css(p.pal[0], auraAlpha * 0.5);
        fx.lineWidth = 1.5;
        fx.beginPath();
        fx.arc(300, 300, radius * 0.92, 0, Math.PI * 2);
        fx.stroke();
      }

      const core = mix(p.pal[0], [255, 255, 255], 0.6);
      const sc = 1 + p.energy * 0.18;

      // Eyes
      strand(eyePts(face.slice(0, 5), ptr.gx, ptr.gy, blink), 15 * sc, 1, core, p.pal);
      strand(eyePts(face.slice(5, 10), ptr.gx, ptr.gy, blink), 15 * sc, 1, core, p.pal);

      // Eyebrows
      const bl = face.slice(15, 19);
      const br = face.slice(19, 23);
      strand(
        curve(bl[0], bl[1], -9, 300 + face[3] + ptr.gx * 0.6, 300 + face[4] + bl[2] + ptr.gy * 0.6, 10),
        7,
        clamp01(bl[3]),
        core,
        p.pal
      );
      strand(
        curve(br[0], br[1], -9, 300 + face[8] + ptr.gx * 0.6, 300 + face[9] + br[2] + ptr.gy * 0.6, 10),
        7,
        clamp01(br[3]),
        core,
        p.pal
      );

      // Mouth
      const m = mouthPts(face.slice(10, 15), ptr.gx * 0.35, ptr.gy * 0.35);
      if (face[14] > 3) {
        fx.beginPath();
        fx.moveTo(m.top[0][0], m.top[0][1]);
        for (const q of m.top) fx.lineTo(q[0], q[1]);
        for (let i = m.bot.length - 1; i >= 0; i--) fx.lineTo(m.bot[i][0], m.bot[i][1]);
        fx.closePath();
        fx.fillStyle = 'rgba(2,3,8,0.7)';
        fx.fill();
        fx.fillStyle = css(p.pal[0], 0.12 + p.energy * 0.12);
        fx.fill();
      }
      strand(m.top, 11 * sc, 1, core, p.pal);
      if (face[14] > 1.5) strand(m.bot, 11 * sc, 1, core, p.pal);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [ambientEnabled, emotion, isSpeaking, mode, reduceMotion, speechCharIndex, speechRate, speechText]);

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
      {/* Background ambient glowing canvas */}
      <canvas
        ref={bgCanvasRef}
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radial vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none -z-5"
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, transparent 42%, rgba(4, 5, 10, 0.75) 85%, #04050A 100%)',
        }}
      />

      {/* Interactive Face Canvas */}
      <canvas
        ref={faceCanvasRef}
        onClick={onFaceClick}
        role="button"
        tabIndex={0}
        aria-label="Richard's face. Tap to speak or wake up."
        className="w-[min(88vw,52vh)] h-[min(88vw,52vh)] aspect-square cursor-pointer active:scale-95 transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-full"
      />
    </div>
  );
};
