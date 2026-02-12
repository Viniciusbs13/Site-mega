
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/database';
import { 
  ShieldCheck as ShieldIcon, 
  Mail as MailIcon, 
  Lock as LockIcon, 
  ArrowRight as ArrowIcon, 
  AlertCircle as AlertIcon,
  RefreshCw,
  WifiOff
} from 'lucide-react';

interface AuthProps {
  team: User[];
  onLogin: (user: User) => void;
  onUpdateUser: (updatedUser: User) => void;
}

type AuthMode = 'LOGIN' | 'FIRST_ACCESS' | 'RECOVER' | 'RESET_PASSWORD';

const Auth: React.FC<AuthProps> = ({ team, onLogin, onUpdateUser }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const diag = await dbService.diagnoseConnection();
    setIsBlocked(diag.status === 'BLOCKED');
  };

  const handleInitialCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = email.trim().toLowerCase();
    const user = team.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      setError(`O email "${cleanEmail}" não foi encontrado neste navegador. Tente clicar em "Sincronizar com a Nuvem" abaixo.`);
      return;
    }

    if (!user.isActive) {
      setError('Acesso suspenso temporariamente.');
      return;
    }

    setTargetUser(user);
    if (!user.password) {
      setMode('FIRST_ACCESS');
    } else {
      setMode('LOGIN');
    }
  };

  const forceSync = async () => {
    setIsSyncing(true);
    setError('');
    try {
      const diag = await dbService.diagnoseConnection();
      if (diag.status === 'BLOCKED') {
        setError("Não foi possível sincronizar: Seu AdBlock ou VPN está bloqueando a conexão.");
        setIsBlocked(true);
      } else {
        // Recarrega a página para forçar o App.tsx a buscar os dados da nuvem novamente
        window.location.reload();
      }
    } catch (e) {
      setError("Erro ao tentar conectar com a nuvem.");
    } finally {
      setIsSyncing(false);
    }
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
      setError('Defina uma senha com pelo menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (targetUser) {
      const updated = { ...targetUser, password };
      onUpdateUser(updated);
      onLogin(updated);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-[480px] bg-[#111] border border-white/5 rounded-[48px] p-12 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#14b8a6] rounded-2xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(20,184,166,0.3)]">
            <span className="text-black font-black text-3xl">Ω</span>
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">OMEGA WORKSPACE</h1>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Acesso Restrito ao Time</p>
        </div>

        {isBlocked && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col gap-2 text-amber-500 text-[10px] font-black uppercase">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>Bloqueio de Nuvem Detectado</span>
            </div>
            <p className="opacity-70 font-bold tracking-tight leading-tight">Desative o AdBlocker para este site para que novos cadastros funcionem.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <AlertIcon className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {mode === 'LOGIN' && !targetUser && (
          <form onSubmit={handleInitialCheck} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Email de Acesso</label>
              <div className="relative">
                <MailIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              ENTRAR <ArrowIcon className="w-4 h-4" />
            </button>
            
            <div className="pt-4 border-t border-white/5">
              <button 
                type="button" 
                onClick={forceSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 hover:text-teal-500 uppercase transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Email não entra? Sincronizar com a Nuvem'}
              </button>
            </div>
          </form>
        )}

        {mode === 'LOGIN' && targetUser && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-500 font-bold">
                {targetUser.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-gray-500 uppercase">Bem-vindo,</p>
                <p className="text-sm font-bold text-white truncate">{targetUser.name}</p>
              </div>
              <button type="button" onClick={() => { setTargetUser(null); setPassword(''); }} className="ml-auto text-[9px] font-black text-teal-500 hover:underline uppercase">Trocar</button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Sua Senha</label>
              <div className="relative">
                <LockIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
              ENTRAR NO PAINEL
            </button>
            <button type="button" onClick={() => setMode('RECOVER')} className="w-full text-center text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400">Recuperar senha</button>
          </form>
        )}

        {mode === 'FIRST_ACCESS' && targetUser && (
          <form onSubmit={handleFirstAccess} className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-teal-500 italic uppercase">Crie sua Senha</h2>
              <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase">Defina o acesso para {targetUser.name}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Nova Senha</label>
                <div className="relative">
                  <LockIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 4 chars" className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Repetir Senha</label>
                <div className="relative">
                  <LockIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirme a senha" className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
              ATIVAR & ENTRAR
            </button>
          </form>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 opacity-30 grayscale">
          <ShieldIcon className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Criptografia Ômega Cloud</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
