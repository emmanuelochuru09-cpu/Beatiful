import React, { useRef } from 'react';
import { Mic, MicOff, Send, Radio } from 'lucide-react';
import { AppMode } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants/emotions';

interface ControlsDockProps {
  mode: AppMode;
  inputText: string;
  onInputChange: (val: string) => void;
  onSend: (text: string) => void;
  onMicClick: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  handsFree: boolean;
  onToggleHandsFree: () => void;
  awake: boolean;
}

export const ControlsDock: React.FC<ControlsDockProps> = ({
  mode,
  inputText,
  onInputChange,
  onSend,
  onMicClick,
  language,
  onLanguageChange,
  handsFree,
  onToggleHandsFree,
  awake,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSend(inputText);
    }
  };

  const getMicLabel = () => {
    if (!awake) return 'Wake Up';
    switch (mode) {
      case 'listening':
        return 'Listening';
      case 'thinking':
        return 'Thinking';
      case 'speaking':
        return 'Interrupt';
      default:
        return 'Talk';
    }
  };

  const isMicActive = mode === 'listening';

  return (
    <div className="w-full max-w-2xl px-4 pb-4 pt-1 flex flex-col gap-2">
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
        {/* Language dropdown */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Voice language"
          className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium py-2.5 px-3 rounded-xl border border-white/5 outline-none cursor-pointer max-w-[110px] sm:max-w-[140px] truncate"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
              {lang.label}
            </option>
          ))}
        </select>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={awake ? 'Type something to Richard...' : 'Tap Richard or type to wake him...'}
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-500 px-3 py-2 outline-none"
        />

        {/* Send Button */}
        {inputText.trim().length > 0 && (
          <button
            onClick={() => onSend(inputText)}
            title="Send Message"
            className="p-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold transition-all duration-150 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        )}

        {/* Hands-Free / Continuous Live switch */}
        <button
          onClick={onToggleHandsFree}
          title={handsFree ? 'Hands-free mode active (always listening)' : 'Push-to-talk mode'}
          className={`px-2.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            handsFree
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${handsFree ? 'animate-pulse text-emerald-400' : ''}`} />
          <span className="hidden sm:inline">Live</span>
        </button>

        {/* Main Mic / Action Button */}
        <button
          onClick={onMicClick}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shrink-0 ${
            isMicActive
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 ring-2 ring-teal-400/50'
              : mode === 'speaking'
              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
              : !awake
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-white text-slate-950 hover:bg-slate-200 shadow-md'
          }`}
        >
          {isMicActive ? (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              <Mic className="w-3.5 h-3.5" />
            </div>
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
          <span>{getMicLabel()}</span>
        </button>
      </div>
    </div>
  );
};
