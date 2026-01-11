
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Piece as PieceType, PlayerColor } from '../types';
import { Star, Shield, Sparkles, ChevronUp, Zap } from 'lucide-react';
import { getTileCoord, isSafeTile } from '../services/geometryService';
import { Z_INDEX } from '../constants/theme';

interface PieceProps {
  pc: PieceType;
  r: number;
  c: number;
  stackIndex: number;
  stackTotal: number;
  active: boolean;
  canMove: boolean;
  gameState: string;
  counterRotate: string;
  currentCycle?: 'DAY' | 'NIGHT';
  onClick: (id: string) => void;
}

type TileType = 'NORMAL' | 'SAFE' | 'VICTORY' | 'HOME';

const LandingBurst: React.FC<{ color: PlayerColor; type: TileType }> = ({ color, type }) => {
  const particleCount = type === 'HOME' ? 24 : type === 'VICTORY' ? 16 : 12;
  
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const angle = (i * 360) / particleCount + (Math.random() * 20 - 10);
      const radius = type === 'HOME' ? 120 : type === 'VICTORY' ? 100 : 70;
      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const y = Math.sin((angle * Math.PI) / 180) * radius;
      const size = Math.random() * 4 + (type === 'HOME' ? 4 : 2);
      const delay = Math.random() * 0.2;
      return { x, y, size, delay, angle };
    });
  }, [particleCount, type]);

  const colorStyles: Record<PlayerColor, string> = {
    RED: 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
    BLUE: 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]',
    GREEN: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]',
    YELLOW: 'bg-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.8)]',
  };

  const typeGlow: Record<TileType, string> = {
    NORMAL: '',
    SAFE: 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.9)]',
    VICTORY: 'bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.9)]',
    HOME: 'bg-yellow-400 shadow-[0_0_25px_rgba(250,204,21,1)]',
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: Z_INDEX.PARTICLES }}>
      <div className={`absolute w-full h-full rounded-full border-2 border-white opacity-0 animate-burst ${typeGlow[type] || colorStyles[color]}`} />
      {particles.map((p, i) => (
        <div
          key={i}
          className={`absolute rounded-full animate-particle-drift shadow-lg flex items-center justify-center ${typeGlow[type] || colorStyles[color]}`}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            '--particle-x': `${p.x}px`,
            '--particle-y': `${p.y}px`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        >
          {type === 'HOME' && i % 3 === 0 && <Sparkles size={p.size * 2} className="text-white absolute animate-pulse" />}
        </div>
      ))}
    </div>
  );
};

const getStackPhysics = (index: number, total: number) => {
  if (total <= 1) return { x: 0, y: 0, scale: 1, z: 20 };
  
  const baseSpread = 10; 
  const liftPerLevel = 12; 

  let x = 0;
  let y = 0;
  let scale = 0.9;

  if (total === 2) {
    const direction = index === 0 ? -1 : 1;
    x = direction * baseSpread;
    y = direction * (baseSpread / 2);
  } else if (total === 3) {
    const angle = (index * 120 - 90) * (Math.PI / 180);
    x = Math.cos(angle) * (baseSpread * 1.2);
    y = Math.sin(angle) * (baseSpread * 1.2);
    scale = 0.82;
  } else if (total >= 4) {
    const angle = (index * 90 + 45) * (Math.PI / 180);
    x = Math.cos(angle) * (baseSpread * 1.4);
    y = Math.sin(angle) * (baseSpread * 1.4);
    scale = 0.78;
  }

  return { 
    x, 
    y, 
    scale, 
    z: 20 + (index * liftPerLevel),
    brightness: 0.8 + (index / total) * 0.2 
  };
};

