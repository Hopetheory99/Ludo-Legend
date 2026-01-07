
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Piece as PieceType, PlayerColor } from '../types';
import { Star, Shield, Sparkles } from 'lucide-react';
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

const getStackOffset = (index: number, total: number) => {
  if (total <= 1) return { x: 0, y: 0, scale: 1, z: 10 };
  const intensity = 5; 
  if (total === 2) {
    return { x: index === 0 ? -intensity : intensity, y: 0, scale: 0.82, z: 10 + (index * 4) };
  }
  if (total === 3) {
    const coords = [{ x: 0, y: -intensity }, { x: -intensity, y: intensity }, { x: intensity, y: intensity }];
    return { ...coords[index], scale: 0.76, z: 10 + (index * 4) };
  }
  const coords = [{ x: -intensity, y: -intensity }, { x: intensity, y: -intensity }, { x: -intensity, y: intensity }, { x: intensity, y: intensity }];
  return { ...coords[index], scale: 0.68, z: 10 + (index * 4) };
};

const Piece: React.FC<PieceProps> = ({ pc, r, c, stackIndex, stackTotal, active, canMove, gameState, counterRotate, onClick }) => {
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
    RED: 'from-red-400 via-red-600 to-red-950 shadow-[0_15px_40px_rgba(239,68,68,0.5)]', 
    BLUE: 'from-blue-400 via-blue-600 to-blue-950 shadow-[0_15px_40px_rgba(59,130,246,0.5)]', 
    GREEN: 'from-emerald-400 via-emerald-600 to-emerald-950 shadow-[0_15px_40px_rgba(16,185,129,0.5)]', 
    YELLOW: 'from-yellow-300 via-yellow-500 to-yellow-950 shadow-[0_15px_40px_rgba(234,179,8,0.5)]' 
  };

  const isMovable = active && canMove && gameState === 'MOVING';
  const stackOffset = getStackOffset(stackIndex, stackTotal);
  const currentR = isCaptured ? oldCoords.current.r : r;
  const currentC = isCaptured ? oldCoords.current.c : c;

  let dynamicZIndex = Z_INDEX.PIECE_IDLE;
  if (isMoving) dynamicZIndex = Z_INDEX.PIECE_MOVING;
  else if (isHomeArrival) dynamicZIndex = Z_INDEX.PIECE_HOME_ARRIVAL;
  else if (isLanding) dynamicZIndex = Z_INDEX.PIECE_LANDING;

  return (
    <div 
      className={`absolute transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) pointer-events-auto preserve-3d
        ${isCaptured ? 'animate-piece-capture' : ''}
        ${isMovable ? 'cursor-pointer' : ''}
        ${isLanding ? 'animate-bounce-settle' : ''}
        ${isHomeArrival ? 'animate-home-impact' : ''}
        ${!isMoving && !isLanding && !isMovable && !isVictory && !isHomeArrival ? 'animate-idle-breath' : ''}
      `}
      style={{ 
        top: `${(currentR / 15) * 100}%`, left: `${(currentC / 15) * 100}%`, width: '6.66%', height: '6.66%', padding: '0.8%',
        zIndex: dynamicZIndex,
        transform: isMoving ? `translateZ(120px) scale(1.6)` : `translate3d(${stackOffset.x}px, ${stackOffset.y}px, ${stackOffset.z}px) scale(${stackOffset.scale})`
      }}
      onClick={() => isMovable && onClick(pc.id)}
    >
      {showBurst && <LandingBurst color={pc.color} type={tileType} />}
      
      {/* Movable Highlight Glow */}
      {isMovable && (
        <div className="absolute inset-[-15%] rounded-full bg-white/30 blur-xl animate-movable-pulse z-[-1]" />
      )}

      <div className={`absolute inset-2 bg-black/80 rounded-full transition-all duration-700 blur-[6px] ${isMoving ? 'scale-[2.5] translate-y-16 opacity-5' : 'scale-110 translate-y-2 opacity-40'}`} />
      
      <div className={`w-full h-full rounded-full bg-gradient-to-br border-b-[8px] border-black/50 transition-all preserve-3d group ${pieceColorStyles[pc.color]} ${isMovable ? 'animate-movable-pulse ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.8)]' : 'opacity-95'} ${isVictory ? 'animate-victory-celebration shadow-[0_0_80px_white] ring-4 ring-yellow-400' : ''} ${counterRotate}`}>
        {/* Visual ring for movable pieces */}
        {isMovable && (
          <div className="absolute inset-[-6px] rounded-full border-2 border-white/60 animate-ping opacity-20" />
        )}
        
        <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/40 z-10" />
        <div className="absolute inset-[15%] rounded-full border-[1.5px] border-white/20" />
        <div className={`absolute inset-[40%] rounded-full transition-opacity duration-500 ${isMoving ? 'opacity-100' : 'opacity-30'} ${pc.color === 'YELLOW' ? 'bg-white' : 'bg-white/40'} blur-[1px] shadow-[0_0_10px_white]`} />
      </div>
    </div>
  );
};

export default memo(Piece, (prev, next) => {
  return prev.pc.position === next.pc.position && prev.stackIndex === next.stackIndex && prev.stackTotal === next.stackTotal && prev.active === next.active && prev.canMove === next.canMove && prev.gameState === next.gameState && prev.counterRotate === next.counterRotate;
});
