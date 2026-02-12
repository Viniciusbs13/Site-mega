
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { UserRole, User, DefaultUserRole } from '../types';
import { Settings, LogOut, RefreshCw, ShieldCheck, ShieldAlert, WifiOff } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  isSynced?: boolean;
  syncError?: string | null;
  isNetworkBlocked?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, currentUser, onLogout, 
  isSynced = false, syncError = null, isNetworkBlocked = false 
}) => {
  const filteredNav = NAVIGATION_ITEMS.filter(item => (item.roles as string[]).includes(currentUser.role));

  const showFixHelp = () => {
    alert(
      "🛡️ OMEGA LOCAL-FIRST ENGINE\n\n" +
      "Seu navegador possui um bloqueador (AdBlock/VPN) que impede a conexão com a Nuvem Supabase.\n\n" +
      "✅ FIQUE TRANQUILO:\n" +
      "Seus dados estão sendo salvos com segurança NESTA MÁQUINA.\n\n" +
      "💡 COMO ATIVAR A NUVEM:\n" +
      "1. Clique no ícone do seu AdBlocker.\n" +
      "2. Selecione 'Pausar/Desativar neste site'.\n" +
      "3. Recarregue a página."
    );
  };

  return (
    <aside className="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#14b8a6] rounded-lg flex items-center justify-center shadow-[0_5px_15px_rgba(20,184,166,0.3)]">
            <span className="text-black font-black text-lg">Ω</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">OMEGA</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-sm font-bold uppercase tracking-tighter italic ${
              activeTab === item.id
                ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        {isNetworkBlocked ? (
          <button 
            onClick={showFixHelp}
            className="w-full flex flex-col gap-2 p-4 rounded-2xl border bg-teal-500/5 border-teal-500/20 hover:bg-teal-500/10 transition-all text-left"
          >
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-teal-500" />
                 <span className="text-[10px] font-black uppercase text-teal-500">Backup Local Ativo</span>
               </div>
               <WifiOff className="w-3 h-3 text-gray-600" />
            </div>
            <p className="text-[8px] text-gray-500 font-bold leading-tight uppercase">
              Nuvem bloqueada por extensão. Dados protegidos localmente.
            </p>
          </button>
        ) : (
          <div className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-500 ${isSynced ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isSynced ? 'text-green-500' : 'text-yellow-500'}`}>
                  {isSynced ? 'Nuvem Ativa' : 'Sincronizando'}
                </span>
              </div>
              <button onClick={() => window.location.reload()} className="p-1 hover:bg-white/10 rounded-lg text-gray-500">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#111] border border-white/5 rounded-2xl p-4 shadow-xl">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] text-xs font-black border border-[#14b8a6]/20">
                {currentUser.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-white uppercase truncate">{currentUser.name}</p>
                <p className="text-[8px] font-bold text-[#14b8a6] uppercase tracking-widest truncate opacity-60">{currentUser.role.replace('_', ' ')}</p>
              </div>
           </div>
        </div>

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:text-red-400 transition-colors text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500/5" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
