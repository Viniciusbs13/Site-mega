
import React, { useState } from 'react';
import { Client, User, DefaultUserRole } from '../types';
import { MANAGERS } from '../constants';
import { Briefcase, TrendingUp, Pause, Play, Trash2, ShieldAlert, ChevronRight } from 'lucide-react';

interface SquadsViewProps {
  clients: Client[];
  currentUser: User;
  onAssignManager: (clientId: string, managerId: string) => void;
  onRemoveClient: (clientId: string) => void;
  onTogglePauseClient: (clientId: string) => void;
}

const SquadsView: React.FC<SquadsViewProps> = ({ clients, currentUser, onAssignManager, onRemoveClient, onTogglePauseClient }) => {
  const [view, setView] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const isCEO = currentUser.role === DefaultUserRole.CEO;

  const filteredClients = clients.filter(c => view === 'ACTIVE' ? !c.isPaused : c.isPaused);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-20 font-['General_Sans']">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <Briefcase className="w-6 h-6 text-[#14b8a6]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight italic uppercase leading-none text-gradient">Carteira Geral (CRM)</h2>
            <p className="text-[10px] md:text-[11px] font-medium text-white/40 uppercase tracking-[0.3em] mt-2">Protocolo de Alocação de Squads</p>
          </div>
        </div>

        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-full backdrop-blur-xl">
          <button 
            onClick={() => setView('ACTIVE')}
            className={`px-8 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'ACTIVE' ? 'bg-[#14b8a6] text-black shadow-[0_0_20px_rgba(20,184,166,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            Ativos ({clients.filter(c => !c.isPaused).length})
          </button>
          <button 
            onClick={() => setView('PAUSED')}
            className={`px-8 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'PAUSED' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            Pausados ({clients.filter(c => c.isPaused).length})
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className={`glass-card p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 group transition-all duration-500 border-white/10 ${client.isPaused ? 'grayscale opacity-60' : 'hover:border-[#14b8a6]/30 hover:bg-white/[0.04]'}`}>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-3.5 h-3.5 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'} ring-4 ring-black`} />
                <h4 className="text-2xl md:text-3xl font-bold text-white uppercase italic tracking-tighter group-hover:text-[#14b8a6] transition-colors">{client.name}</h4>
                {client.isPaused && (
                  <div className="bg-amber-500/10 text-amber-500 text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-amber-500/20">
                    Trabalho Congelado
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-8 text-[11px] text-white/40 font-bold uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2.5 text-[#14b8a6]"><TrendingUp className="w-4 h-4"/> R$ {client.contractValue.toLocaleString()}</span>
                <span className="flex items-center gap-2.5"><Briefcase className="w-4 h-4"/> {client.industry}</span>
                <span className="flex items-center gap-2.5">
                  <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-white group-hover:bg-[#14b8a6] transition-all duration-700" style={{ width: `${client.progress}%` }} />
                  </div>
                  {client.progress}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] ml-4">Squad Lead</label>
                <div className="relative">
                  <select 
                    disabled={!isCEO}
                    value={client.managerId}
                    onChange={(e) => onAssignManager(client.id, e.target.value)}
                    className="bg-black border border-white/10 rounded-full px-6 py-3.5 text-[11px] font-bold text-[#14b8a6] outline-none focus:border-[#14b8a6] transition-all w-64 disabled:opacity-50 appearance-none uppercase tracking-widest cursor-pointer hover:bg-white/5"
                  >
                    <option value="">Sem Gestor</option>
                    {MANAGERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {isCEO && (
                <div className="flex items-center gap-3 pt-6 md:pt-0">
                  <button 
                    onClick={() => onTogglePauseClient(client.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${client.isPaused ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'}`}
                    title={client.isPaused ? "Reativar Cliente" : "Pausar Cliente"}
                  >
                    {client.isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </button>
                  <button 
                    onClick={() => onRemoveClient(client.id)}
                    className="w-14 h-14 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="glass-card py-32 flex flex-col items-center justify-center text-center space-y-6 border-white/5">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-white/20">Nenhum cliente nesta visualização.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadsView;
