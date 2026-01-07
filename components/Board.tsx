
import React, { useMemo } from 'react';
import { Player, Piece as PieceType, PlayerColor } from '../types';
import { Shield, Trophy, Star, Orbit, Sparkle, Layers, Cpu } from 'lucide-react';
import Dice from './Dice';
import Piece from './Piece';
import { getTileCoord } from '../services/geometryService';
import { Z_INDEX, GLASS_STYLES } from '../constants/theme';

interface BoardProps {
  players: Player[];
  onPieceClick: (pieceId: string) => void;
  activeColor: PlayerColor;
  theme: 'en' | 'bn' | 'hi' | 'es';
  canPieceMove: (piece: PieceType, dice: number) => boolean;
  diceValue: number | null;
  onRoll: () => void;
  gameState: string;
  shake?: boolean;
}

const Board: React.FC<BoardProps> = ({ players, onPieceClick, activeColor, theme, diceValue, onRoll, gameState, shake, canPieceMove }) => {
  const rotations: Record<PlayerColor, string> = { 
    RED: 'rotate-z-0', 
    BLUE: 'rotate-z-[-90deg]', 
    YELLOW: 'rotate-z-[180deg]', 
    GREEN: 'rotate-z-[90deg]' 
  };
  
  const counterRotations: Record<PlayerColor, string> = { 
    RED: 'rotate-z-0', 
    BLUE: 'rotate-z-[90deg]', 
    YELLOW: 'rotate-z-[-180deg]', 
    GREEN: 'rotate-z-[-90deg]' 
  };

  const { pieceLayouts, stackIndicators } = useMemo(() => {
    const list: any[] = [];
    const coordMap: Record<string, PieceType[]> = {};
    const indicators: {r: number, c: number, count: number}[] = [];

    players.forEach(p => p.pieces.forEach(pc => {
      const { r, c } = getTileCoord(pc);
      const key = `${r}-${c}`;
      if (!coordMap[key]) coordMap[key] = [];
      coordMap[key].push(pc);
    }));

    Object.entries(coordMap).forEach(([key, pieces]) => {
      const [r, c] = key.split('-').map(Number);
      const firstPiece = pieces[0];
      if (pieces.length > 1 && firstPiece.position !== -1 && firstPiece.position !== 100) {
        indicators.push({ r, c, count: pieces.length });
      }
      pieces.forEach((pc, idx) => {
        list.push({ pc, r, c, stackIndex: idx, stackTotal: pieces.length });
      });
    });

    return { pieceLayouts: list, stackIndicators: indicators };
  }, [players]);

  const renderGrid = () => {
    const cells = [];
    const safeTiles = [[6, 1], [1, 8], [8, 13], [13, 6], [2, 6], [6, 12], [12, 8], [8, 2]];
    
    const startTiles: Record<string, string> = {
      '6-1': 'bg-red-500/30 border-red-400/50 animate-start-glow shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      '1-8': 'bg-blue-500/30 border-blue-400/50 animate-start-glow shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      '8-13': 'bg-yellow-500/30 border-yellow-400/50 animate-start-glow shadow-[0_0_20px_rgba(234,179,8,0.2)]',
      '13-6': 'bg-emerald-500/30 border-emerald-400/50 animate-start-glow shadow-[0_0_20px_rgba(16,185,129,0.2)]'
    };

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const isCorner = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);
        const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
        const isSafe = safeTiles.some(t => t[0] === r && t[1] === c);
        const tileKey = `${r}-${c}`;
        
        if (isCorner || isCenter) { 
          cells.push(<div key={`${r}-${c}`} className="w-full h-full" />); 
          continue; 
        }

        let cellClass = GLASS_STYLES.TILE_BASE;
        cellClass += " animate-path-shimmer"; // Apply shimmer to all board tiles
        
        let content = null;

        if (startTiles[tileKey]) {
           cellClass += ` ${startTiles[tileKey]}`;
        }

        // Apply Home Path Colors
        if (r === 7 && c > 0 && c < 7) cellClass += " bg-red-500/5";
        if (c === 7 && r > 0 && r < 7) cellClass += " bg-blue-500/5";
        if (r === 7 && c > 7 && c < 14) cellClass += " bg-yellow-500/5";
        if (c === 7 && r > 7 && r < 14) cellClass += " bg-emerald-500/5";

        if (isSafe) {
          cellClass += " animate-safe-breath bg-sky-400/5 border-sky-400/20";
          content = (
            <div className="relative flex items-center justify-center">
              <Shield size={12} className="text-sky-300 opacity-60 relative z-10" />
              <div className="absolute inset-0 bg-sky-400/10 blur-lg rounded-full animate-pulse" />
            </div>
          );
        }

        cells.push(
          <div key={`${r}-${c}`} className={`relative flex items-center justify-center transition-all duration-500 ${cellClass}`}>
            <div className="rail-glow opacity-30" />
            {content}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className={`relative w-full max-w-[92vh] aspect-square perspective-[3000px] flex items-center justify-center transition-all duration-1000 ${shake ? 'scale-[1.02] translate-y-1' : ''}`}>
      <div className={`absolute inset-[-20%] rounded-full blur-[140px] opacity-25 transition-all duration-1000 pointer-events-none
        ${activeColor === 'RED' ? 'bg-red-600' : activeColor === 'BLUE' ? 'bg-blue-600' : activeColor === 'YELLOW' ? 'bg-yellow-500' : 'bg-emerald-600'}`} 
      />

      <div className={`relative w-full h-full ${GLASS_STYLES.OBSIDIAN} rounded-[5.5rem] p-10 md:p-12 preserve-3d rotate-x-[12deg] ${rotations[activeColor]} transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)`}>
        <div className="absolute inset-2 rounded-[5.2rem] border-[3px] border-white/5 pointer-events-none z-[60] neon-rim" />
        
        <div className="absolute inset-10 md:inset-12 z-[5] pointer-events-none opacity-[0.05] bg-scanline rounded-[4rem]" />
        
        <div className="grid grid-cols-15 grid-rows-15 w-full h-full relative z-10 rounded-[4rem] overflow-hidden shadow-[inset_0_0_120px_rgba(0,0,0,1)] ring-1 ring-white/10 translate-z-[-10px] bg-slate-950/50">
          {renderGrid()}
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none">
          {['RED', 'BLUE', 'YELLOW', 'GREEN'].map((color, i) => (
            <HomeBase 
              key={color} 
              color={color as PlayerColor} 
              players={players} 
              active={activeColor === color} 
              pos={i === 0 ? "top-0 left-0" : i === 1 ? "top-0 right-0" : i === 2 ? "bottom-0 right-0" : "bottom-0 left-0"} 
              counterRotate={counterRotations[activeColor]} 
            />
          ))}
        </div>

        <div className="absolute inset-0 z-40 pointer-events-none">
          {['RED', 'BLUE', 'YELLOW', 'GREEN'].map((color, i) => {
             const positions = ["top-[12%] -left-[16%]", "top-[12%] -right-[16%]", "bottom-[12%] -right-[16%]", "bottom-[12%] -left-[16%]"];
             return (
               <MonolithPedestal 
                 key={`monolith-${color}`}
                 color={color as PlayerColor}
                 active={activeColor === color}
                 pos={positions[i]}
                 diceValue={activeColor === color ? diceValue : null}
                 onRoll={onRoll}
                 gameState={gameState}
                 counterRotate={counterRotations[activeColor]}
               />
             );
          })}
        </div>

        <div className="absolute top-[36.6%] left-[36.6%] w-[26.6%] h-[26.6%] z-40 p-4 pointer-events-none preserve-3d translate-z-20">
          <div className="relative w-full h-full bg-slate-900/95 rounded-full border-2 border-white/20 flex items-center justify-center shadow-[0_0_100px_rgba(99,102,241,0.3)] overflow-hidden animate-nexus-pulse">
             <div className="relative z-10 flex flex-col items-center gap-3">
                <Trophy size={64} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-float" />
                <div className="flex gap-2">
                   <Star size={14} className="text-yellow-500 animate-pulse" />
                   <Star size={18} className="text-yellow-400 animate-pulse delay-75" />
                </div>
             </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-50 preserve-3d">
          {stackIndicators.map((ind, i) => (
            <div 
              key={`ind-${i}`}
              className={`absolute flex items-center justify-center transition-all duration-500 ${counterRotations[activeColor]}`}
              style={{ top: `${(ind.r / 15) * 100}%`, left: `${(ind.c / 15) * 100}%`, width: '6.66%', height: '6.66%', zIndex: Z_INDEX.PIECE_STACKED }}
            >
              <div className="bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/20 translate-y-6 scale-75 opacity-60 flex items-center gap-1">
                <Layers size={10} className="text-white" />
                <span className="text-[8px] font-black text-white">{ind.count}</span>
              </div>
            </div>
          ))}

          {pieceLayouts.map(data => (
            <Piece 
              key={data.pc.id} 
              {...data} 
              active={activeColor === data.pc.color} 
              onClick={onPieceClick} 
              canMove={diceValue !== null && canPieceMove(data.pc, diceValue)} 
              gameState={gameState} 
              counterRotate={counterRotations[activeColor]} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MonolithPedestal: React.FC<any> = ({ color, active, pos, diceValue, onRoll, gameState, counterRotate }) => {
  const platformColors = {
    RED: 'border-red-500/40 text-red-500 shadow-red-500/20 bg-red-950/40',
    BLUE: 'border-blue-500/40 text-blue-500 shadow-blue-500/20 bg-blue-950/40',
    YELLOW: 'border-yellow-500/40 text-yellow-500 shadow-yellow-500/20 bg-yellow-900/40',
    GREEN: 'border-emerald-500/40 text-emerald-500 shadow-emerald-500/20 bg-emerald-950/40'
  };

  return (
    <div className={`absolute w-36 h-36 flex flex-col items-center justify-center transition-all duration-1000 ${pos} preserve-3d animate-monolith-float`} style={{ zIndex: active ? Z_INDEX.MONOLITH_ACTIVE : Z_INDEX.MONOLITH_BASE }}>
       <div className={`relative w-28 h-28 rounded-3xl border-2 ${GLASS_STYLES.OBSIDIAN} backdrop-blur-2xl flex items-center justify-center transition-all duration-700 ${platformColors[color]} ${active ? 'scale-110 shadow-[0_0_80px_currentColor] border-white opacity-100 translate-z-40' : 'scale-90 opacity-20 border-white/5 translate-z-0 grayscale'} ${counterRotate} pointer-events-auto`}>
          <div className={`transform transition-all duration-700 ${active ? 'scale-[1.1] opacity-100' : 'scale-[0.8] opacity-60'}`}>
            <Dice 
              value={diceValue} 
              onRoll={onRoll} 
              disabled={!active || (gameState !== 'LOBBY' && gameState !== 'ROLLING')} 
              color={color} 
              isActivePlayer={active}
            />
          </div>
       </div>
       <div className="monolith-shadow w-24 h-6 mt-4 opacity-50 blur-xl" />
    </div>
  );
};

const HomeBase: React.FC<any> = ({ color, players, active, pos, counterRotate }) => {
  const player = players.find(p => p.color === color);
  if (!player) return null;
  
  const themes = {
    RED: 'border-red-500/40 bg-red-950/10 shadow-red-500/20',
    BLUE: 'border-blue-500/40 bg-blue-950/10 shadow-blue-500/20',
    YELLOW: 'border-yellow-500/40 bg-yellow-900/10 shadow-yellow-500/20',
    GREEN: 'border-emerald-500/40 bg-emerald-950/10 shadow-emerald-500/20'
  };

  return (
    <div className={`absolute w-[40%] h-[40%] p-10 md:p-12 ${pos} preserve-3d transition-all duration-1000`} style={{ zIndex: Z_INDEX.HOME_BASE }}>
      <div className={`relative w-full h-full rounded-[5rem] border-2 transition-all duration-700 ${GLASS_STYLES.OBSIDIAN} ${themes[color]} ${active ? 'border-white/60 scale-[1.05] translate-z-20 z-40' : 'opacity-40 translate-z-0'}`}>
        <div className={`absolute top-8 left-8 w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden bg-slate-800 shadow-2xl ${active ? 'border-white scale-110' : 'border-white/10'} ${counterRotate} pointer-events-auto`}>
          <img src={player.avatar} className="w-full h-full object-cover" />
          {active && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
        </div>
        <div className="absolute top-10 right-10 opacity-10">
          <Cpu size={40} className="animate-spin-slow" />
        </div>
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-12 py-4 rounded-3xl bg-slate-900/90 border-2 border-white/10 shadow-2xl ${counterRotate} transition-all duration-500 ${active ? 'scale-110 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'scale-90 opacity-40'}`}>
           <span className="text-xs font-black uppercase tracking-[0.3em] text-white whitespace-nowrap">{player.name}</span>
        </div>
      </div>
    </div>
  );
};

export default Board;
