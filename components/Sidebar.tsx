
import React, { useState } from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { UserRole, User, DefaultUserRole } from '../types';
import { Settings, LogOut, RefreshCw, ShieldCheck, ShieldAlert, WifiOff, Cloud, CloudOff, Loader2, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  isSynced?: boolean;
  syncError?: string | null;
  isNetworkBlocked?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, currentUser, onLogout, 
  isSynced = false, syncError = null, isNetworkBlocked = false,
  isOpen, onClose
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const filteredNav = NAVIGATION_ITEMS.filter(item => (item.roles as string[]).includes(currentUser.role));

  const handleManualSync = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col h-full z-[70] transition-transform duration-300 ease-in-out font-inter
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#14b8a6] rounded-xl flex items-center justify-center shadow-[0_5px_20px_rgba(20,184,166,0.3)]">
              <span className="text-black font-black text-xl italic">Ω</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">OMEGA</h1>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest italic ${
                activeTab === item.id
                  ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20 shadow-[0_0_20px_rgba(20,184,166,0.05)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
              }`}
            >
              <span className={activeTab === item.id ? 'text-[#14b8a6]' : 'text-gray-600'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          {isNetworkBlocked ? (
            <div className="w-full flex flex-col gap-2 p-4 rounded-[24px] border bg-red-500/5 border-red-500/20">
               <div className="flex items-center gap-2">
                 <CloudOff className="w-4 h-4 text-red-500" />
                 <span className="text-[10px] font-black uppercase text-red-500">Offline</span>
               </div>
               <p className="text-[8px] text-gray-600 font-bold uppercase leading-tight">Sincronização desativada por bloqueio de rede.</p>
            </div>
          ) : (
            <div className={`flex flex-col gap-2 p-4 rounded-[24px] border transition-all duration-500 ${isSynced ? 'bg-teal-500/5 border-teal-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSynced ? <Cloud className="w-4 h-4 text-teal-500" /> : <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSynced ? 'text-teal-500' : 'text-yellow-500'}`}>
                    {isSynced ? 'Cloud Ativa' : 'Sincronizando'}
                  </span>
                </div>
                <button onClick={handleManualSync} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#111] border border-white/5 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] text-sm font-black border border-[#14b8a6]/20 italic shadow-inner">
              {currentUser.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-white uppercase truncate italic">{currentUser.name}</p>
              <p className="text-[8px] font-bold text-[#14b8a6]/60 uppercase tracking-widest truncate">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button 
            className="w-full flex items-center justify-center gap-3 px-3 py-3.5 text-red-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/5 border border-transparent hover:border-red-500/10" 
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
