
import React, { useState, useEffect } from 'react';
import { useLudoGame } from './hooks/useLudoGame';
import Board from './components/Board';
import CombatLog from './components/CombatLog';
import { TRANSLATIONS } from './constants';
import { authService } from './services/authService';
import { AppView, User, GameMode } from './types';
import { 
  Flame, Trophy, User as UserIcon, 
  RefreshCw, BrainCircuit, 
  Volume2, VolumeX, Mail, Facebook, 
  Gamepad2, Users, LayoutDashboard, LogOut, Activity, Sword, Terminal, Timer, Cpu, LayoutGrid, Zap
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');
  const game = useLudoGame(user, gameMode);
  const [view, setView] = useState<AppView>('AUTH');

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

  if (view === 'AUTH') {
    return (
      <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center p-8 relative overflow-hidden">
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

  if (view === 'MAIN_MENU') {
    return (
      <div className="h-screen w-screen bg-[#020617] text-white flex flex-col md:flex-row p-6 md:p-12 gap-8 overflow-hidden">
        <div className="absolute inset-0 bg-neon-grid opacity-10 pointer-events-none" />
        <div className="w-full md:w-80 flex flex-col gap-6 relative z-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center text-center group">
            <div className="relative mb-6">
              <img src={user?.avatar} className="relative w-32 h-32 rounded-full border-4 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)] bg-slate-800" />
              <div className="absolute -bottom-2 right-2 bg-indigo-500 px-3 py-1 rounded-full text-[10px] font-black italic shadow-lg">LVL {user?.level}</div>
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter mb-1">{user?.username}</h2>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              <div className="bg-white/5 p-3 rounded-2xl text-center">
                <span className="block text-[10px] font-black text-white/20 uppercase">Wins</span>
                <span className="text-xl font-black text-yellow-400">{user?.matchesWon}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl text-center">
                <span className="block text-[10px] font-black text-white/20 uppercase">Rate</span>
                <span className="text-xl font-black text-indigo-400">{user ? Math.round((user.matchesWon / (user.matchesPlayed || 1)) * 100) : 0}%</span>
              </div>
            </div>
            <button onClick={() => setView('PROFILE')} className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black hover:bg-white/10 transition-all group">
              <UserIcon size={16} /> PROFILE
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
              <div className="hidden lg:block">
                 <div className="w-48 h-48 rounded-full border-8 border-white/10 flex items-center justify-center animate-spin-slow">
                    <Sword size={64} className="text-white opacity-40 absolute" style={{ transform: 'rotate(45deg) translateY(-20px)' }} />
                    <Sword size={64} className="text-white opacity-40 absolute" style={{ transform: 'rotate(-135deg) translateY(-20px)' }} />
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 mb-6">
               <Trophy size={20} className="text-yellow-400" />
               <h4 className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Select Battle Type</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {[
                 { id: 'CLASSIC', label: t.classic, icon: Trophy, desc: 'Original Rules', color: 'indigo' },
                 { id: 'TEAM', label: t.team, icon: Users, desc: '2v2 Strategy', color: 'emerald' },
                 { id: 'QUICK', label: t.quick, icon: Zap, desc: 'Faster Pacing', color: 'orange' }
               ].map((mode) => (
                 <button 
                   key={mode.id}
                   onClick={() => setGameMode(mode.id as GameMode)}
                   className={`relative p-6 rounded-[2rem] border transition-all duration-300 group text-left overflow-hidden ${
                     gameMode === mode.id ? `bg-indigo-500/20 border-indigo-500 shadow-[0_0_30px_rgba(0,0,0,0.3)]` : 'bg-white/5 border-white/5 hover:bg-white/10'
                   }`}
                 >
                   <mode.icon size={24} className={`mb-4 transition-transform group-hover:scale-110 ${gameMode === mode.id ? `text-indigo-400` : 'text-white/40'}`} />
                   <h5 className={`text-xl font-black italic mb-1 ${gameMode === mode.id ? 'text-white' : 'text-white/60'}`}>{mode.label}</h5>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{mode.desc}</p>
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col bg-[#020617] bg-neon-grid text-white overflow-hidden p-0 relative transition-all duration-500 ${game.shake ? 'bg-red-950/20' : ''}`}>
      <div className="absolute inset-0 holographic-overlay opacity-10 pointer-events-none z-[100]" />
      <div className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.03] z-[101]" />
      
      <div className="w-full px-8 py-6 flex items-center justify-between z-[200] border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
           <button onClick={() => setView('MAIN_MENU')} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-95">
              <LayoutGrid size={20} className="text-indigo-400" />
           </button>
           <div className="h-8 w-px bg-white/5" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-0.5">Arena Mode</span>
              <span className="text-sm font-black italic text-white tracking-widest uppercase">{gameMode}</span>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           {!game.winner && (
             <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 ${game.turnTimer < 4 ? 'bg-red-500/20 border-red-500 animate-pulse scale-110' : 'bg-white/5 border-white/5'}`}>
                <Timer size={18} className={game.turnTimer < 4 ? 'text-red-400' : 'text-indigo-400'} />
                <span className={`text-xl font-black italic tracking-tighter ${game.turnTimer < 4 ? 'text-red-400' : 'text-white'}`}>
                   00:{game.turnTimer < 10 ? `0${game.turnTimer}` : game.turnTimer}
                </span>
             </div>
           )}

           <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
              <Activity size={18} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Signal</span>
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
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <BrainCircuit size={80} />
            </div>
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Terminal size={14} className="text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Oracle Terminal</span>
               </div>
               <button onClick={game.askOracle} disabled={game.isOracleLoading} className={`p-2 rounded-xl transition-all ${game.isOracleLoading ? 'animate-spin' : 'hover:bg-white/5 active:scale-95'}`}>
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
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-center">Protocol Idle</span>
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
          />
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
             <div className="bg-slate-900/80 backdrop-blur-3xl p-4 rounded-3xl border border-white/10 flex items-center justify-between shadow-2xl relative overflow-hidden">
                {game.isAFK && !activePlayer.isAI && (
                  <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-md z-50 flex items-center justify-center gap-3 border border-indigo-500/50 animate-in fade-in">
                     <Cpu size={20} className="text-indigo-400 animate-pulse" />
                     <span className="text-xs font-black uppercase tracking-[0.3em] text-white italic">AI Takeover Active</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-full border-2 p-0.5 ${activePlayer.color === 'RED' ? 'border-red-500' : activePlayer.color === 'BLUE' ? 'border-blue-500' : activePlayer.color === 'YELLOW' ? 'border-yellow-400' : 'border-emerald-500'}`}>
                      <img src={activePlayer.avatar} className="w-full h-full rounded-full bg-slate-800" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Active Turn</span>
                      <span className="text-sm font-black italic uppercase truncate max-w-[120px]">{activePlayer.name}</span>
                   </div>
                </div>
                <button onClick={game.askOracle} className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 hover:bg-indigo-600/40 transition-all">
                  <BrainCircuit size={20} className="text-indigo-400" />
                </button>
             </div>
          </div>
        </div>
      </div>

      {game.isAiThinking && (
        <div className="fixed inset-0 z-[400] pointer-events-none flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
           <div className="bg-indigo-600/20 backdrop-blur-md px-12 py-5 rounded-full border border-indigo-500/30 flex items-center gap-6 animate-pulse">
              <BrainCircuit size={24} className="text-indigo-400 animate-spin-slow" />
              <span className="text-sm font-black uppercase tracking-[0.5em] italic text-indigo-100">AI CALCULATING OPTIMAL PATH</span>
           </div>
        </div>
      )}

      {game.winner && (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-1000">
          <div className="relative mb-12">
             <Trophy size={180} className="relative text-yellow-400 animate-float drop-shadow-[0_0_50px_rgba(250,204,21,0.5)]" />
          </div>
          <h2 className="text-8xl font-black italic mb-2 tracking-tighter text-glow uppercase">{game.winner.name}</h2>
          <p className="text-2xl font-bold text-indigo-400 uppercase tracking-[0.6em] mb-16 animate-pulse">Absolute Domination Achieved</p>
          <button onClick={() => setView('MAIN_MENU')} className="px-16 py-8 bg-indigo-600 hover:bg-indigo-500 rounded-[3rem] font-black text-3xl shadow-[0_0_100px_rgba(79,70,229,0.5)] hover:scale-110 active:scale-95 transition-all flex items-center gap-6 group">
            <LayoutDashboard size={40} className="group-hover:rotate-12 transition-transform" /> TERMINATE SESSION
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
