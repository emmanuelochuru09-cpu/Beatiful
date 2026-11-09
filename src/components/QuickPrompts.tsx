import React from 'react';

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelect, disabled }) => {
  const prompts = [
    { label: 'Morning greeting ☕', prompt: 'Good morning Richard! How does my day look?' },
    { label: 'Roast my habits 🔥', prompt: 'Roast my terrible procrastination habits today.' },
    { label: 'Check weather 🌦️', prompt: 'What is the current weather in London?' },
    { label: 'Are you jealous? 📱', prompt: 'I was just talking to Siri and ChatGPT earlier.' },
    { label: 'Set study timer ⏱️', prompt: 'Set a 15 minute study timer for me.' },
    { label: 'Hype me up 🚀', prompt: 'I just finished a huge task, hype me up!' },
    { label: "What's on my to-do? 📋", prompt: 'What tasks are left on my to-do list?' },
  ];

  return (
    <div className="w-full max-w-xl px-4 overflow-x-auto no-scrollbar flex items-center gap-2 py-1 justify-start sm:justify-center">
      {prompts.map((p, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(p.prompt)}
          disabled={disabled}
          className="text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 hover:border-white/15 px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
