
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
        await dbService.saveState({ 
          team: [ceo], 
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] p-4 md:p-6 relative overflow-hidden font-inter">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-teal-500/5 blur-[80px] md:blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-[450px] bg-[#111] border border-white/5 rounded-[40px] md:rounded-[48px] p-8 md:p-14 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8 md:mb-10">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[#14b8a6] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20">
            <span className="text-black font-black text-2xl md:text-3xl">Ω</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase text-center">Omega Workspace</h1>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Identificação de Operador</p>
        </div>

        {isBlocked && (
          <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
            <WifiOff className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-500/80 font-bold leading-tight uppercase">Conexão em risco. Desative AdBlocks se estiver em um novo dispositivo.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-bold">
            <AlertIcon className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {mode === 'LOGIN' && !targetUser && (
          <div className="space-y-6">
            <form onSubmit={handleInitialCheck} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Email Corporativo</label>
                <div className="relative">
                  <MailIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-black border border-white/5 rounded-2xl py-4 md:py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all placeholder:text-gray-800" />
                </div>
              </div>
              <button type="submit" disabled={isSearching || isLoggingIn} className="w-full bg-[#14b8a6] text-black py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 text-sm">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <>AVANÇAR <ArrowIcon className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[8px] uppercase font-black text-gray-700 tracking-widest bg-[#111] px-4">Ou use sua conta</div>
            </div>

            <button 
              onClick={handleGoogleLogin} 
              disabled={isLoggingIn || isSearching}
              className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-[10px]"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Chrome className="w-4 h-4 text-teal-500" /> ENTRAR COM GOOGLE</>}
            </button>
          </div>
        )}

        {mode === 'LOGIN' && targetUser && (
          <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-4">
            <div className="flex items-center gap-4 mb-6 bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 text-lg font-black">{targetUser.name[0]}</div>
              <div className="overflow-hidden flex-1">
                <p className="text-[9px] font-black text-gray-500 uppercase">Acesso Autorizado</p>
                <p className="text-xs font-bold text-white truncate">{targetUser.name}</p>
              </div>
              <button type="button" onClick={() => { setTargetUser(null); setPassword(''); }} className="text-[9px] font-black text-teal-500 uppercase">Trocar</button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Sua Senha</label>
              <div className="relative">
                <LockIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input required autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black border border-white/5 rounded-2xl py-4 md:py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-teal-500/10">ENTRAR</button>
          </form>
        )}

        {mode === 'FIRST_ACCESS' && targetUser && (
          <form onSubmit={handleFirstAccess} className="space-y-6">
            <h2 className="text-lg font-black text-teal-500 italic uppercase">Ativar Perfil Ω</h2>
            <div className="space-y-4">
              <input required autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova Senha" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white text-sm" />
              <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar Senha" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white text-sm" />
            </div>
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm">FINALIZAR CADASTRO</button>
          </form>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 opacity-20">
          <ShieldIcon className="w-3.5 h-3.5" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]">Ambiente 100% Criptografado</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
