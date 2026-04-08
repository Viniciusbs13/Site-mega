
import React, { useState } from 'react';
import { Client, User, DefaultUserRole } from '../types';
import { MANAGERS } from '../constants';
import { Briefcase, TrendingUp, Pause, Play, Trash2, ShieldAlert, Zap, Video, Camera, Share2, UserPlus } from 'lucide-react';

interface SquadsViewProps {
  clients: Client[];
  team: User[];
  currentUser: User;
  onAssignManager: (clientId: string, managerId: string) => void;
  onRemoveClient: (clientId: string) => void;
  onTogglePauseClient: (clientId: string) => void;
}

const SquadsView: React.FC<SquadsViewProps> = ({ clients, team, currentUser, onAssignManager, onRemoveClient, onTogglePauseClient }) => {
  const [view, setView] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const isCEO = currentUser.role === DefaultUserRole.CEO;

  const managers = team.filter(u => 
    u.role === DefaultUserRole.MANAGER || 
    u.role === DefaultUserRole.ACCOUNT ||
    u.role === DefaultUserRole.SOCIAL_MEDIA || 
    u.role === DefaultUserRole.EDITOR || 
    u.role === DefaultUserRole.CAPTADOR
  );

  const filteredClients = clients.filter(c => view === 'ACTIVE' ? !c.isPaused : c.isPaused);

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'META_ADS': return <Zap className="w-3 h-3 text-amber-400" title="Meta Ads" />;
      case 'EDICAO': return <Video className="w-3 h-3 text-blue-400" title="Edição" />;
      case 'CAPTACAO': return <Camera className="w-3 h-3 text-purple-400" title="Captação" />;
      case 'SOCIAL_MEDIA': return <Share2 className="w-3 h-3 text-pink-400" title="Social Media" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Carteira Geral (CRM)</h2>
          <p className="text-sm text-gray-400 font-medium">Controle total de status e alocação de squads.</p>
        </div>

        <div className="flex bg-[#111] border border-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setView('ACTIVE')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'ACTIVE' ? 'bg-[#14b8a6] text-black' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Ativos ({clients.filter(c => !c.isPaused).length})
          </button>
          <button 
            onClick={() => setView('PAUSED')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'PAUSED' ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Pausados ({clients.filter(c => c.isPaused).length})
          </button>
        </div>
      </header>

      {isCEO && clients.some(c => !c.managerId && !c.isPaused) && (
        <div className="bg-teal-500/5 border border-teal-500/20 rounded-[32px] p-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-black">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase italic">Novos Clientes Aguardando Squad</p>
              <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest">Existem {clients.filter(c => !c.managerId && !c.isPaused).length} contratos sem gestor definido.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className={`bg-[#111] border rounded-[40px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group transition-all ${client.isPaused ? 'border-amber-500/20 grayscale opacity-70' : 'border-white/5 hover:border-teal-500/20 shadow-2xl shadow-black/40'}`}>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                <div>
                  <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{client.name}</h4>
                  <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">{client.planName || 'Plano não definido'}</p>
                </div>
                {client.isPaused && <span className="bg-amber-500/10 text-amber-500 text-[8px] px-2 py-0.5 rounded font-black uppercase">Trabalho Congelado</span>}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {isCEO && <span className="flex items-center gap-2 text-teal-500"><TrendingUp className="w-3 h-3"/> R$ {client.contractValue.toLocaleString()}</span>}
                <span className="flex items-center gap-2"><Briefcase className="w-3 h-3"/> {client.industry}</span>
                {client.videoQuantity !== undefined && client.videoQuantity > 0 && (
                  <span className="flex items-center gap-2 text-blue-400"><Video className="w-3 h-3"/> {client.videoQuantity} Vídeos</span>
                )}
                <span>Progresso: {client.progress}%</span>
                
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <span className="text-[8px] text-gray-400 mr-1">Serviços:</span>
                  {client.services && client.services.length > 0 ? (
                    client.services.map(s => (
                      <div key={s} className="flex items-center gap-1">
                        {getServiceIcon(s)}
                      </div>
                    ))
                  ) : (
                    <span className="text-[8px] italic lowercase">nenhum</span>
                  )}
                </div>

                {client.services?.includes('META_ADS') ? (
                  <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded text-[8px] font-black">
                    <Zap className="w-2 h-2" /> REQUER GESTOR
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-1 rounded text-[8px] font-black">
                    <UserPlus className="w-2 h-2" /> REQUER ACCOUNT
                  </span>
                )}

                {!client.managerId && (
                  <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded text-[8px] font-black animate-pulse">
                    <ShieldAlert className="w-2 h-2" /> SEM GESTOR DEFINIDO
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1 block">Squad Lead</label>
                <select 
                  disabled={!isCEO}
                  value={client.managerId}
                  onChange={(e) => onAssignManager(client.id, e.target.value)}
                  className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-[#14b8a6] outline-none focus:border-teal-500 transition-all w-52 disabled:opacity-50"
                >
                  <option value="">Sem Gestor</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {isCEO && (
                <div className="flex items-center gap-2 pt-4">
                  <button 
                    onClick={() => onTogglePauseClient(client.id)}
                    className={`p-4 rounded-xl transition-all ${client.isPaused ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                    title={client.isPaused ? "Reativar Cliente" : "Pausar Cliente"}
                  >
                    {client.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => onRemoveClient(client.id)}
                    className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
            <ShieldAlert className="w-16 h-16" />
            <p className="text-sm font-black uppercase tracking-[0.3em]">Nenhum cliente nesta visualização.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadsView;
