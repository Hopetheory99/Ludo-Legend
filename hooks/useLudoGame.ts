
import { useState, useCallback, useEffect, useRef } from 'react';
import { Player, Piece, GameState, PlayerColor, User, GameMode, GameEvent } from '../types';
import { getBestMove, getStrategicAdvice } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { authService } from '../services/authService';
import { canPieceMove as canPieceMoveCheck, checkVictoryCondition } from '../services/ruleService';

const INITIAL_PIECES = (color: PlayerColor): Piece[] => [
  { id: `${color}-1`, color, position: -1 },
  { id: `${color}-2`, color, position: -1 },
  { id: `${color}-3`, color, position: -1 },
  { id: `${color}-4`, color, position: -1 },
];

const TURN_LIMIT = 10;

export const useLudoGame = (currentUser?: User | null, gameMode: GameMode = 'CLASSIC') => {
  const getInitialPlayers = useCallback((): Player[] => {
    const basePlayers: Player[] = [
      { id: '1', name: currentUser?.username || 'Commander Red', avatar: currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', color: 'RED', isAI: false, pieces: INITIAL_PIECES('RED'), languagePreference: 'en' },
      { id: '2', name: 'Blue Phantom', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blue', color: 'BLUE', isAI: true, pieces: INITIAL_PIECES('BLUE'), languagePreference: 'en' },
      { id: '3', name: 'Golden Sun', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yellow', color: 'YELLOW', isAI: true, pieces: INITIAL_PIECES('YELLOW'), languagePreference: 'en' },
      { id: '4', name: 'Emerald Blade', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Green', color: 'GREEN', isAI: true, pieces: INITIAL_PIECES('GREEN'), languagePreference: 'en' },
    ];

    if (gameMode === 'TEAM') {
      return basePlayers.map(p => {
        if (p.color === 'RED' || p.color === 'YELLOW') return { ...p, teamId: 'ALPHA' };
        if (p.color === 'BLUE' || p.color === 'GREEN') return { ...p, teamId: 'BETA' };
        return p;
      });
    }
    return basePlayers;
  }, [currentUser, gameMode]);

  const [players, setPlayers] = useState<Player[]>(getInitialPlayers());
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [currentLang, setCurrentLang] = useState<'en' | 'bn' | 'hi' | 'es'>('en');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [shake, setShake] = useState(false);
  const [oracleAdvice, setOracleAdvice] = useState<string | null>(null);
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  
  // AFK & Takeover Logic States
  const [turnTimer, setTurnTimer] = useState(TURN_LIMIT);
  const [afkPlayers, setAfkPlayers] = useState<Set<string>>(new Set());

  const addEvent = useCallback((type: GameEvent['type'], message: string, color: PlayerColor) => {
    setEvents(prev => [...prev.slice(-19), {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      color,
      timestamp: Date.now()
    }]);
  }, []);

  useEffect(() => {
    setPlayers(getInitialPlayers());
    setCurrentPlayerIndex(0);
    setGameState('LOBBY');
    setWinner(null);
    setDiceValue(null);
    setEvents([]);
    setAfkPlayers(new Set());
    setTurnTimer(TURN_LIMIT);
  }, [gameMode, getInitialPlayers]);

  const nextTurn = useCallback(() => {
    setCurrentPlayerIndex(prev => (prev + 1) % players.length);
    setGameState('ROLLING');
    setTurnTimer(TURN_LIMIT);
    // Note: We don't set diceValue to null immediately so it remains on the board until the next roll starts
  }, [players.length]);

  const rollDice = useCallback((isAuto = false) => {
    if (gameState !== 'LOBBY' && gameState !== 'ROLLING') return;
    
    const currentPlayer = players[currentPlayerIndex];
    
    // User intervention: If manual roll, remove from AFK takeover
    if (!isAuto && !currentPlayer.isAI) {
      setAfkPlayers(prev => {
        const next = new Set(prev);
        if (next.has(currentPlayer.id)) {
          next.delete(currentPlayer.id);
          addEvent('TURN', `SIGNAL REGAINED: ${currentPlayer.name} is back!`, currentPlayer.color);
        }
        return next;
      });
      setTurnTimer(TURN_LIMIT);
    }

    setGameState('PROCESSING');
    audioService.playDiceRoll();
    
    // Smooth reset of dice visual before new value
    setDiceValue(null);
    
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDiceValue(val);
      
      addEvent('ROLL', `${currentPlayer.name} rolled a ${val}`, currentPlayer.color);

      const hasPossibleMove = currentPlayer.pieces.some(p => canPieceMoveCheck(p, val));

      if (!hasPossibleMove) {
        setTimeout(() => {
          nextTurn();
        }, 1200);
      } else {
        setGameState('MOVING');
        setTurnTimer(TURN_LIMIT); // Reset timer for move selection
      }
    }, 600);
  }, [gameState, players, currentPlayerIndex, nextTurn, addEvent]);

  const movePiece = useCallback(async (pieceId: string, isAuto = false) => {
    if (gameState !== 'MOVING' || diceValue === null) return;
    
    const currentPlayer = players[currentPlayerIndex];
    
    // User intervention: If manual move, remove from AFK takeover
    if (!isAuto && !currentPlayer.isAI) {
      setAfkPlayers(prev => {
        const next = new Set(prev);
        if (next.has(currentPlayer.id)) {
          next.delete(currentPlayer.id);
          addEvent('TURN', `SIGNAL REGAINED: ${currentPlayer.name} is back!`, currentPlayer.color);
        }
        return next;
      });
      setTurnTimer(TURN_LIMIT);
    }

    const pieceIndex = currentPlayer.pieces.findIndex(p => p.id === pieceId);
    if (pieceIndex === -1) return;

    const piece = currentPlayer.pieces[pieceIndex];
    if (!canPieceMoveCheck(piece, diceValue)) return;

    setGameState('PROCESSING');
    audioService.playMove();

    const newPlayers = [...players];
    const newPieces = [...currentPlayer.pieces];
    const updatedPiece = { ...piece };

    // CORE LOGIC FIX: Rolling 6 gets you OUT to the first slot (position 0)
    if (updatedPiece.position === -1) {
      updatedPiece.position = 0; 
    } else {
      updatedPiece.position += diceValue;
    }

    // Victory path logic
    if (updatedPiece.position >= 57) {
      updatedPiece.position = 100;
      audioService.playHome();
      addEvent('HOME', `${currentPlayer.name} reached Home!`, currentPlayer.color);
    }

    newPieces[pieceIndex] = updatedPiece;
    newPlayers[currentPlayerIndex] = { ...currentPlayer, pieces: newPieces };

    // Simple capture check
    // In a full implementation, we'd check global coordinates and safe zones here.
    
    setPlayers(newPlayers);

    if (checkVictoryCondition(newPlayers[currentPlayerIndex], newPlayers, gameMode)) {
      setWinner(newPlayers[currentPlayerIndex]);
      setGameState('WON');
      audioService.playVictory();
      authService.recordMatchResult(currentPlayer.id === '1');
      return;
    }

    // Standard Ludo: Rolling 6 grants another turn
    if (diceValue === 6) {
      addEvent('TURN', `Bonus Phase: ${currentPlayer.name} moves again!`, currentPlayer.color);
      setTimeout(() => {
        setGameState('ROLLING');
        setTurnTimer(TURN_LIMIT);
        // We leave diceValue as 6 visually until the next roll clears it
      }, 600);
    } else {
      setTimeout(() => {
        nextTurn();
      }, 800);
    }
  }, [gameState, diceValue, players, currentPlayerIndex, gameMode, nextTurn, addEvent]);

  // Global Turn Countdown Effect
  useEffect(() => {
    if (winner || gameState === 'WON' || gameState === 'PROCESSING' || gameState === 'LOBBY') return;

    const interval = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          const p = players[currentPlayerIndex];
          if (!p.isAI && !afkPlayers.has(p.id)) {
            setAfkPlayers(current => new Set(current).add(p.id));
            addEvent('TURN', `EMERGENCY OVERRIDE: AI Takeover for ${p.name}`, p.color);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayerIndex, gameState, winner, players, afkPlayers, addEvent]);

  // AI & AFK Auto-Play Orchestrator
  useEffect(() => {
    const currentPlayer = players[currentPlayerIndex];
    const isUnderTakeover = currentPlayer.isAI || afkPlayers.has(currentPlayer.id);
    
    if (!isUnderTakeover || gameState === 'WON' || winner || gameState === 'PROCESSING') return;
    
    if (gameState === 'ROLLING') {
      const timer = setTimeout(() => rollDice(true), 1500);
      return () => clearTimeout(timer);
    } 
    
    if (gameState === 'MOVING' && diceValue !== null) {
      const handleAiDecision = async () => {
        setIsAiThinking(true);
        const bestPieceId = await getBestMove(currentPlayer, diceValue, players);
        setIsAiThinking(false);
        if (bestPieceId) {
          movePiece(bestPieceId, true);
        } else {
          nextTurn();
        }
      };
      const timer = setTimeout(handleAiDecision, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, players, gameState, diceValue, winner, afkPlayers, rollDice, movePiece, nextTurn]);

  const askOracle = useCallback(async () => {
    if (isOracleLoading) return;
    setIsOracleLoading(true);
    try {
      const advice = await getStrategicAdvice(players[currentPlayerIndex], players);
      setOracleAdvice(advice);
    } catch (e) {
      setOracleAdvice("The strings of fate are tangled.");
    } finally {
      setIsOracleLoading(false);
    }
  }, [isOracleLoading, players, currentPlayerIndex]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioService.setMute(nextMuted);
  }, [isMuted]);

  return {
    players,
    currentPlayerIndex,
    diceValue,
    gameState,
    currentLang,
    isAiThinking,
    winner,
    shake,
    oracleAdvice,
    isOracleLoading,
    isMuted,
    events,
    turnTimer,
    isAFK: afkPlayers.has(players[currentPlayerIndex].id),
    rollDice: () => rollDice(false),
    movePiece: (id: string) => movePiece(id, false),
    askOracle,
    toggleMute,
    canPieceMove: canPieceMoveCheck,
  };
};
