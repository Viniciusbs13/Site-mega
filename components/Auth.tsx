
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Mail, Lock, UserCircle, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

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

  const handleInitialCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = team.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      setError('Acesso não autorizado. Entre em contato com a diretoria para ser cadastrado.');
      return;
    }

    if (!user.isActive) {
      setError('Seu acesso está suspenso temporariamente.');
      return;
    }

    if (!user.password) {
      setTargetUser(user);
      setMode('FIRST_ACCESS');
    } else {
      setTargetUser(user);
      setMode('LOGIN');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetUser && targetUser.password === password) {
      onLogin(targetUser);
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  const handleFirstAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (targetUser) {
      const updated = { ...targetUser, password };
      onUpdateUser(updated);
      onLogin(updated);
    }
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    const user = team.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setTargetUser(user);
      setMode('RESET_PASSWORD');
      setError('');
    } else {
      setError('Email não encontrado em nossa base de dados.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-[480px] bg-[#111] border border-white/5 rounded-[48px] p-12 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#14b8a6] rounded-2xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(20,184,166,0.3)]">
            <span className="text-black font-black text-3xl">Ω</span>
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">OMEGA WORKSPACE</h1>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Sistema de Gestão de Alta Performance</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* MODO: LOGIN INICIAL (Apenas Email) */}
        {mode === 'LOGIN' && !targetUser && (
          <form onSubmit={handleInitialCheck} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Identificação de Acesso</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
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
              CONTINUAR <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODO: LOGIN COM SENHA */}
        {mode === 'LOGIN' && targetUser && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-500 font-bold">
                {targetUser.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-gray-500 uppercase">Bem-vindo de volta,</p>
                <p className="text-sm font-bold text-white truncate">{targetUser.name}</p>
              </div>
              <button type="button" onClick={() => { setTargetUser(null); setPassword(''); }} className="ml-auto text-[9px] font-black text-teal-500 hover:underline">ALTERAR</button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Sua Senha</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
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
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
              ACESSAR DASHBOARD
            </button>
            <button type="button" onClick={() => setMode('RECOVER')} className="w-full text-center text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400">Esqueci minha senha</button>
          </form>
        )}

        {/* MODO: PRIMEIRO ACESSO (Definir Senha) */}
        {mode === 'FIRST_ACCESS' && targetUser && (
          <form onSubmit={handleFirstAccess} className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-teal-500 italic uppercase italic leading-tight">Primeiro Acesso</h2>
              <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase">Defina uma senha segura para {targetUser.name}.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
              ATIVAR CONTA & ENTRAR
            </button>
          </form>
        )}

        {/* MODO: RECUPERAR SENHA (Passo 1: Email) */}
        {mode === 'RECOVER' && (
          <form onSubmit={handleRecover} className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white italic uppercase italic leading-tight">Recuperar Senha</h2>
              <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase">Confirme seu email para redefinir o acesso.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Email Cadastrado</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
              </div>
            </div>
            <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">VERIFICAR IDENTIDADE</button>
            <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-center text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400">Voltar ao Login</button>
          </form>
        )}

        {/* MODO: RESETAR SENHA (Passo 2: Nova Senha) */}
        {mode === 'RESET_PASSWORD' && targetUser && (
          <form onSubmit={handleFirstAccess} className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white italic uppercase italic leading-tight">Nova Senha</h2>
              <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase">Usuário identificado: {targetUser.name}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Senha Nova</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500/50 transition-all" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-teal-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">SALVAR & ACESSAR</button>
          </form>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 opacity-30 grayscale">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Criptografia Militar Ômega</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
