import React from 'react';
import { EmotionKey, AppMode } from '../types';
import { EMOTIONS } from '../constants/emotions';

interface CaptionDisplayProps {
  caption: string;
  userSpeech: string;
  mode: AppMode;
  emotion: EmotionKey;
  awake: boolean;
  onWake: () => void;
}

export const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
  caption,
  userSpeech,
  mode,
  emotion,
  awake,
  onWake,
}) => {
  const currentEmotion = EMOTIONS[emotion] || EMOTIONS.neutral;

  return (
    <div className="w-full max-w-2xl px-6 flex flex-col items-center text-center gap-2 select-text">
      {/* Emotion indicator pill / label */}
      {awake && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400/90 mb-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: currentEmotion.p[0] }}
          />
          <span className="capitalize">{currentEmotion.n}</span>
          {mode === 'speaking' && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-blue-400 font-mono text-[11px] animate-pulse">speaking</span>
            </>
          )}
          {mode === 'listening' && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-teal-400 font-mono text-[11px] animate-pulse">listening</span>
            </>
          )}
          {mode === 'thinking' && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-purple-400 font-mono text-[11px] animate-pulse">thinking...</span>
            </>
          )}
        </div>
      )}

      {/* Main Richard spoken caption */}
      <div className="min-h-[3.6rem] flex items-center justify-center">
        {!awake ? (
          <button
            onClick={onWake}
            className="text-lg sm:text-xl font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Tap Richard or speak to wake him up.
          </button>
        ) : mode === 'thinking' ? (
          <p className="text-lg sm:text-xl font-medium text-slate-400 animate-pulse">
            Formulating something sarcastic...
          </p>
        ) : (
          <p
            className="text-lg sm:text-2xl font-medium tracking-tight text-white leading-relaxed max-w-xl transition-all duration-200"
            style={{ textWrap: 'balance' }}
          >
            {caption || "I'm listening. Don't waste my time."}
          </p>
        )}
      </div>

      {/* What the user said or interim transcription */}
      {userSpeech && (
        <p className="text-xs sm:text-sm text-slate-400/80 max-w-md truncate">
          <span className="text-slate-500 font-mono mr-1.5">You:</span>
          {userSpeech}
        </p>
      )}
    </div>
  );
};
