import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { EmotionKey, AppMode, TimerItem } from '../types';
import { EMOTIONS } from '../constants/emotions';

interface TopNavProps {
  emotion: EmotionKey;
  mode: AppMode;
  timers: TimerItem[];
  voiceOn: boolean;
  ambientOn: boolean;
  onToggleVoice: () => void;
  onToggleAmbient: () => void;
  onOpenDrawer: (drawer: 'memory' | 'todos' | 'history' | 'settings') => void;
  onWakeOrSleep: () => void;
  awake: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  emotion,
  mode,
  timers,
  voiceOn,
  ambientOn,
  onToggleVoice,
  onToggleAmbient,
  onOpenDrawer,
  onWakeOrSleep,
  awake,
}) => {
  // Nearest timer
  const activeTimer = timers.length > 0 ? timers[0] : null;
  const timerSecondsLeft = activeTimer
    ? Math.max(0, Math.round((activeTimer.end - Date.now()) / 1000))
    : 0;
  const timerString = activeTimer
    ? `${activeTimer.label}: ${Math.floor(timerSecondsLeft / 60)}:${String(
        timerSecondsLeft % 60
      ).padStart(2, '0')}`
    : null;

  const currentEmotion = EMOTIONS[emotion] || EMOTIONS.neutral;

  return (
    <header className="relative z-20 w-full px-5 py-4 border-b border-white/5 backdrop-blur-md bg-[#04050A]/60 flex items-center justify-between gap-6">
      {/* Zone 1: Brand Wordmark & Subtle Mood Text */}
      <div className="flex items-baseline gap-3 shrink-0">
        <button
          onClick={onWakeOrSleep}
          className="text-xl font-bold font-display tracking-tight text-white hover:text-blue-300 transition-colors whitespace-nowrap"
        >
          Richard
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span
            className="w-2 h-2 rounded-full inline-block transition-colors duration-500"
            style={{ backgroundColor: currentEmotion.p[0] }}
          />
          <span className="capitalize">{currentEmotion.n}</span>
          {timerString && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-amber-300 tabular-nums animate-pulse">
                {timerString}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation Links / Drawer Switches */}
      <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-400">
        <button
          onClick={() => onOpenDrawer('memory')}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          Memories
        </button>
        <button
          onClick={() => onOpenDrawer('todos')}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          Tasks
        </button>
        <button
          onClick={() => onOpenDrawer('history')}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          History
        </button>
        <button
          onClick={() => onOpenDrawer('settings')}
          className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: Primary Action / Quick Sound Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleVoice}
          title={voiceOn ? 'Mute Speech' : 'Unmute Speech'}
          className={`p-2 rounded-lg text-xs transition-colors ${
            voiceOn ? 'text-blue-400 hover:bg-white/5' : 'text-slate-500 hover:text-slate-300'
          }`}
          aria-label={voiceOn ? 'Voice output enabled' : 'Voice output muted'}
        >
          {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleAmbient}
          title={ambientOn ? 'Disable Ambient Glow' : 'Enable Ambient Glow'}
          className={`p-2 rounded-lg text-xs transition-colors ${
            ambientOn ? 'text-purple-400 hover:bg-white/5' : 'text-slate-500 hover:text-slate-300'
          }`}
          aria-label={ambientOn ? 'Ambient glow enabled' : 'Ambient glow disabled'}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={onWakeOrSleep}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 whitespace-nowrap shrink-0 ${
            awake
              ? 'border-blue-500/40 text-blue-200 bg-blue-500/10 hover:bg-blue-500/20'
              : 'border-slate-700 text-slate-300 bg-slate-900/60 hover:bg-slate-800'
          }`}
        >
          {awake ? 'Awake' : 'Wake Richard'}
        </button>
      </div>
    </header>
  );
};
