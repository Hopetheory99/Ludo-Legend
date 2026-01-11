
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Activity, Shield, Zap, Droplets, Flame } from 'lucide-react';
import { Z_INDEX } from '../constants/theme';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
  color: string;
  isActivePlayer: boolean;
}

interface MaterialProfile {
  base: string;
  accent: string;
  glow: string;
  texture: string;
  dots: string;
  sss: string; // Sub-surface scattering
  label: string;
}

const MATERIAL_PROFILES: Record<string, MaterialProfile> = {
  RED: {
    base: 'from-red-950 via-red-900 to-red-950',
    accent: 'border-red-500/40',
    glow: 'bg-red-500/20',
    texture: 'bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%),_url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]',
    dots: 'bg-red-100 shadow-[0_0_12px_rgba(254,226,226,0.8),inset_0_0_4px_rgba(0,0,0,0.5)]',
    sss: 'bg-[radial-gradient(circle_at_30%_30%,_rgba(239,68,68,0.4)_0%,_transparent_70%)]',
    label: 'Sanguine Quartz'
  },
  BLUE: {
    base: 'from-blue-950 via-indigo-900 to-blue-950',
    accent: 'border-blue-400/40',
    glow: 'bg-blue-400/20',
    texture: 'bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%),_url("https://www.transparenttextures.com/patterns/stardust.png")]',
    dots: 'bg-blue-50 shadow-[0_0_12px_rgba(219,234,254,0.8),inset_0_0_4px_rgba(0,0,0,0.5)]',
    sss: 'bg-[radial-gradient(circle_at_30%_30%,_rgba(59,130,246,0.4)_0%,_transparent_70%)]',
    label: 'Sapphire Core'
  },
  YELLOW: {
    base: 'from-amber-900 via-yellow-700 to-amber-900',
    accent: 'border-yellow-400/40',
    glow: 'bg-yellow-400/20',
    texture: 'bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%),_url("https://www.transparenttextures.com/patterns/brushed-alum.png")]',
    dots: 'bg-yellow-50 shadow-[0_0_12px_rgba(254,249,195,0.8),inset_0_0_4px_rgba(0,0,0,0.5)]',
    sss: 'bg-[radial-gradient(circle_at_30%_30%,_rgba(234,179,8,0.4)_0%,_transparent_70%)]',
    label: 'Aether Gold'
  },
  GREEN: {
    base: 'from-emerald-950 via-emerald-800 to-emerald-950',
    accent: 'border-emerald-400/40',
    glow: 'bg-emerald-400/20',
    texture: 'bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%),_url("https://www.transparenttextures.com/patterns/marble-vibrant.png")]',
    dots: 'bg-emerald-50 shadow-[0_0_12px_rgba(209,250,229,0.8),inset_0_0_4px_rgba(0,0,0,0.5)]',
    sss: 'bg-[radial-gradient(circle_at_30%_30%,_rgba(16,185,129,0.4)_0%,_transparent_70%)]',
    label: 'Jade Monolith'
  }
};

const MotionTrail: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-[-1] pointer-events-none overflow-visible">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i}
          className={`absolute inset-0 rounded-2xl border-2 border-white/20 blur-md animate-dice-trail-fade`}
          style={{ 
            animationDelay: `${i * 0.1}s`,
            transform: `scale(${1 + (i * 0.2)})`,
            opacity: 1 - (i * 0.2)
          }}
        />
      ))}
    </div>
  );
};

