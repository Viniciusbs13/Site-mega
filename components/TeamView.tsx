
import React, { useState } from 'react';
import { User, UserRole, DefaultUserRole } from '../types';
import { Mail, ShieldCheck, UserCog, UserPlus, Trash2, ShieldPlus, X, Power, PowerOff, AtSign } from 'lucide-react';

interface TeamViewProps {
  team: User[];
  currentUser: User;
  availableRoles: string[];
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onAddMember: (name: string, role: UserRole, email: string) => void;
  onRemoveMember: (userId: string) => void;
  onAddRole: (roleName: string) => void;
  onToggleActive: (userId: string) => void;
}

const TeamView: React.FC<TeamViewProps> = ({ 
  team, currentUser, availableRoles, onUpdateRole, onAddMember, onRemoveMember, onAddRole, onToggleActive 
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(DefaultUserRole.MANAGER);
  const [newRoleName, setNewRoleName] = useState('');

  const isCEO = currentUser.role === DefaultUserRole.CEO;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert("Por favor, preencha nome e email.");
      return;
    }
    onAddMember(newName, newRole, newEmail);
    setNewName('');
    setNewEmail('');
    setIsAddingMember(false);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    onAddRole(newRoleName.toUpperCase().replace(/\s+/g, '_'));
    setNewRoleName('');
    setIsAddingRole(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-32 font-['General_Sans']">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <ShieldCheck className="w-6 h-6 text-[#14b8a6]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight italic uppercase leading-none text-gradient">Central de Comando</h2>
            <p className="text-[10px] md:text-[11px] font-medium text-white/40 uppercase tracking-[0.3em] mt-2">Gestão hierárquica e controle de acessos ativos.</p>
          </div>
        </div>
        
        {isCEO && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAddingRole(true)}
              className="bg-white/5 border border-white/10 px-8 py-4 rounded-full text-[11px] font-bold text-white uppercase hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-xl"
            >
              <ShieldPlus className="w-4.5 h-4.5 text-purple-400" /> NOVA FUNÇÃO
            </button>
            <button 
              onClick={() => setIsAddingMember(true)}
              className="flex items-center justify-center gap-3 px-10 py-4 bg-white text-black rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl"
            >
              <UserPlus className="w-5 h-5" /> ADMITIR COLABORADOR
            </button>
          </div>
        )}
      </header>

      {/* MODAL ADICIONAR COLABORADOR */}
      {isAddingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-8 animate-in fade-in zoom-in duration-500">
          <form onSubmit={handleAddMember} className="w-full max-w-md glass-card p-12 space-y-10 border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between">
               <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white italic uppercase tracking-tighter text-gradient">Novo Acesso Ω</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">O link de acesso será enviado por e-mail.</p>
               </div>
               <button type="button" onClick={() => setIsAddingMember(false)} className="p-3 text-white/20 hover:text-white bg-white/5 rounded-full transition-all">
                 <X className="w-6 h-6" />
               </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Nome Completo</label>
                <div className="relative">
                  <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                  <input 
                    required 
                    placeholder="Nome do colaborador"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full px-16 py-5 text-sm text-white outline-none focus:border-[#14b8a6] transition-all placeholder:text-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                  <input 
                    required 
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full px-16 py-5 text-sm text-white outline-none focus:border-[#14b8a6] transition-all placeholder:text-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Função Estratégica</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                  <select 
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white/5 border border-white/10 rounded-full px-16 py-5 text-sm text-white outline-none focus:border-[#14b8a6] transition-all appearance-none cursor-pointer"
                  >
                    {availableRoles.map(r => <option key={r} value={r} className="bg-[#0a0a0a]">{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-6 bg-white text-black font-bold uppercase text-sm rounded-full tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl mt-4"
              >
                LIBERAR ACESSO NO SISTEMA
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NOVA FUNÇÃO */}
      {isAddingRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-8 animate-in fade-in zoom-in duration-500">
          <form onSubmit={handleAddRole} className="w-full max-w-md glass-card p-12 space-y-10 border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between">
               <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white italic uppercase tracking-tighter text-gradient">Nova Função</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Defina um novo nível operacional na hierarquia.</p>
               </div>
               <button type="button" onClick={() => setIsAddingRole(false)} className="p-3 text-white/20 hover:text-white bg-white/5 rounded-full transition-all">
                 <X className="w-6 h-6" />
               </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Nome da Função</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                  <input 
                    required 
                    placeholder="Ex: Gerente de Projetos"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full px-16 py-5 text-sm text-white outline-none focus:border-[#14b8a6] transition-all placeholder:text-white/10"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-6 bg-white text-black font-bold uppercase text-sm rounded-full tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl mt-4"
              >
                CRIAR NÍVEL ESTRATÉGICO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE EQUIPE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {team.map(member => (
          <div key={member.id} className={`glass-card p-10 space-y-8 relative group overflow-hidden border-white/10 hover:border-[#14b8a6]/20 transition-all ${!member.isActive ? 'opacity-40 grayscale' : ''}`}>
            <div className="flex items-start justify-between">
              <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center text-3xl font-bold italic shadow-2xl backdrop-blur-xl group-hover:scale-110 transition-transform duration-500 ${member.isActive ? 'bg-[#14b8a6]/10 border-[#14b8a6]/20 text-[#14b8a6]' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                {member.name[0]}
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border ${member.role === DefaultUserRole.CEO ? 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                  {member.role.replace('_', ' ')}
                </span>
                {isCEO && member.role !== DefaultUserRole.CEO && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onToggleActive(member.id)}
                      className={`p-3 rounded-xl transition-all ${member.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                    >
                      {member.isActive ? <PowerOff className="w-4.5 h-4.5" /> : <Power className="w-4.5 h-4.5" />}
                    </button>
                    <button onClick={() => { if(confirm(`Excluir permanentemente ${member.name}?`)) onRemoveMember(member.id); }} className="p-3 text-white/10 hover:text-red-500 transition-all bg-white/5 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20">
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter text-gradient leading-none">{member.name}</h3>
                {member.isActive && member.lastActive && (new Date().getTime() - new Date(member.lastActive).getTime() < 120000) && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                )}
              </div>
              <p className="text-[11px] text-white/30 font-medium tracking-tight break-all">{member.email}</p>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em]">Nível Operacional</span>
                    {isCEO && member.role !== DefaultUserRole.CEO ? (
                      <select 
                        value={member.role}
                        onChange={(e) => onUpdateRole(member.id, e.target.value as UserRole)}
                        className="bg-transparent text-xs font-bold text-[#14b8a6] uppercase mt-1 italic outline-none cursor-pointer hover:text-white transition-colors"
                      >
                        {availableRoles.map(role => (
                          <option key={role} value={role} className="bg-[#0a0a0a]">{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-bold text-white/60 uppercase mt-1 italic">{member.role.replace('_', ' ')}</span>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white/20" />
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamView;
