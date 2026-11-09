import React, { useState, useEffect } from 'react';
import { X, Settings, Volume2, Sparkles, Key, CheckCircle2, AlertCircle, RefreshCw, Sunrise, Clock } from 'lucide-react';
import { sfx } from '../audio/synth';

interface DrawerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  model: string;
  onSaveModel: (model: string) => void;
  selectedVoiceName: string;
  onSelectVoice: (voiceName: string) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  speechPitch: number;
  onSpeechPitchChange: (pitch: number) => void;
  hasServerKey: boolean;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  onTestVoice: () => void;
  onTestBrain: (customKey?: string) => Promise<string>;
  morningGreetingEnabled: boolean;
  onToggleMorningGreeting: () => void;
  morningGreetingTime: string;
  onChangeMorningGreetingTime: (time: string) => void;
  onTriggerMorningGreetingTest: () => void;
  lastGreetingDateString: string | null;
}

export const DrawerSettings: React.FC<DrawerSettingsProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  model,
  onSaveModel,
  selectedVoiceName,
  onSelectVoice,
  speechRate,
  onSpeechRateChange,
  speechPitch,
  onSpeechPitchChange,
  hasServerKey,
  sfxEnabled,
  onToggleSfx,
  onTestVoice,
  onTestBrain,
  morningGreetingEnabled,
  onToggleMorningGreeting,
  morningGreetingTime,
  onChangeMorningGreetingTime,
  onTriggerMorningGreetingTest,
  lastGreetingDateString,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [modelInput, setModelInput] = useState(model);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingBrain, setTestingBrain] = useState(false);

  useEffect(() => {
    setKeyInput(apiKey);
    setModelInput(model);
  }, [apiKey, model]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const vs = window.speechSynthesis.getVoices();
        setAvailableVoices(vs);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleTestBrainClick = async () => {
    setTestingBrain(true);
    setTestResult('Connecting to Gemini API...');
    try {
      const res = await onTestBrain(keyInput.trim() || undefined);
      setTestResult(res);
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setTestingBrain(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onSaveModel(modelInput.trim() || 'gemini-3.8-flash');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0A0D16] border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Richard's Brain & Voice Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Brain & Gemini Key */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini AI Engine</span>
            </span>

            {hasServerKey ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Server Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertCircle className="w-3 h-3" />
                Custom Key Mode
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {hasServerKey
              ? 'Richard is automatically powered by your project’s environment key. You can also specify an optional custom key below.'
              : 'Add your free Gemini API key to activate Richard’s brain.'}
          </p>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Custom API Key (Optional)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={hasServerKey ? 'Using server injected key' : 'Paste AI Studio API key'}
              className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Model
            </label>
            <select
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended, Low Latency)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTestBrainClick}
              disabled={testingBrain}
              className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingBrain ? 'animate-spin' : ''}`} />
              <span>{testingBrain ? 'Testing...' : 'Test Brain'}</span>
            </button>
          </div>

          {testResult && (
            <p className="text-[11px] text-slate-300 p-2.5 rounded-xl bg-black/30 border border-white/5 font-mono select-text">
              {testResult}
            </p>
          )}
        </div>

        {/* Section 2: Scheduled Morning Greeting */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sunrise className="w-3.5 h-3.5 text-amber-400" />
              <span>Scheduled Morning Greeting</span>
            </span>

            <button
              onClick={onToggleMorningGreeting}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                morningGreetingEnabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {morningGreetingEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Richard will automatically wake up and start a personalized, witty conversation the first time you wake him up each morning, roasting your sleep habits and previewing your day.
          </p>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[11px] text-slate-300 font-medium">Daily Schedule Time</label>
            </div>
            <input
              type="time"
              value={morningGreetingTime}
              onChange={(e) => onChangeMorningGreetingTime(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400/50 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-slate-400 font-mono truncate">
              {lastGreetingDateString
                ? `Last greeted: ${lastGreetingDateString}`
                : 'No greeting yet today'}
            </span>

            <button
              onClick={onTriggerMorningGreetingTest}
              className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              Test Greeting Now →
            </button>
          </div>
        </div>

        {/* Section 3: Speech & Voice Tuning */}
        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Voice & Speech Synthesis</span>
            </span>
            <button
              onClick={onTestVoice}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Test Voice
            </button>
          </div>

          {availableVoices.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Synthesizer Voice ({availableVoices.length} available)
              </label>
              <select
                value={selectedVoiceName}
                onChange={(e) => onSelectVoice(e.target.value)}
                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50 cursor-pointer truncate"
              >
                <option value="">Default OS Voice (Auto selection)</option>
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rate slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Speech Speed</span>
              <span className="font-mono text-white">{speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.35"
              step="0.05"
              value={speechRate}
              onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Pitch slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Speech Pitch</span>
              <span className="font-mono text-white">{speechPitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.25"
              step="0.05"
              value={speechPitch}
              onChange={(e) => onSpeechPitchChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs text-slate-300">Tactile Audio Chimes</span>
            <button
              onClick={() => {
                onToggleSfx();
                sfx.playTap();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                sfxEnabled
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              {sfxEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