const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled, color, isActivePlayer }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rotation, setRotation] = useState({ x: 45, y: 45, z: 0 });
  const [impact, setImpact] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [rollHistory, setRollHistory] = useState<number[]>([]);
  
  const lastValueRef = useRef<number | null>(null);
  const mat = useMemo(() => MATERIAL_PROFILES[color] || MATERIAL_PROFILES.RED, [color]);

  const faceRotations: Record<number, { x: number; y: number; z: number }> = {
    1: { x: 0, y: 0, z: 0 },
    2: { x: 0, y: -90, z: 0 },
    3: { x: 0, y: -180, z: 0 },
    4: { x: 0, y: 90, z: 0 },
    5: { x: -90, y: 0, z: 0 },
    6: { x: 90, y: 0, z: 0 },
  };

  useEffect(() => {
    if (value !== null) {
      lastValueRef.current = value;
      setDisplayValue(value);
      setRollHistory(prev => [value, ...prev].slice(0, 3));
      
      if (!isRolling) {
        const target = faceRotations[value];
        setRotation({ ...target, z: (Math.random() - 0.5) * 8 });
        setImpact(true);
        
        if (window.navigator.vibrate) {
          window.navigator.vibrate([10, 20, 40]);
        }

        const timer = setTimeout(() => setImpact(false), 800);
        return () => clearTimeout(timer);
      }
    } else if (!isRolling) {
      // If the value is null (e.g., turn finished), stay on the last value instead of resetting to 45/45
      if (lastValueRef.current) {
        setRotation({ ...faceRotations[lastValueRef.current], z: 0 });
      } else {
        setRotation({ x: 45, y: 45, z: 0 });
      }
    }
  }, [value, isRolling]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isRolling || !isActivePlayer) return;
    
    setIsRolling(true);
    // Don't clear displayValue immediately, wait for a bit to feel like "preparing"
    
    if (window.navigator.vibrate) window.navigator.vibrate(15);

    const spinsX = Math.floor(Math.random() * 8) + 12;
    const spinsY = Math.floor(Math.random() * 8) + 12;
    
    setRotation({ 
      x: spinsX * 360 + (Math.random() * 90), 
      y: spinsY * 360 + (Math.random() * 90),
      z: Math.random() * 360 
    });
    
    setTimeout(() => { 
      setIsRolling(false); 
      onRoll(); 
    }, 850);
  };

  const renderFace = (num: number) => {
    const dotMap: Record<number, number[]> = { 
      1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] 
    };
    
    // We show result dots if it's the current roll OR if it was the last roll for this pedestal
    const isShowingResult = (value === num || (!isRolling && lastValueRef.current === num));

    return (
      <div className={`w-full h-full rounded-[1.4rem] border-[1.5px] grid grid-cols-3 grid-rows-3 gap-1 p-3 transition-all duration-500 relative overflow-hidden preserve-3d
        bg-gradient-to-br ${mat.base} ${mat.accent}
        ${!isActivePlayer ? 'opacity-90' : 'opacity-100'}
      `}>
        <div className={`absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none ${mat.texture}`} />
        <div className={`absolute inset-0 pointer-events-none ${mat.sss}`} />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/20 pointer-events-none" />

        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center relative z-10">
            {dotMap[num].includes(i) && (
              <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full transition-all duration-700 
                ${isShowingResult ? mat.dots + ' scale-110' : 'bg-black/60 shadow-inner'}
              `} />
            )}
          </div>
        ))}
        {/* Landed Bloom Effect */}
        {isShowingResult && !isRolling && (
          <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
        )}
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45 pointer-events-none animate-shimmer" />
      </div>
    );
  };

  const isWaitingToRoll = isActivePlayer && value === null && !isRolling;

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      
      {/* Persisted Holographic HUD */}
      <div className={`absolute -top-44 w-52 transition-all duration-1000 transform 
        ${isActivePlayer ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-10 pointer-events-none'}
      `} style={{ zIndex: Z_INDEX.FLOATING_VAL }}>
        <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-5 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <div className={`absolute inset-0 ${mat.glow} opacity-10 animate-pulse`} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Activity size={10} className="text-indigo-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/40">Neural Link: {mat.label}</span>
            </div>
            {displayValue && <Sparkles size={10} className="text-yellow-400 animate-bounce" />}
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
             <div className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                {isRolling ? '...' : displayValue || (lastValueRef.current ?? '?')}
             </div>
             <div className="flex flex-col items-end gap-1 pr-1">
                <span className="text-[8px] font-black text-white/20 uppercase">Last Strikes</span>
                <div className="flex gap-1.5">
                  {rollHistory.map((h, i) => (
                    <div key={i} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border border-white/5 
                      ${i === 0 ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-white/5 text-white/30'}`}>
                      {h}
                    </div>
                  ))}
                </div>
             </div>
          </div>
          
          {isWaitingToRoll && (
            <div className="mt-3 flex items-center justify-center gap-2 animate-bounce">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">Ignition Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Dice Object */}
      <div 
        className={`w-20 h-20 md:w-24 md:h-24 perspective-[1500px] transition-all duration-500 preserve-3d
          ${isRolling ? 'scale-110' : 'hover:scale-115 active:scale-90 cursor-pointer'}
          ${impact ? 'animate-dice-shake' : ''}
          ${!isActivePlayer ? 'opacity-60 grayscale-[0.2]' : 'opacity-100'}
        `} 
        onClick={handleClick}
      >
        <MotionTrail active={isRolling} color={color} />
        
        <div 
          className={`relative w-full h-full preserve-3d transition-transform duration-[850ms] 
            ${isRolling ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'cubic-bezier(0.23, 1, 0.32, 1)'}
            ${impact ? 'scale-y-[0.85] scale-x-[1.1]' : 'scale-100'}
          `}
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)` }}
        >
          <div className="absolute inset-0 backface-hidden transform translate-z-[40px] md:translate-z-[48px]">{renderFace(1)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-y-180 translate-z-[40px] md:translate-z-[48px]">{renderFace(3)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-y-90 translate-z-[40px] md:translate-z-[48px]">{renderFace(4)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-y-[-90deg] translate-z-[40px] md:translate-z-[48px]">{renderFace(2)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-x-90 translate-z-[40px] md:translate-z-[48px]">{renderFace(5)}</div>
          <div className="absolute inset-0 backface-hidden transform rotate-x-[-90deg] translate-z-[40px] md:translate-z-[48px]">{renderFace(6)}</div>
          
          <div className={`absolute inset-4 rounded-full blur-2xl transition-all duration-700 ${mat.glow} ${isRolling ? 'scale-150 opacity-60' : 'scale-100 opacity-20'}`} />
        </div>
      </div>

      <div className={`transition-all duration-700 transform mt-12 rounded-full bg-black/80 blur-2xl
        ${isRolling ? 'w-8 h-2 opacity-5 scale-50' : impact ? 'w-40 h-8 opacity-90 scale-125' : 'w-20 h-4 opacity-40 scale-100'}
      `} />

      {/* Visual Impact Effects */}
      {impact && (
        <div className="absolute flex items-center justify-center pointer-events-none">
          <div className={`absolute w-32 h-32 rounded-full border-4 ${mat.accent} animate-dice-shockwave opacity-80`} />
          <div className={`absolute w-48 h-48 rounded-full border border-white/40 animate-dice-fire-ring opacity-40`} />
          <div className="absolute flex items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`absolute w-1 h-8 ${mat.dots} rounded-full animate-particle-drift opacity-0`} 
                style={{ 
                  '--particle-x': `${Math.cos(i * 30 * Math.PI / 180) * 100}px`,
                  '--particle-y': `${Math.sin(i * 30 * Math.PI / 180) * 100}px`,
                  animationDelay: '0s',
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dice;
