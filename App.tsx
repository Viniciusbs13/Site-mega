
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, DefaultUserRole, Client, Task, User, MonthlyData, ClientStatus, SalesGoal, ChatMessage, ClientHealth, DriveItem } from './types';
import { INITIAL_CLIENTS, NAVIGATION_ITEMS, MANAGERS, MONTHS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SquadsView from './components/SquadsView';
import ChecklistView from './components/ChecklistView';
import ManagerWorkspace from './components/ManagerWorkspace';
import TeamView from './components/TeamView';
import SalesView from './components/SalesView';
import WikiView from './components/WikiView';
import Auth from './components/Auth';
import { dbService } from './services/database';
import { Hash, Loader2, ShieldCheck, X } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [chatInput, setChatInput] = useState('');

  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  
  const CEO_DEFAULT: User = { 
    id: 'ceo-master', 
    name: 'Diretoria Ômega', 
    email: 'assessoriaomega1@gmail.com', 
    password: 'admin', 
    role: DefaultUserRole.CEO, 
    isActive: true 
  };

  const [team, setTeam] = useState<User[]>([CEO_DEFAULT]);
  
  const [db, setDb] = useState<MonthlyData>({
    [monthKey]: {
      clients: INITIAL_CLIENTS,
      tasks: [],
      salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: 'https://seulink.com/onboarding' },
      chatMessages: [],
      drive: [],
      wiki: []
    }
  });

  const syncToCloud = useCallback(async () => {
    if (isLoading) return;
    const result = await dbService.saveState({ team, availableRoles, db });
    setIsSynced(result.success);
    setIsNetworkBlocked(!!result.isNetworkBlock);
    setSyncError(result.error || null);
  }, [team, availableRoles, db, isLoading]);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const diag = await dbService.diagnoseConnection();
        setIsNetworkBlocked(diag.status === 'BLOCKED');
        
        const saved = await dbService.loadState();
        if (saved) {
          const otherMembers = (saved.team || []).filter(u => u.email.toLowerCase() !== CEO_DEFAULT.email.toLowerCase());
          setTeam([CEO_DEFAULT, ...otherMembers]);
          setAvailableRoles(saved.availableRoles || Object.values(DefaultUserRole));
          setDb(saved.db);
          setIsSynced(diag.status === 'CONNECTED');
        }
      } catch (err) {
        setTeam([CEO_DEFAULT]);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Delay maior se estiver bloqueado para não floodar o console
      const delay = isNetworkBlocked ? 10000 : 2000;
      const saveTimeout = setTimeout(syncToCloud, delay);
      return () => clearTimeout(saveTimeout);
    }
  }, [team, availableRoles, db, isLoading, syncToCloud, isNetworkBlocked]);

  useEffect(() => {
    // Tenta reconectar a cada 60s se estiver bloqueado, ou 30s se for erro genérico
    const intervalTime = isNetworkBlocked ? 60000 : 30000;
    const interval = setInterval(async () => {
      if (!isSynced) {
        const diag = await dbService.diagnoseConnection();
        setIsNetworkBlocked(diag.status === 'BLOCKED');
        if (diag.status === 'CONNECTED') syncToCloud();
      }
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isSynced, syncToCloud, isNetworkBlocked]);

  const handleUpdateTeamMember = (updatedUser: User) => {
    setTeam(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-[#14b8a6] rounded-2xl flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(20,184,166,0.3)]">
          <span className="text-black font-black text-3xl">Ω</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 text-teal-500 font-black uppercase tracking-[0.3em] text-[10px]">
            <Loader2 className="w-4 h-4 animate-spin" /> Sincronizando Core Ômega
          </div>
        </div>
      </div>
    );
  }

  const currentData = db[selectedMonth] || { 
    clients: [], tasks: [], 
    salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: 'https://seulink.com/onboarding', salesNotes: '' }, 
    chatMessages: [], drive: [], wiki: []
  };

  const updateCurrentMonthData = (updates: Partial<MonthlyData[string]>) => {
    setDb(prev => ({ ...prev, [selectedMonth]: { ...currentData, ...updates } }));
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard clients={currentData.clients.filter(c => !c.isPaused)} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
      case 'team': return <TeamView team={team} currentUser={currentUser} availableRoles={availableRoles} onUpdateRole={(id, r) => setTeam(prev => prev.map(u => u.id === id ? { ...u, role: r } : u))} onAddMember={(name, role, email) => { const exists = team.some(u => u.email.toLowerCase() === email.toLowerCase()); if(exists) return alert("Email já cadastrado"); setTeam(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, email: email.toLowerCase(), role, isActive: true }]); }} onRemoveMember={(id) => id !== 'ceo-master' && setTeam(prev => prev.filter(u => u.id !== id))} onAddRole={(role) => setAvailableRoles([...availableRoles, role])} onToggleActive={(id) => setTeam(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))} />;
      case 'commercial': return <SalesView goal={currentData.salesGoal} team={team} clients={currentData.clients} currentUser={currentUser} onUpdateGoal={u => updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, ...u } })} onRegisterSale={(uid, val, cname) => { setTeam(prev => prev.map(usr => usr.id === uid ? { ...usr, salesVolume: (usr.salesVolume || 0) + val } : usr)); const newClient: Client = { id: Math.random().toString(36).substr(2,9), name: cname, industry: 'Novo Contrato', health: 'Estável', progress: 0, managerId: '', salesId: uid, contractValue: val, statusFlag: 'GREEN', isPaused: false, folder: { briefing: '', accessLinks: '', operationalHistory: '' } }; updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, currentValue: currentData.salesGoal.currentValue + val, totalSales: currentData.salesGoal.totalSales + 1 }, clients: [...currentData.clients, newClient] }); }} onUpdateUserGoal={(id, pg, sg) => setTeam(prev => prev.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u))} onUpdateClientNotes={(cid, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) })} />;
      case 'checklists': return <ChecklistView tasks={currentData.tasks} currentUser={currentUser} onAddTask={t => updateCurrentMonthData({ tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentData.tasks] })} onRemoveTask={id => updateCurrentMonthData({ tasks: currentData.tasks.filter(t => t.id !== id) })} />;
      case 'my-workspace': return <ManagerWorkspace managerId={currentUser.id} clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={items => updateCurrentMonthData({ drive: items })} onToggleTask={id => updateCurrentMonthData({ tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) })} onUpdateNotes={(id, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, notes: n } : c) })} onUpdateStatusFlag={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) })} onUpdateFolder={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) })} />;
      case 'clients': return <SquadsView clients={currentData.clients} currentUser={currentUser} onAssignManager={(cid, mid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, managerId: mid } : c) })} onRemoveClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.filter(c => c.id !== cid) })} onTogglePauseClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) })} />;
      case 'notes': return <WikiView wiki={currentData.wiki || []} currentUser={currentUser} onUpdateWiki={items => updateCurrentMonthData({ wiki: items })} />;
      case 'chat': return (
        <div className="flex flex-col h-full max-w-[1000px] mx-auto">
           <header className="mb-8 flex justify-between items-center px-4"><h2 className="text-3xl font-black text-white italic uppercase flex items-center gap-3"><Hash className="w-8 h-8 text-teal-500" /> Comunicação Interna</h2></header>
           <div className="flex-1 bg-[#111] border border-white/5 rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex-1 p-8 overflow-y-auto space-y-4">
                {(currentData.chatMessages || []).map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-gray-600 uppercase mb-1">{msg.senderName}</span>
                    <div className={`px-5 py-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-bold' : 'bg-white/5 text-white border border-white/5'}`}>{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (()=>{if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: new Date().toISOString() }] }); setChatInput('');})()} placeholder="Escreva para o time..." className="flex-1 bg-black rounded-2xl px-6 py-4 text-white outline-none border border-white/5 focus:border-teal-500/50 transition-all" />
                <button onClick={() => {if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: new Date().toISOString() }] }); setChatInput('');}} className="bg-teal-500 px-8 rounded-2xl text-black font-black hover:scale-105 transition-all">ENVIAR</button>
              </div>
           </div>
        </div>
      );
      default: return null;
    }
  };

  if (!currentUser) return <Auth team={team} onLogin={setCurrentUser} onUpdateUser={handleUpdateTeamMember} />;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden font-inter">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        currentUser={currentUser} onLogout={() => setCurrentUser(null)} 
        isSynced={isSynced} syncError={syncError} isNetworkBlocked={isNetworkBlocked}
      />
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto p-12 custom-scrollbar">{renderContent()}</div>
        <div className="fixed top-[-100px] right-[-100px] w-[700px] h-[700px] bg-[#14b8a6]/5 blur-[180px] rounded-full pointer-events-none -z-10"></div>
      </main>
    </div>
  );
};

export default App;
