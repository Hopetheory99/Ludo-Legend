
import React, { useState, useEffect, useMemo } from 'react';
import { useLudoGame } from './hooks/useLudoGame';
import Board from './components/Board';
import CombatLog from './components/CombatLog';
import { TRANSLATIONS } from './constants';
import { authService } from './services/authService';
import { AppView, User, GameMode, TimeOfDay } from './types';
import { 
  Flame, Trophy, User as UserIcon, 
  RefreshCw, BrainCircuit, 
  Volume2, VolumeX, Mail, Facebook, 
  Gamepad2, Users, LayoutDashboard, LogOut, Activity, Sword, Terminal, Timer, Cpu, LayoutGrid, Zap,
  Target, Award, TrendingUp, BarChart3, ChevronLeft, Calendar, Settings as SettingsIcon, Sun, Moon, Clock
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');
  const game = useLudoGame(user, gameMode);
  const [view, setView] = useState<AppView>('AUTH');
  const [turnBannerVisible, setTurnBannerVisible] = useState(false);
  
  // Settings State
  const [timeOfDayConfig, setTimeOfDayConfig] = useState<TimeOfDay>('DYNAMIC');
  const [currentCycle, setCurrentCycle] = useState<'DAY' | 'NIGHT'>('DAY');

  const refreshUser = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  };

  useEffect(() => {
    refreshUser();
    const interval = setInterval(refreshUser, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Cycle Logic
  useEffect(() => {
    if (timeOfDayConfig === 'DYNAMIC') {
      const interval = setInterval(() => {
        setCurrentCycle(prev => prev === 'DAY' ? 'NIGHT' : 'DAY');
      }, 15000); // 15s cycle for visual demo
      return () => clearInterval(interval);
    } else {
      setCurrentCycle(timeOfDayConfig as 'DAY' | 'NIGHT');
    }
  }, [timeOfDayConfig]);

  // Turn Banner Trigger
  useEffect(() => {
    if (view === 'GAME' && !game.winner && !game.winnerTeamId) {
      setTurnBannerVisible(true);
      const timer = setTimeout(() => setTurnBannerVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [game.currentPlayerIndex, view]);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const loggedInUser = await authService.loginWithSocial(provider);
    setUser(loggedInUser);
    setView('MAIN_MENU');
  };

  const handleGuestLogin = async () => {
    const guestUser = await authService.loginAsGuest();
    setUser(guestUser);
    setView('MAIN_MENU');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setView('AUTH');
  };

  const t = TRANSLATIONS[game.currentLang];
  const activePlayer = game.players[game.currentPlayerIndex];

  // Dynamic background style based on cycle
  const backgroundStyle = useMemo(() => {
    return currentCycle === 'DAY' 
      ? 'bg-[#0f172a] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900'
      : 'bg-[#020617] bg-gradient-to-br from-black via-slate-950 to-black';
  }, [currentCycle]);

  if (view === 'AUTH') {
    return (
      <div className={`h-screen w-screen flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-[3000ms] ${backgroundStyle}`}>
        <div className="absolute inset-0 bg-neon-grid opacity-20" />
        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col items-center mb-12">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] mb-6 animate-float">
                <Flame size={48} className="text-white" />
             </div>
             <h1 className="text-5xl font-black tracking-tighter italic text-white text-center">{t.title}</h1>
             <p className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs mt-2">{t.subtitle}</p>
          </div>
          <div className="space-y-4 bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl">
            <button onClick={() => handleSocialLogin('google')} className="w-full flex items-center justify-center gap-4 py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
              <Mail size={24} /> SIGN IN WITH GOOGLE
            </button>
            <button onClick={() => handleSocialLogin('facebook')} className="w-full flex items-center justify-center gap-4 py-4 bg-[#1877F2] text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
              <Facebook size={24} /> SIGN IN WITH FACEBOOK
            </button>
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-black text-white/40">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <button onClick={handleGuestLogin} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-lg hover:bg-white/10 active:scale-95 transition-all">CONTINUE AS GUEST</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'SETTINGS') {
    return (
      <div className={`h-screen w-screen flex flex-col p-6 md:p-12 gap-8 overflow-hidden relative transition-colors duration-[3000ms] text-white ${backgroundStyle}`}>
        <div className="flex items-center justify-between relative z-10 w-full max-w-4xl mx-auto">
          <button onClick={() => setView('MAIN_MENU')} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-black text-xs tracking-widest uppercase">
            <ChevronLeft size={16} /> Hub
          </button>
          <h2 className="text-4xl font-black italic tracking-tighter">SETTINGS</h2>
        </div>
        
        <div className="flex-1 w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 overflow-y-auto">
          <section className="mb-12">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-8">Environment Lighting</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'DAY', label: 'Constant Day', icon: Sun, desc: 'Maximum visibility' },
                { id: 'NIGHT', label: 'Midnight Ops', icon: Moon, desc: 'High contrast neon' },
                { id: 'DYNAMIC', label: 'Dynamic Cycle', icon: Clock, desc: 'Real-time transition' }
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setTimeOfDayConfig(opt.id as TimeOfDay)}
                  className={`p-8 rounded-[2rem] border transition-all duration-500 text-left relative overflow-hidden group ${
                    timeOfDayConfig === opt.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <opt.icon size={28} className={`mb-4 ${timeOfDayConfig === opt.id ? 'text-indigo-400' : 'text-white/40'}`} />
                  <div className="text-xl font-black italic mb-1 uppercase">{opt.label}</div>
                  <div className="text-[10px] font-bold text-white/30 tracking-widest uppercase">{opt.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-8">Audio Parameters</h3>
            <div className="bg-white/5 p-8 rounded-[2rem] flex items-center justify-between">
              <div>
                <div className="text-xl font-black italic mb-1 uppercase">Master Mute</div>
                <div className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Toggle all system sound effects</div>
              </div>
              <button 
                onClick={game.toggleMute}
                className={`w-20 h-10 rounded-full relative transition-all duration-300 ${game.isMuted ? 'bg-red-500' : 'bg-emerald-500'}`}
              >
                <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${game.isMuted ? 'left-1' : 'left-11'}`} />
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Reuse existing view logic for Main Menu, Profile, etc.
  if (view === 'PROFILE') {
    const winRate = user ? Math.round((user.matchesWon / (user.matchesPlayed || 1)) * 100) : 0;
    return (
      <div className={`h-screen w-screen text-white flex flex-col p-6 md:p-12 gap-8 overflow-hidden relative transition-colors duration-[3000ms] ${backgroundStyle}`}>
        <div className="absolute inset-0 bg-neon-grid opacity-5 pointer-events-none" />
        <div className="flex items-center justify-between relative z-10 w-full max-w-6xl mx-auto">
          <button onClick={() => setView('MAIN_MENU')} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-black text-xs tracking-widest uppercase">
            <ChevronLeft size={16} /> Hub
          </button>
          <div className="flex items-center gap-4">
             <div className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Status</span>
                <span className="block text-sm font-black italic text-white uppercase">Pilot Active</span>
             </div>
          </div>
        </div>
        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 overflow-hidden">
          <div className="w-full lg:w-96 flex flex-col gap-6 relative z-10 shrink-0">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[4rem] shadow-2xl flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                <img src={user?.avatar} className="relative w-48 h-48 rounded-full border-4 border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.5)] bg-slate-800" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-500 px-6 py-2 rounded-full text-sm font-black italic shadow-2xl border-2 border-white/20 whitespace-nowrap">
                  LEVEL {user?.level}
                </div>
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter mb-2">{user?.username}</h2>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2 mt-4">
                <div className="bg-indigo-500 h-full w-[65%]" /> 
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] group">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 block">Win Rate</span>
                <span className="text-8xl font-black italic tracking-tighter text-glow">{winRate}%</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] group">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 block">Matches</span>
                <span className="text-8xl font-black italic tracking-tighter">{user?.matchesPlayed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'MAIN_MENU') {
    return (
      <div className={`h-screen w-screen text-white flex flex-col md:flex-row p-6 md:p-12 gap-8 overflow-hidden relative transition-colors duration-[3000ms] ${backgroundStyle}`}>
        <div className="absolute inset-0 bg-neon-grid opacity-10 pointer-events-none" />
        <div className="w-full md:w-80 flex flex-col gap-6 relative z-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center text-center group">
            <div className="relative mb-6">
              <img src={user?.avatar} className="relative w-32 h-32 rounded-full border-4 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)] bg-slate-800" />
              <div className="absolute -bottom-2 right-2 bg-indigo-500 px-3 py-1 rounded-full text-[10px] font-black italic shadow-lg">LVL {user?.level}</div>
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter mb-1">{user?.username}</h2>
            <button onClick={() => setView('PROFILE')} className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black hover:bg-white/10 transition-all group">
              <UserIcon size={16} /> PROFILE
            </button>
            <button onClick={() => setView('SETTINGS')} className="w-full mt-3 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black hover:bg-white/10 transition-all group">
              <SettingsIcon size={16} /> SETTINGS
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-400/50 hover:text-red-400 font-black text-xs uppercase tracking-widest transition-all">
            <LogOut size={16} /> SIGN OUT
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6 relative z-10 h-full overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group shrink-0">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <h3 className="text-5xl font-black italic tracking-tighter mb-4 leading-tight">ARENA<br/>READY</h3>
                <button onClick={() => setView('GAME')} className="px-12 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-2xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center gap-4 group">
                  <Gamepad2 size={32} /> {t.start}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-md shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {[
                 { id: 'CLASSIC', label: t.classic, icon: Trophy, desc: 'Standard Rules' },
                 { id: 'TEAM', label: t.team, icon: Users, desc: '2v2 Strategy' },
                 { id: 'QUICK', label: t.quick, icon: Zap, desc: 'Turbo Mode' }
               ].map((mode) => (
                 <button 
                   key={mode.id}
                   onClick={() => setGameMode(mode.id as GameMode)}
                   className={`relative p-6 rounded-[2rem] border transition-all duration-300 group text-left overflow-hidden ${
                     gameMode === mode.id ? `bg-indigo-500/20 border-indigo-500` : 'bg-white/5 border-white/5 hover:bg-white/10'
                   }`}
                 >
                   <mode.icon size={24} className={`mb-4 ${gameMode === mode.id ? `text-indigo-400` : 'text-white/40'}`} />
                   <h5 className="text-xl font-black italic mb-1 uppercase">{mode.label}</h5>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{mode.desc}</p>
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const turnGlowColor = activePlayer.color === 'RED' ? 'shadow-red-500/40' : activePlayer.color === 'BLUE' ? 'shadow-blue-500/40' : activePlayer.color === 'YELLOW' ? 'shadow-yellow-400/40' : 'shadow-emerald-500/40';

  return (
    <div className={`h-screen w-screen flex flex-col transition-colors duration-[3000ms] ${backgroundStyle} overflow-hidden p-0 relative`}>
      <div className="absolute inset-0 holographic-overlay opacity-10 pointer-events-none z-[100]" />
      <div className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.03] z-[101]" />
      
      {/* Dynamic Turn Banner */}
      {turnBannerVisible && (
        <div className="fixed inset-y-0 left-0 w-full md:w-[400px] z-[600] pointer-events-none flex items-center px-12">
           <div className={`relative px-12 py-8 bg-gradient-to-r ${activePlayer.color === 'RED' ? 'from-red-600' : activePlayer.color === 'BLUE' ? 'from-blue-600' : activePlayer.color === 'YELLOW' ? 'from-yellow-500' : 'from-emerald-600'} to-transparent animate-banner-in flex flex-col`}>
              <div className="h-1 w-full bg-white mb-4 animate-shimmer" />
              <h4 className="text-6xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl">
                {activePlayer.name}'s TURN
              </h4>
           </div>
        </div>
      )}

      <div className="w-full px-8 py-6 flex items-center justify-between z-[200] border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
           <button onClick={() => setView('MAIN_MENU')} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-95 text-indigo-400">
              <LayoutGrid size={20} />
           </button>
           <div className="h-8 w-px bg-white/5" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Arena</span>
              <span className="text-sm font-black italic text-white uppercase">{gameMode}</span>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           {!game.winner && !game.winnerTeamId && (
             <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 ${game.turnTimer < 4 ? 'bg-red-500/20 border-red-500 animate-pulse scale-110' : 'bg-white/5 border-white/5'}`}>
                <Timer size={18} className={game.turnTimer < 4 ? 'text-red-400' : 'text-indigo-400'} />
                <span className={`text-xl font-black italic tracking-tighter ${game.turnTimer < 4 ? 'text-red-400' : 'text-white'}`}>
                   00:{game.turnTimer < 10 ? `0${game.turnTimer}` : game.turnTimer}
                </span>
             </div>
           )}
           <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl text-xs font-black uppercase text-white/40 border border-white/5">
              {currentCycle === 'DAY' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-indigo-400" />}
              <span>{currentCycle}</span>
           </div>
           <button onClick={game.toggleMute} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
              {game.isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-emerald-400" />}
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden xl:flex w-96 flex-col gap-6 p-8 border-r border-white/5 bg-slate-950/20">
          <div className="flex-1 min-h-0">
             <CombatLog events={game.events} />
          </div>
          <div className="h-64 shrink-0 bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Oracle Advice</span>
               <button onClick={game.askOracle} disabled={game.isOracleLoading} className={`p-2 rounded-xl transition-all ${game.isOracleLoading ? 'animate-spin' : 'hover:bg-white/5'}`}>
                 <RefreshCw size={14} className="text-indigo-400" />
               </button>
            </div>
            <div className="h-full max-h-[140px] overflow-y-auto">
               {game.oracleAdvice ? (
                 <div className="animate-in fade-in slide-in-from-top-2 duration-700">
                    <p className="text-sm font-black italic tracking-tighter leading-relaxed text-indigo-100 uppercase">{game.oracleAdvice}</p>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <BrainCircuit size={40} className="mb-3 animate-float" />
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <Board 
            players={game.players} 
            onPieceClick={game.movePiece} 
            activeColor={activePlayer.color} 
            theme={game.currentLang} 
            canPieceMove={game.canPieceMove} 
            diceValue={game.diceValue} 
            onRoll={game.rollDice} 
            gameState={game.gameState} 
            shake={game.shake} 
            currentCycle={currentCycle}
          />
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
             <div className={`bg-slate-900/90 backdrop-blur-3xl p-4 rounded-3xl border border-white/20 flex items-center justify-between shadow-2xl relative overflow-hidden transition-all duration-500 animate-turn-avatar-glow ${turnGlowColor}`}>
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-full border-2 p-0.5 animate-turn-avatar-glow ${activePlayer.color === 'RED' ? 'border-red-500' : activePlayer.color === 'BLUE' ? 'border-blue-500' : activePlayer.color === 'YELLOW' ? 'border-yellow-400' : 'border-emerald-500'}`}>
                      <img src={activePlayer.avatar} className="w-full h-full rounded-full bg-slate-800" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Active Pilot</span>
                      <span className="text-sm font-black italic uppercase truncate max-w-[120px] text-white">{activePlayer.name}</span>
                   </div>
                </div>
                <button onClick={game.askOracle} className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 hover:bg-indigo-600/40 transition-all text-indigo-400">
                  <BrainCircuit size={20} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {(game.winner || game.winnerTeamId) && (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-1000">
          <Trophy size={180} className="text-yellow-400 animate-float drop-shadow-[0_0_50px_rgba(250,204,21,0.5)] mb-12" />
          <h2 className="text-8xl font-black italic mb-2 tracking-tighter text-glow uppercase text-white">
            {game.winnerTeamId ? `TEAM ${game.winnerTeamId}` : game.winner?.name}
          </h2>
          <button onClick={() => setView('MAIN_MENU')} className="px-16 py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[3rem] font-black text-3xl shadow-[0_0_100px_rgba(79,70,229,0.5)] hover:scale-110 active:scale-95 transition-all">Hub</button>
        </div>
      )}
    </div>
  );
};

export default App;
