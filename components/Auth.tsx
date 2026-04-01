
import React, { useState, useEffect } from 'react';
import { User, DefaultUserRole } from '../types';
import { dbService } from '../services/database';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { MONTHS } from '../constants';
import { 
  ShieldCheck as ShieldIcon, 
  Mail as MailIcon, 
  Lock as LockIcon, 
  ArrowRight as ArrowIcon, 
  AlertCircle as AlertIcon,
  RefreshCw,
  WifiOff,
  Loader2,
  Chrome
} from 'lucide-react';

interface AuthProps {
  team: User[];
  onLogin: (user: User) => void;
  onUpdateUser: (updatedUser: User) => void;
}

type AuthMode = 'LOGIN' | 'FIRST_ACCESS' | 'RECOVER';

const Auth: React.FC<AuthProps> = ({ team, onLogin, onUpdateUser }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    dbService.diagnoseConnection().then(d => setIsBlocked(d.status === 'BLOCKED'));
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email?.toLowerCase();
      
      if (!userEmail) throw new Error('Email não retornado pelo Google.');

      // 1. Check if user exists in Firestore by email ID
      let user = await dbService.getUserById(userEmail);
      
      if (user) {
        if (!user.isActive) throw new Error('Acesso suspenso.');
        onLogin(user);
        return;
      }

      // 2. CEO Bootstrap
      if (userEmail === 'assessoriaomega1@gmail.com') {
        const currentYear = new Date().getFullYear();
        const currentMonthName = MONTHS[new Date().getMonth()];
        const monthKey = `${currentMonthName} ${currentYear}`;

        const ceo: User = { 
          id: userEmail, 
          name: result.user.displayName || 'Diretoria Ômega', 
          email: userEmail, 
          password: 'admin', 
          role: DefaultUserRole.CEO, 
          isActive: true 
        };
        // Save to Firestore immediately with correct structure
        await dbService.saveUser(ceo);
        await dbService.saveGlobalState({ 
          availableRoles: Object.values(DefaultUserRole), 
          db: { 
            [monthKey]: { 
              clients: [], 
              tasks: [], 
              salesGoal: { 
                monthlyTarget: 100000, 
                monthlySuperTarget: 150000, 
                currentValue: 0, 
                totalSales: 0, 
                contractFormUrl: 'https://seulink.com/onboarding' 
              },
              drive: [],
              wiki: [],
              notices: []
            } 
          } 
        } as any);
        onLogin(ceo);
        return;
      }

      throw new Error('Email não autorizado. Peça ao administrador para adicionar seu email.');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInitialCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSearching(true);
    const cleanEmail = email.trim().toLowerCase();
    
    // Check cloud directly using email ID
    const user = await dbService.getUserById(cleanEmail);
    
    setIsSearching(false);
    if (!user) {
      setError(`Acesso não localizado.`);
      return;
    }
    if (!user.isActive) {
      setError('Acesso suspenso.');
      return;
    }
    setTargetUser(user);
    setMode(user.password ? 'LOGIN' : 'FIRST_ACCESS');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetUser && targetUser.password === password) {
      onLogin(targetUser);
    } else {
      setError('Senha incorreta.');
    }
  };

  const handleFirstAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Mínimo 4 dígitos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Senhas não conferem.');
      return;
    }
    if (targetUser) {
      const updated = { ...targetUser, password };
      onUpdateUser(updated);
      onLogin(updated);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-x-hidden font-['General_Sans']">
      {/* Video Background */}
      <video 
        className="video-bg" 
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full px-8 md:px-[120px] py-6 md:py-8 flex items-center justify-between z-[100] backdrop-blur-sm bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#14b8a6] rounded-xl flex items-center justify-center text-black font-black italic shadow-[0_0_20px_rgba(20,184,166,0.5)]">Ω</div>
          <span className="text-xl font-bold tracking-tighter italic uppercase">Omega</span>
        </div>

        <div className="hidden md:flex items-center gap-12 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
        </div>

        <button className="pill-button-outer group">
          <div className="pill-button-inner bg-white text-black px-8 py-3 text-[11px] font-bold uppercase tracking-widest group-hover:bg-[#14b8a6] transition-all">
            Join Waitlist
          </div>
        </button>
      </nav>
      
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative z-10">
        <div className="w-full max-w-[1200px] grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          {/* Hero Content */}
          <div className="text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="w-2 h-2 rounded-full bg-[#14b8a6] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">System Online: v2.4.0</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-bold italic tracking-tighter uppercase leading-[0.9] text-gradient">
              The Future of <br />
              Workspace <br />
              Management
            </h1>
            
            <p className="text-lg md:text-xl text-white/40 font-medium leading-relaxed max-w-xl">
              Omega Workspace is the ultimate command center for high-performance teams. 
              Streamline operations, track metrics, and scale your agency with Web3 precision.
            </p>

            <div className="flex flex-wrap gap-6">
              <button className="pill-button-outer group">
                <div className="pill-button-inner bg-[#14b8a6] text-black px-10 py-5 text-sm font-bold uppercase tracking-widest group-hover:scale-105 transition-all">
                  Get Started
                </div>
              </button>
              <button className="px-10 py-5 rounded-full border border-white/10 text-white/60 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-10 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.8)] border-white/10 animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="flex flex-col items-center mb-10 md:mb-14">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#14b8a6] rounded-3xl flex items-center justify-center mb-8 shadow-[0_10px_40px_rgba(20,184,166,0.3)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="text-black font-black text-3xl md:text-4xl italic relative z-10">Ω</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white italic tracking-tighter uppercase text-center text-gradient">Operator Login</h2>
              <p className="text-[10px] md:text-[11px] text-white/40 font-bold uppercase tracking-[0.4em] mt-4">Identification Protocol</p>
            </div>

            {isBlocked && (
              <div className="mb-8 p-5 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex items-start gap-4 backdrop-blur-xl">
                <WifiOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/80 font-bold leading-tight uppercase tracking-wider">Connection at risk. Disable AdBlocks if on a new terminal.</p>
              </div>
            )}

            {error && (
              <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-400 text-[11px] font-bold backdrop-blur-xl">
                <AlertIcon className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {mode === 'LOGIN' && !targetUser && (
              <div className="space-y-8">
                <form onSubmit={handleInitialCheck} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-white/30 uppercase tracking-[0.3em] ml-4">Terminal Access</label>
                    <div className="relative">
                      <MailIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@omega.com" className="w-full bg-white/5 border border-white/10 rounded-full py-5 md:py-6 pl-16 pr-8 text-white text-sm outline-none focus:border-[#14b8a6] focus:bg-white/10 transition-all placeholder:text-white/10" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSearching || isLoggingIn} className="w-full bg-white text-black py-5 md:py-6 rounded-full font-bold uppercase tracking-widest hover:bg-[#14b8a6] hover:text-black transition-all flex items-center justify-center gap-4 text-sm shadow-2xl">
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <>INITIALIZE <ArrowIcon className="w-5 h-5" /></>}
                  </button>
                </form>

                <div className="relative py-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[9px] uppercase font-bold text-white/20 tracking-[0.4em] bg-black/0 px-6 backdrop-blur-sm">Alternative Sync</div>
                </div>

                <button 
                  onClick={handleGoogleLogin} 
                  disabled={isLoggingIn || isSearching}
                  className="w-full bg-white/5 border border-white/10 text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-[11px] backdrop-blur-xl"
                >
                  {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Chrome className="w-5 h-5 text-[#14b8a6]" /> SYNC WITH GOOGLE</>}
                </button>
              </div>
            )}

            {mode === 'LOGIN' && targetUser && (
              <form onSubmit={handleLogin} className="space-y-8 animate-in slide-in-from-right-8">
                <div className="flex items-center gap-5 mb-8 bg-white/5 p-5 rounded-[32px] border border-white/10 backdrop-blur-xl">
                  <div className="w-12 h-12 bg-[#14b8a6]/10 rounded-2xl flex items-center justify-center text-[#14b8a6] text-xl font-bold border border-[#14b8a6]/20">{targetUser.name[0]}</div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Authorized Entity</p>
                    <p className="text-sm font-bold text-white truncate tracking-tight">{targetUser.name}</p>
                  </div>
                  <button type="button" onClick={() => { setTargetUser(null); setPassword(''); }} className="text-[10px] font-bold text-[#14b8a6] uppercase tracking-widest hover:underline">Switch</button>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-white/30 uppercase tracking-[0.3em] ml-4">Access Key</label>
                  <div className="relative">
                    <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input required autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-full py-5 md:py-6 pl-16 pr-8 text-white text-sm outline-none focus:border-[#14b8a6] focus:bg-white/10 transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-white text-black py-5 md:py-6 rounded-full font-bold uppercase tracking-widest text-sm shadow-2xl hover:bg-[#14b8a6] transition-all">AUTHENTICATE</button>
              </form>
            )}

            {mode === 'FIRST_ACCESS' && targetUser && (
              <form onSubmit={handleFirstAccess} className="space-y-8">
                <h2 className="text-xl font-bold text-[#14b8a6] italic uppercase tracking-tighter">Activate Profile Ω</h2>
                <div className="space-y-4">
                  <input required autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Access Key" className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-8 text-white text-sm outline-none focus:border-[#14b8a6]" />
                  <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Access Key" className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-8 text-white text-sm outline-none focus:border-[#14b8a6]" />
                </div>
                <button type="submit" className="w-full bg-white text-black py-6 rounded-full font-bold uppercase tracking-widest text-sm shadow-2xl hover:bg-[#14b8a6] transition-all">FINALIZE PROTOCOL</button>
              </form>
            )}

            <div className="mt-12 flex items-center justify-center gap-3 opacity-20">
              <ShieldIcon className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-[0.4em]">100% Encrypted Environment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
