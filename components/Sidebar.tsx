
import React, { useState, useEffect } from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { UserRole, User, DefaultUserRole } from '../types';
import { Settings, LogOut, RefreshCw, ShieldCheck, ShieldAlert, WifiOff, Cloud, CloudOff, Loader2, X, Check, Lock } from 'lucide-react';

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
  team: User[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, currentUser, onLogout, 
  isSynced = false, syncError = null, isNetworkBlocked = false,
  isOpen, onClose, team
}) => {
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const filteredNav = NAVIGATION_ITEMS.filter(item => (item.roles as string[]).includes(currentUser.role));

  const activeUsers = team.filter(u => 
    u.isActive && 
    u.lastActive && 
    (new Date().getTime() - new Date(u.lastActive).getTime() < 120000)
  );

  useEffect(() => {
    if (isSynced) {
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [isSynced]);

  const handleManualSync = () => {
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
        fixed md:relative inset-y-0 left-0 w-72 bg-black/20 backdrop-blur-xl border-r border-white/5 flex flex-col h-full z-[70] transition-transform duration-300 ease-in-out font-['General_Sans']
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#14b8a6] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(20,184,166,0.3)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="text-black font-black text-2xl italic relative z-10">Ω</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-white uppercase italic text-gradient">OMEGA</h1>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-full transition-all text-[12px] font-medium uppercase tracking-widest ${
                activeTab === item.id
                  ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span className={activeTab === item.id ? 'text-[#14b8a6]' : 'text-white/20'}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Seção Online */}
          {activeUsers.length > 0 && (
            <div className="mt-8 px-4 py-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Operadores Online ({activeUsers.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeUsers.map(u => (
                  <div key={u.id} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-teal-500 italic" title={u.name}>
                    {u.name[0]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4 bg-black/40 backdrop-blur-md">
          <div className="px-5 py-3 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
            <Lock className="w-3.5 h-3.5 text-[#14b8a6]" />
            <span className="text-[9px] font-medium text-white/60 uppercase tracking-[0.2em]">Security Protocol v2.4</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-4 flex items-center gap-4 group hover:bg-white/10 transition-all duration-500">
            <div className="w-12 h-12 rounded-full bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] text-lg font-bold border border-[#14b8a6]/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
              <span className="relative z-10">{currentUser.name[0]}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-white uppercase truncate tracking-wider">{currentUser.name}</p>
              <p className="text-[9px] font-medium text-[#14b8a6] uppercase tracking-widest truncate opacity-70">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button 
            className="w-full flex items-center justify-center gap-3 px-3 py-4 text-white/40 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-500/10 border border-transparent hover:border-red-500/20" 
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
