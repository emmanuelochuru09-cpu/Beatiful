import React from 'react';
import { Phone, MessageSquare, MapPin, AlarmClock, Youtube, ExternalLink, X } from 'lucide-react';
import { PendingAction } from '../types';

interface ActionBarProps {
  action: PendingAction | null;
  onDismiss: () => void;
  onExecute: (action: PendingAction) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ action, onDismiss, onExecute }) => {
  if (!action) return null;

  const renderIcon = () => {
    switch (action.type) {
      case 'call':
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'maps':
        return <MapPin className="w-4 h-4 text-rose-400" />;
      case 'alarm':
        return <AlarmClock className="w-4 h-4 text-amber-400" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      default:
        return <ExternalLink className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="z-30 w-full max-w-md px-4 my-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl backdrop-blur-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white/5 shrink-0">{renderIcon()}</div>
          <div className="truncate">
            <h4 className="text-sm font-semibold text-white truncate">{action.title}</h4>
            <p className="text-[11px] text-slate-400 truncate">
              {action.details || 'Richard set this up. Tap to confirm on your device.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onExecute(action)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            Launch
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Dismiss action"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
