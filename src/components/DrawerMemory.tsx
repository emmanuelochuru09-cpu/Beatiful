import React, { useState } from 'react';
import { X, Trash2, Plus, CheckCircle2, Circle, Clock, Brain, ListTodo } from 'lucide-react';
import { TimerItem } from '../types';

interface DrawerMemoryProps {
  isOpen: boolean;
  initialTab?: 'memory' | 'todos';
  onClose: () => void;
  facts: string[];
  onAddFact: (fact: string) => void;
  onRemoveFact: (index: number) => void;
  onClearFacts: () => void;
  todos: string[];
  onAddTodo: (todo: string) => void;
  onCompleteTodo: (index: number) => void;
  timers: TimerItem[];
  onCancelTimer: (id: string) => void;
}

export const DrawerMemory: React.FC<DrawerMemoryProps> = ({
  isOpen,
  initialTab = 'memory',
  onClose,
  facts,
  onAddFact,
  onRemoveFact,
  onClearFacts,
  todos,
  onAddTodo,
  onCompleteTodo,
  timers,
  onCancelTimer,
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'todos'>(initialTab);
  const [newFact, setNewFact] = useState('');
  const [newTodo, setNewTodo] = useState('');

  if (!isOpen) return null;

  const handleAddFactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFact.trim()) {
      onAddFact(newFact.trim());
      setNewFact('');
    }
  };

  const handleAddTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAddTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0A0D16] border-l border-white/10 p-6 flex flex-col gap-5 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'memory'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Memories ({facts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'todos'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>To-Dos ({todos.length})</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timers Banner if any */}
        {timers.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Active Countdown Timers</span>
            </div>
            <div className="space-y-1.5">
              {timers.map((t) => {
                const s = Math.max(0, Math.round((t.end - Date.now()) / 1000));
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-xs bg-black/30 px-2.5 py-1.5 rounded-lg border border-amber-500/10"
                  >
                    <span className="text-slate-300">{t.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-300 font-semibold tabular-nums">
                        {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => onCancelTimer(t.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Facts / Memory */}
        {activeTab === 'memory' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <p className="text-xs text-slate-400 leading-relaxed">
              Things Richard remembered about you during chat. He references these unprompted to roast or encourage you.
            </p>

            {/* Add memory form */}
            <form onSubmit={handleAddFactSubmit} className="flex gap-2">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="e.g. Preparing for biology exam on Tuesday..."
                className="flex-1 text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>

            {/* Facts list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {facts.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                  <Brain className="w-8 h-8 mb-2 opacity-30" />
                  <span>No memories saved yet. Talk to Richard or type a memory above!</span>
                </div>
              ) : (
                facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="group p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-start justify-between gap-3 transition-colors"
                  >
                    <span className="text-xs text-slate-200 leading-relaxed select-text">{fact}</span>
                    <button
                      onClick={() => onRemoveFact(idx)}
                      title="Forget this memory"
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {facts.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex justify-end">
                <button
                  onClick={onClearFacts}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear all memories
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: To-Dos */}
        {activeTab === 'todos' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <p className="text-xs text-slate-400 leading-relaxed">
              Your to-do list. Richard can check off items, add tasks when you tell him, or remind you to finish them.
            </p>

            {/* Add Todo Form */}
            <form onSubmit={handleAddTodoSubmit} className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="e.g. Finish chemistry assignment..."
                className="flex-1 text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Todo List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {todos.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                  <ListTodo className="w-8 h-8 mb-2 opacity-30" />
                  <span>Your to-do list is empty. Ask Richard to add a task!</span>
                </div>
              ) : (
                todos.map((todo, idx) => (
                  <div
                    key={idx}
                    onClick={() => onCompleteTodo(idx)}
                    className="group p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Circle className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 transition-colors" />
                      <span className="text-xs text-slate-200 truncate">{todo}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 transition-colors">
                      Tap to finish
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
