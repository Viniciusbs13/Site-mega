
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Central de Comando</h2>
          <p className="text-sm text-gray-400 font-medium">Gestão hierárquica e controle de acessos ativos.</p>
        </div>
        
        {isCEO && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAddingRole(true)}
              className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <ShieldPlus className="w-4 h-4 text-purple-400" /> Nova Função
            </button>
            <button 
              onClick={() => setIsAddingMember(true)}
              className="bg-[#14b8a6] px-6 py-3 rounded-2xl text-[10px] font-black text-black uppercase hover:scale-105 transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(20,184,166,0.3)]"
            >
              <UserPlus className="w-4 h-4" /> Admitir Colaborador
            </button>
          </div>
        )}
      </header>

      {/* MODAL ADICIONAR COLABORADOR */}
      {isAddingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-200">
          <form onSubmit={handleAddMember} className="bg-[#111] border border-white/10 p-10 rounded-[48px] w-full max-w-md space-y-6 shadow-2xl relative">
            <button type="button" onClick={() => setIsAddingMember(false)} className="absolute right-8 top-8 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full"><X /></button>
            
            <div className="text-center">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Novo Acesso Ω</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">O link de acesso será válido após o cadastro</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome Completo</label>
                <div className="relative">
                  <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input 
                    required 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-[#14b8a6] transition-all" 
                    placeholder="Ex: Lucas Silva" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 text-teal-500">Email de Acesso (Login)</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
                  <input 
                    required 
                    type="email" 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    className="w-full bg-black border border-teal-500/20 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-teal-500 transition-all shadow-[0_0_20px_rgba(20,184,166,0.05)]" 
                    placeholder="Ex: lucas@omega.com" 
                  />
                </div>
                <p className="text-[9px] text-gray-600 font-medium ml-2 italic">Este será o usuário que ele usará para logar.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Função Estratégica</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <select 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value)} 
                    className="w-full bg-black border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none appearance-none cursor-pointer"
                  >
                    {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20">
              LIBERAR ACESSO NO SISTEMA
            </button>
          </form>
        </div>
      )}

      {/* MODAL NOVA FUNÇÃO */}
      {isAddingRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <form onSubmit={handleAddRole} className="bg-[#111] border border-white/10 p-10 rounded-[48px] w-full max-w-md space-y-6 shadow-2xl relative">
            <button type="button" onClick={() => setIsAddingRole(false)} className="absolute right-8 top-8 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full"><X /></button>
            <h3 className="text-2xl font-black text-white uppercase italic">Criar Nível de Acesso</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Nome da Função</label>
                <input required value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-purple-500" placeholder="Ex: Designer Sênior" />
              </div>
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">ESTABELECER FUNÇÃO</button>
          </form>
        </div>
      )}

      {/* LISTA DE EQUIPE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {team.map((member) => (
          <div key={member.id} className={`bg-[#111] border rounded-[40px] p-8 transition-all group relative overflow-hidden flex flex-col ${!member.isActive ? 'opacity-40 grayscale' : 'border-white/5 hover:border-[#14b8a6]/20'}`}>
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${member.isActive ? 'bg-teal-500/10 border-teal-500/20 text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.1)]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <span className="text-xl font-black">{member.name[0]}</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg uppercase tracking-tighter italic leading-none">{member.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <AtSign className="w-3 h-3 text-teal-500/50" />
                    <span className="text-[10px] text-gray-400 font-bold lowercase truncate max-w-[150px]">{member.email}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${member.isActive ? 'bg-teal-500/10 text-teal-500' : 'bg-red-500/10 text-red-500'}`}>
                      {member.isActive ? 'Ativo' : 'Suspenso'}
                    </span>
                  </div>
                </div>
              </div>
              
              {isCEO && member.role !== DefaultUserRole.CEO && (
                <div className="flex gap-2">
                   <button 
                    onClick={() => onToggleActive(member.id)}
                    className={`p-3 rounded-xl transition-all ${member.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                    title={member.isActive ? "Suspender Acesso" : "Reativar Acesso"}
                  >
                    {member.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => { if(confirm(`Excluir permanentemente ${member.name}?`)) onRemoveMember(member.id); }}
                    className="p-3 bg-white/5 text-gray-600 hover:text-white hover:bg-red-600 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-3 h-3" /> Nível Operacional
                </label>
                {isCEO ? (
                  <select 
                    value={member.role}
                    onChange={(e) => onUpdateRole(member.id, e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-2xl px-4 py-4 text-xs font-bold text-teal-400 outline-none focus:border-teal-500 transition-all cursor-pointer shadow-inner"
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ')}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-xs font-bold text-gray-500 uppercase italic">
                    {member.role.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamView;
