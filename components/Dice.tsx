
import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Z_INDEX } from '../constants/theme';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
  color: string;
  isActivePlayer: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled, color, isActivePlayer }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rotation, setRotation] = useState({ x: 45, y: 45 });
  const [impact, setImpact] = useState(false);

  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 }, 2: { x: 0, y: -90 }, 3: { x: 0, y: -180 }, 4: { x: 0, y: 90 }, 5: { x: -90, y: 0 }, 6: { x: 90, y: 0 },
  };

  const glowColors: Record<string, string> = {
    RED: 'shadow-red-500/50 bg-red-500/20', BLUE: 'shadow-blue-500/50 bg-blue-500/20', YELLOW: 'shadow-yellow-500/50 bg-yellow-500/20', GREEN: 'shadow-emerald-500/50 bg-emerald-500/20',
  };

  const ringColors: Record<string, string> = {
    RED: 'border-red-500/60', BLUE: 'border-blue-500/60', YELLOW: 'border-yellow-500/60', GREEN: 'border-emerald-500/60',
  };

  useEffect(() => {
    if (value !== null && !isRolling) {
      setRotation(faceRotations[value]);
      setImpact(true);
      const timer = setTimeout(() => setImpact(false), 1000);
      return () => clearTimeout(timer);
    } else if (value === null && !isRolling) {
       setRotation({ x: 45, y: 45 });
    }
  }, [value, isRolling]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isRolling || !isActivePlayer) return;
    setIsRolling(true);
    if (window.navigator.vibrate) window.navigator.vibrate([60, 30, 60]);
    const spinsX = Math.floor(Math.random() * 6) + 15;
    const spinsY = Math.floor(Math.random() * 6) + 15;
    setRotation({ x: spinsX * 360 + 45, y: spinsY * 360 + 45 });
    setTimeout(() => { setIsRolling(false); onRoll(); }, 750);
  };

  const renderDots = (num: number) => {
    const dotMap: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const isShowingValue = value === num && !isRolling;
    return (
      <div className={`w-full h-full rounded-2xl border-2 grid grid-cols-3 grid-rows-3 gap-1.5 p-2.5 shadow-inner transition-all duration-300 ${isShowingValue ? 'bg-white shadow-[inset_0_0_30px_rgba(79,70,229,0.3)] border-indigo-400' : 'bg-slate-50/90 border-slate-200'} ${!isActivePlayer ? 'grayscale-[0.8] opacity-60' : ''}`}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotMap[num].includes(i) && <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${isShowingValue ? 'bg-indigo-600 scale-125 shadow-[0_0_15px_rgba(79,70,229,0.8)]' : 'bg-slate-900/80'}`} />}
          </div>
        ))}
      </div>
    );
  };

  const isDormant = !isActivePlayer && !isRolling;

  return (
    <div className="relative group flex flex-col items-center justify-center h-full">
      <div className={`absolute -top-24 flex flex-col items-center transition-all duration-700 pointer-events-none`} style={{ zIndex: Z_INDEX.FLOATING_VAL, opacity: value !== null && !isRolling && isActivePlayer ? 1 : 0, transform: value !== null && !isRolling && isActivePlayer ? 'translate-y-0 scale-125' : 'translate-y-16 scale-50' }}>
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-6 py-2.5 rounded-[1.5rem] shadow-2xl border-2 border-indigo-500 transform rotate-[-2deg]">
          <span className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{value}</span>
          <Sparkles size={18} className="text-yellow-500 animate-pulse" />
        </div>
      </div>

      {impact && isActivePlayer && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: Z_INDEX.DICE_IMPACT }}>
          <div className="w-48 h-48 bg-white/40 rounded-full blur-3xl animate-ping opacity-50" />
          <div className={`w-32 h-32 rounded-full border-[10px] ${ringColors[color]} animate-dice-fire-ring`} />
        </div>
      )}

      <div className={`w-16 h-16 perspective-[800px] transition-all duration-500 transform preserve-3d ${isDormant ? 'opacity-40 grayscale pointer-events-none scale-90' : 'hover:scale-110 active:scale-90 cursor-pointer'} ${isActivePlayer && !isRolling && value === null ? 'animate-bounce shadow-[0_0_40px_rgba(255,255,255,0.3)]' : ''} ${impact ? 'animate-dice-shake' : ''}`} onClick={handleClick}>
        {isRolling && (
          <div className="absolute inset-0 pointer-events-none">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`absolute inset-0 rounded-2xl ${glowColors[color]} blur-lg opacity-30`} style={{ transform: `translateZ(${-i * 15}px) rotateX(${rotation.x - i * 5}deg) rotateY(${rotation.y - i * 5}deg)`, transition: `transform ${0.05 + i * 0.05}s ease-out` }} />
            ))}
          </div>
        )}
        <div className={`relative w-full h-full preserve-3d transition-transform duration-[750ms] cubic-bezier(0.19, 1, 0.22, 1) ${impact ? 'scale-y-[0.6] scale-x-[1.4] brightness-150' : 'scale-100'} ${isDormant ? 'animate-spin-slow' : ''}`} style={!isDormant ? { transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` } : {}}>
          <div className="absolute inset-0 backface-hidden transform translate-z-[32px] shadow-2xl">{renderDots(1)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-y-180 translate-z-[32px] shadow-2xl">{renderDots(3)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-y-90 translate-z-[32px] shadow-2xl">{renderDots(4)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-y-[-90deg] translate-z-[32px] shadow-2xl">{renderDots(2)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-x-90 translate-z-[32px] shadow-2xl">{renderDots(5)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-x-[-90deg] translate-z-[32px] shadow-2xl">{renderDots(6)}</div>
          <div className={`absolute inset-0 bg-white rounded-2xl transition-opacity duration-300 blur-2xl ${impact ? 'opacity-40' : 'opacity-0'}`} />
        </div>
      </div>
      <div className={`w-20 h-4 bg-black/60 rounded-full blur-2xl transition-all duration-300 transform mt-4 ${isRolling ? 'scale-50 opacity-10 translate-y-12 blur-3xl' : impact && isActivePlayer ? 'scale-[4.5] opacity-100 translate-y-0 brightness-200' : 'scale-100 opacity-40 translate-y-0'}`} />
    </div>
  );
};

export default Dice;
