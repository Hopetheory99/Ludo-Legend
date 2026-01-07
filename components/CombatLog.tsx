
import React, { useEffect, useRef } from 'react';
import { GameEvent, PlayerColor } from '../types';
import { Crosshair, Shield, Home, Target, Zap } from 'lucide-react';

interface CombatLogProps {
  events: GameEvent[];
}

const CombatLog: React.FC<CombatLogProps> = ({ events }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getIcon = (type: GameEvent['type']) => {
    switch (type) {
      case 'ROLL': return <Zap size={14} className="text-yellow-400" />;
      case 'CAPTURE': return <Crosshair size={14} className="text-red-500" />;
      case 'HOME': return <Home size={14} className="text-emerald-400" />;
      case 'VICTORY': return <Target size={14} className="text-indigo-400" />;
      default: return <Shield size={14} className="text-sky-400" />;
    }
  };

  const colorClasses: Record<PlayerColor, string> = {
    RED: 'text-red-400 border-red-500/20 bg-red-500/5',
    BLUE: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    YELLOW: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
    GREEN: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Combat Feed</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar scroll-smooth"
      >
        {events.map((event) => (
          <div 
            key={event.id}
            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all animate-in slide-in-from-left-4 duration-300 ${colorClasses[event.color]}`}
          >
            <div className="mt-0.5 shrink-0">{getIcon(event.type)}</div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold leading-tight uppercase tracking-tight">{event.message}</span>
              <span className="text-[8px] opacity-40 font-black mt-1">
                {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
            <Shield size={32} className="mb-4" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-loose">Awaiting Deployment<br/>Initial Signals Null</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombatLog;
