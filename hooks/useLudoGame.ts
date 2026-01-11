
import { useState, useCallback, useEffect, useReducer } from 'react';
import { Player, Piece, GameState, PlayerColor, User, GameMode, GameEvent } from '../types';
import { getBestMove, getStrategicAdvice } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { 
  canPieceMove as canPieceMoveCheck, 
  canPlayerMovePiece,
  checkVictoryCondition, 
  calculateNextPosition, 
  findCaptures,
  isPlayerFinished
} from '../services/ruleService';
import { GAME_RULES } from '../constants/gameRules';

type Action = 
  | { type: 'START_GAME'; players: Player[] }
  | { type: 'ROLL_START' }
  | { type: 'ROLL_COMPLETE'; value: number; canMove: boolean }
  | { type: 'MOVE_START'; pieceId: string }
  | { type: 'MOVE_COMPLETE'; nextPlayers: Player[]; hasBonus: boolean; winnerTeamId?: string; winnerPlayer?: Player }
  | { type: 'NEXT_TURN' }
  | { type: 'UPDATE_TIMER'; timer: number }
  | { type: 'SET_AFK'; playerId: string }
  | { type: 'CLEAR_AFK'; playerId: string };

interface GameInternalState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  gameState: GameState;
  winner: Player | null;
  winnerTeamId: string | null;
  turnTimer: number;
  afkPlayers: Set<string>;
  shake: boolean;
}

const gameReducer = (state: GameInternalState, action: Action): GameInternalState => {
  switch (action.type) {
    case 'START_GAME':
      return { 
        ...state, 
        players: action.players, 
        gameState: 'WAITING_FOR_ROLL', 
        winner: null, 
        winnerTeamId: null,
        currentPlayerIndex: 0,
        shake: false
      };
    
    case 'ROLL_START':
      if (state.gameState !== 'WAITING_FOR_ROLL') return state;
      return { ...state, gameState: 'DICE_ROLLING', diceValue: null, shake: true };
    
    case 'ROLL_COMPLETE':
      if (state.gameState !== 'DICE_ROLLING') return state;
      return { 
        ...state, 
        diceValue: action.value, 
        gameState: action.canMove ? 'WAITING_FOR_MOVE' : 'WAITING_FOR_ROLL',
        shake: false
      };
    
    case 'MOVE_START':
      if (state.gameState !== 'WAITING_FOR_MOVE') return state;
      return { ...state, gameState: 'PIECE_ANIMATING' };
    
    case 'MOVE_COMPLETE':
      if (state.gameState !== 'PIECE_ANIMATING') return state;
      return { 
        ...state, 
        players: action.nextPlayers, 
        winner: action.winnerPlayer || null,
        winnerTeamId: action.winnerTeamId || null,
        gameState: (action.winnerPlayer || action.winnerTeamId) ? 'WON' : 'WAITING_FOR_ROLL',
        diceValue: action.hasBonus ? null : state.diceValue,
        shake: false
      };

    case 'NEXT_TURN':
      let nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
      let loopGuard = 0;
      while (loopGuard < state.players.length) {
        const p = state.players[nextIdx];
        const isFinished = isPlayerFinished(p);
        const teammate = state.players.find(tp => tp.teamId === p.teamId && tp.id !== p.id);
        const shouldSkip = isFinished && (!teammate || isPlayerFinished(teammate));

        if (shouldSkip) {
          nextIdx = (nextIdx + 1) % state.players.length;
          loopGuard++;
        } else {
          break;
        }
      }

      return { 
        ...state, 
        currentPlayerIndex: nextIdx,
        gameState: 'WAITING_FOR_ROLL',
        diceValue: null,
        turnTimer: GAME_RULES.TURN_TIME_LIMIT,
        shake: false
      };

    case 'UPDATE_TIMER':
      return { ...state, turnTimer: action.timer };
    
    case 'SET_AFK':
      const newAfk = new Set(state.afkPlayers);
      newAfk.add(action.playerId);
      return { ...state, afkPlayers: newAfk };
    
    case 'CLEAR_AFK':
      const clearedAfk = new Set(state.afkPlayers);
      clearedAfk.delete(action.playerId);
      return { ...state, afkPlayers: clearedAfk };

    default:
      return state;
  }
};

