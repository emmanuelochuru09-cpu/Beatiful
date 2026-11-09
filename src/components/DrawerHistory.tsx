import React from 'react';
import { X, Volume2, MessageSquareText, Trash2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { EMOTIONS } from '../constants/emotions';

interface DrawerHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onReplay: (text: string, mood?: any) => void;
  onClear: () => void;
}

export const DrawerHistory: React.FC<DrawerHistoryProps> = ({
  isOpen,
  onClose,
  messages,
  onReplay,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0A0D16] border-l border-white/10 p-6 flex flex-col gap-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Conversation Transcript</h3>
            <span className="text-xs text-slate-500">({messages.length})</span>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={onClear}
                title="Clear transcript"
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <MessageSquareText className="w-8 h-8 mb-2 opacity-30" />
              <span>No conversation history yet. Start talking to Richard!</span>
            </div>
          ) : (
            messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              const emotionData = m.mood ? EMOTIONS[m.mood] : null;

              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex flex-col gap-1.5 ${
                    isAssistant
                      ? 'bg-white/[0.04] border-white/10 text-slate-200 mr-4'
                      : 'bg-blue-600/10 border-blue-500/20 text-blue-100 ml-4'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[11px] text-white">
                        {isAssistant ? 'Richard' : 'You'}
                      </span>
                      {emotionData && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${emotionData.p[0]}22`,
                            color: emotionData.p[0],
                          }}
                        >
                          {emotionData.n}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isAssistant && (
                        <button
                          onClick={() => onReplay(m.displayContent || m.content, m.mood)}
                          title="Replay this sentence"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="select-text whitespace-pre-wrap">{m.displayContent || m.content}</p>

                  {m.groundingSources && m.groundingSources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                        Grounding Sources ({m.groundingSources.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.groundingSources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-400 hover:text-blue-300 underline bg-white/5 px-2 py-0.5 rounded flex items-center gap-1 max-w-full truncate"
                          >
                            <span>{src.title || src.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