const Piece: React.FC<PieceProps> = ({ pc, r, c, stackIndex, stackTotal, active, canMove, gameState, counterRotate, currentCycle = 'DAY', onClick }) => {
  const [isLanding, setIsLanding] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isHomeArrival, setIsHomeArrival] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  
  const prevPos = useRef(pc.position);
  const oldCoords = useRef({ r, c });

  const tileType = useMemo(() => {
    if (pc.position === 100) return 'HOME';
    if (pc.position >= 52) return 'VICTORY';
    return isSafeTile(pc.color, pc.position) ? 'SAFE' : 'NORMAL';
  }, [pc.color, pc.position]);

  useEffect(() => {
    if (pc.position === -1 && prevPos.current !== -1) {
      setIsCaptured(true);
      setTimeout(() => {
        setIsCaptured(false);
        oldCoords.current = { r, c };
      }, 800);
    } 
    else if (prevPos.current !== pc.position && pc.position !== -1) {
      setIsMoving(true);
      if (pc.position === 100) {
        setIsHomeArrival(true);
        setTimeout(() => {
          setIsHomeArrival(false);
          setIsVictory(true);
          setShowBurst(true);
          setTimeout(() => setShowBurst(false), 1200);
        }, 1200);
      } else {
        setTimeout(() => {
          setIsMoving(false);
          setIsLanding(true);
          setShowBurst(true);
          setTimeout(() => {
            setIsLanding(false);
            setShowBurst(false);
          }, 900);
        }, 700);
      }
      prevPos.current = pc.position;
      oldCoords.current = { r, c };
    }
    prevPos.current = pc.position;
    oldCoords.current = { r, c };
  }, [pc.position, r, c]);

  const pieceColorStyles = { 
    RED: 'from-red-400 via-red-600 to-red-950 shadow-[0_15px_40px_rgba(239,68,68,0.4)]', 
    BLUE: 'from-blue-400 via-blue-600 to-blue-950 shadow-[0_15px_40px_rgba(59,130,246,0.4)]', 
    GREEN: 'from-emerald-400 via-emerald-600 to-emerald-950 shadow-[0_15px_40px_rgba(16,185,129,0.4)]', 
    YELLOW: 'from-yellow-300 via-yellow-500 to-yellow-950 shadow-[0_15px_40px_rgba(234,179,8,0.4)]' 
  };

  const isMovable = active && canMove && (gameState === 'WAITING_FOR_MOVE');
  const physics = getStackPhysics(stackIndex, stackTotal);
  const currentR = isCaptured ? oldCoords.current.r : r;
  const currentC = isCaptured ? oldCoords.current.c : c;

  let dynamicZIndex = Z_INDEX.PIECE_IDLE;
  if (isMoving) dynamicZIndex = Z_INDEX.PIECE_MOVING;
  else if (isHomeArrival) dynamicZIndex = Z_INDEX.PIECE_HOME_ARRIVAL;
  else if (isLanding) dynamicZIndex = Z_INDEX.PIECE_LANDING;
  else if (stackTotal > 1) dynamicZIndex = Z_INDEX.PIECE_STACKED + stackIndex;

  const isStable = !isMoving && !isLanding && !isMovable && !isVictory && !isHomeArrival && !isCaptured;

  return (
    <div 
      className={`absolute transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) pointer-events-auto preserve-3d will-change-transform ${isMovable ? 'cursor-pointer' : ''}`}
      style={{ 
        top: `${(currentR / 15) * 100}%`, 
        left: `${(currentC / 15) * 100}%`, 
        width: '6.66%', 
        height: '6.66%', 
        padding: '0.4%',
        zIndex: dynamicZIndex,
        transform: isMoving 
          ? `translateZ(160px) scale(1.6)` 
          : isMovable 
            ? `translate3d(${physics.x}px, ${physics.y - 12}px, ${physics.z + 40}px) scale(${physics.scale * 1.15})`
            : `translate3d(${physics.x}px, ${physics.y}px, ${physics.z}px) scale(${physics.scale})`
      }}
      onClick={() => isMovable && onClick(pc.id)}
    >
      <div className={`w-full h-full preserve-3d relative transition-transform duration-500
        ${isCaptured ? 'animate-piece-capture' : ''}
        ${isLanding ? 'animate-bounce-settle' : ''}
        ${isHomeArrival ? 'animate-home-impact' : ''}
        ${isStable ? 'animate-idle-breath' : ''}
        ${isVictory ? 'animate-victory-celebration' : ''}
      `}>
        {showBurst && <LandingBurst color={pc.color} type={tileType} />}
        
        {/* Movable Hint: Floating Chevron */}
        {isMovable && (
          <div className={`absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 animate-bounce ${counterRotate}`}>
            <div className="bg-white/90 p-1 rounded-full shadow-[0_0_15px_white] animate-pulse">
               <ChevronUp size={16} className="text-slate-900 font-bold" />
            </div>
            <div className="w-1 h-2 bg-gradient-to-b from-white to-transparent" />
          </div>
        )}

        {/* Physical Drop Shadow */}
        <div className={`absolute inset-2 bg-black/60 rounded-full transition-all duration-700 blur-[6px] 
          ${isMoving ? 'scale-[2.5] translate-y-20 opacity-10' : 'scale-110 translate-y-2 opacity-40'}`} 
        />
        
        {/* Selection Aura */}
        {isMovable && (
          <div className="absolute inset-[-60%] rounded-full bg-white/40 blur-3xl animate-movable-pulse z-[-1]" />
        )}

        {/* Resin Body */}
        <div 
          className={`w-full h-full rounded-full bg-gradient-to-br border-b-[8px] border-black/60 transition-all preserve-3d group overflow-hidden ${pieceColorStyles[pc.color]} 
            ${isMovable ? 'ring-[4px] ring-white shadow-[0_0_50px_rgba(255,255,255,0.8)] animate-movable-glow' : 'opacity-100'} 
            ${isVictory ? 'shadow-[0_0_80px_white] ring-8 ring-yellow-400' : ''}`}
          style={{ 
            filter: `brightness(${physics.brightness})`,
          }}
        >
          {/* Surface Shaders */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/40 pointer-events-none" />
          <div className="absolute top-1 left-2 w-1/3 h-1/4 bg-white/40 rounded-full blur-[2px] rotate-[15deg] pointer-events-none" />
          
          {/* Movable Core Animation */}
          {isMovable && (
            <div className="absolute inset-0 bg-white/10 animate-shimmer" />
          )}

          {/* Internal Energy Core */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${counterRotate}`}>
             <div className={`transition-transform duration-700 ${isMoving ? 'scale-150' : 'scale-100'}`}>
               {isMovable ? (
                 <Zap size={14} className="text-white animate-pulse drop-shadow-[0_0_8px_white]" />
               ) : (
                 <Sparkles size={14} className={pc.color === 'YELLOW' ? 'text-slate-900' : 'text-white'} />
               )}
             </div>
          </div>

          {/* Individual ID / Stack Position */}
          {stackTotal > 1 && (
            <div className={`absolute inset-0 flex items-center justify-center ${counterRotate} opacity-20 pointer-events-none`}>
              <span className="text-[10px] font-black">{stackIndex + 1}</span>
            </div>
          )}
        </div>

        {/* Outer Ring Feedback for Interaction */}
        {isMovable && (
          <div className="absolute inset-[-15%] rounded-full border-4 border-white/60 animate-ping opacity-30" />
        )}
      </div>
    </div>
  );
};

export default memo(Piece, (prev, next) => {
  return (
    prev.pc.position === next.pc.position && 
    prev.stackIndex === next.stackIndex && 
    prev.stackTotal === next.stackTotal && 
    prev.active === next.active && 
    prev.canMove === next.canMove && 
    prev.gameState === next.gameState && 
    prev.currentCycle === next.currentCycle
  );
});