const INITIAL_PIECES = (color: PlayerColor): Piece[] => [
  { id: `${color}-1`, color, position: GAME_RULES.BASE_POSITION },
  { id: `${color}-2`, color, position: GAME_RULES.BASE_POSITION },
  { id: `${color}-3`, color, position: GAME_RULES.BASE_POSITION },
  { id: `${color}-4`, color, position: GAME_RULES.BASE_POSITION },
];

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

  const [state, dispatch] = useReducer(gameReducer, {
    players: getInitialPlayers(),
    currentPlayerIndex: 0,
    diceValue: null,
    gameState: 'LOBBY',
    winner: null,
    winnerTeamId: null,
    turnTimer: GAME_RULES.TURN_TIME_LIMIT,
    afkPlayers: new Set<string>(),
    shake: false
  });

  const [events, setEvents] = useState<GameEvent[]>([]);
  const [currentLang, setCurrentLang] = useState<'en' | 'bn' | 'hi' | 'es'>('en');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [oracleAdvice, setOracleAdvice] = useState<string | null>(null);
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
    dispatch({ type: 'START_GAME', players: getInitialPlayers() });
  }, [gameMode, getInitialPlayers]);

  const rollDice = useCallback(() => {
    if (state.gameState !== 'WAITING_FOR_ROLL') return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (state.afkPlayers.has(currentPlayer.id)) {
      dispatch({ type: 'CLEAR_AFK', playerId: currentPlayer.id });
    }

    dispatch({ type: 'ROLL_START' });
    audioService.playDiceRoll();
    
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      const allPiecesToCheck = [...currentPlayer.pieces];
      if (gameMode === 'TEAM' && isPlayerFinished(currentPlayer)) {
        const teammate = state.players.find(p => p.teamId === currentPlayer.teamId && p.id !== currentPlayer.id);
        if (teammate) allPiecesToCheck.push(...teammate.pieces);
      }
      
      const canMove = allPiecesToCheck.some(p => canPieceMoveCheck(p, val));
      addEvent('ROLL', `${currentPlayer.name} rolled ${val}`, currentPlayer.color);
      dispatch({ type: 'ROLL_COMPLETE', value: val, canMove });

      if (!canMove) {
        setTimeout(() => dispatch({ type: 'NEXT_TURN' }), 1200);
      }
    }, 850);
  }, [state, gameMode, addEvent]);

  const movePiece = useCallback(async (pieceId: string) => {
    if (state.gameState !== 'WAITING_FOR_MOVE' || state.diceValue === null) return;
    
    const currentPlayer = state.players[state.currentPlayerIndex];
    let pieceOwner = state.players.find(p => p.pieces.some(pc => pc.id === pieceId));
    if (!pieceOwner) return;

    const piece = pieceOwner.pieces.find(pc => pc.id === pieceId)!;
    if (!canPlayerMovePiece(currentPlayer, piece, state.players, gameMode)) return;
    if (!canPieceMoveCheck(piece, state.diceValue)) return;

    dispatch({ type: 'MOVE_START', pieceId });
    audioService.playMove();

    const nextPos = calculateNextPosition(piece, state.diceValue);
    const captures = findCaptures(piece, nextPos, state.players);
    
    const nextPlayers = state.players.map(p => {
      const pCopy = { ...p, pieces: p.pieces.map(pc => ({ ...pc })) };
      
      const pcToMove = pCopy.pieces.find(pc => pc.id === pieceId);
      if (pcToMove) {
        pcToMove.position = nextPos;
      }
      
      captures.forEach(c => {
        if (pCopy.id === c.playerId) {
          const capturedPc = pCopy.pieces.find(pc => pc.id === c.pieceId);
          if (capturedPc) {
            capturedPc.position = GAME_RULES.BASE_POSITION;
            audioService.playCapture();
            addEvent('CAPTURE', `${pCopy.name}'s piece captured!`, pCopy.color);
          }
        }
      });
      
      return pCopy;
    });

    const hasBonus = state.diceValue === 6 || captures.length > 0 || nextPos === GAME_RULES.VICTORY_POSITION;
    
    if (nextPos === GAME_RULES.VICTORY_POSITION) {
      audioService.playHome();
      addEvent('HOME', `${pieceOwner.name} reached Home!`, pieceOwner.color);
    }

    const updatedPieceOwner = nextPlayers.find(p => p.id === pieceOwner.id)!;
    const isWon = checkVictoryCondition(updatedPieceOwner, nextPlayers, gameMode);
    
    if (isWon) {
      audioService.playVictory();
      addEvent('VICTORY', `${updatedPieceOwner.name} has won!`, updatedPieceOwner.color);
      dispatch({ 
        type: 'MOVE_COMPLETE', 
        nextPlayers, 
        hasBonus, 
        winnerPlayer: updatedPieceOwner,
        winnerTeamId: updatedPieceOwner.teamId 
      });
    } else {
      dispatch({ type: 'MOVE_COMPLETE', nextPlayers, hasBonus });
      if (!hasBonus) {
        setTimeout(() => dispatch({ type: 'NEXT_TURN' }), 600);
      }
    }
  }, [state, gameMode, addEvent]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      audioService.setMute(next);
      return next;
    });
  }, []);

  const askOracle = useCallback(async () => {
    if (state.gameState === 'WON' || isOracleLoading) return;
    setIsOracleLoading(true);
    try {
      const advice = await getStrategicAdvice(state.players[state.currentPlayerIndex], state.players);
      setOracleAdvice(advice);
    } catch (error) {
      setOracleAdvice("The cosmic link is unstable. Focus on your intuition.");
    } finally {
      setIsOracleLoading(false);
    }
  }, [state, isOracleLoading]);

  useEffect(() => {
    if (state.gameState === 'WAITING_FOR_ROLL' && state.players[state.currentPlayerIndex].isAI && !state.winner) {
      const timer = setTimeout(() => rollDice(), 1500);
      return () => clearTimeout(timer);
    }
    if (state.gameState === 'WAITING_FOR_MOVE' && state.players[state.currentPlayerIndex].isAI && !state.winner) {
      setIsAiThinking(true);
      const moveAi = async () => {
        try {
          const bestPieceId = await getBestMove(state.players[state.currentPlayerIndex], state.diceValue!, state.players);
          if (bestPieceId) {
            movePiece(bestPieceId);
          } else {
            dispatch({ type: 'NEXT_TURN' });
          }
        } catch (error) {
          dispatch({ type: 'NEXT_TURN' });
        } finally {
          setIsAiThinking(false);
        }
      };
      const timer = setTimeout(moveAi, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, state.currentPlayerIndex, state.players, state.diceValue, state.winner, rollDice, movePiece]);

  useEffect(() => {
    if (state.gameState === 'WON' || state.gameState === 'LOBBY' || state.gameState === 'PIECE_ANIMATING' || state.gameState === 'DICE_ROLLING') return;
    
    const interval = setInterval(() => {
      if (state.turnTimer <= 0) {
        dispatch({ type: 'SET_AFK', playerId: state.players[state.currentPlayerIndex].id });
        dispatch({ type: 'NEXT_TURN' });
      } else {
        dispatch({ type: 'UPDATE_TIMER', timer: state.turnTimer - 1 });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state.gameState, state.turnTimer, state.currentPlayerIndex, state.players]);

  return {
    ...state,
    events,
    currentLang,
    isAiThinking,
    oracleAdvice,
    isOracleLoading,
    isMuted,
    rollDice,
    movePiece,
    toggleMute,
    askOracle,
    canPieceMove: canPieceMoveCheck
  };
};
