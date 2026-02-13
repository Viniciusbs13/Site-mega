
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Hash, Loader2, Menu, X, Bell } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);
  
  // Tenta recuperar o usuário salvo para evitar logout no refresh
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omega_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [chatInput, setChatInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const skipSyncRef = useRef(false);

  const syncToCloud = useCallback(async (stateToSave?: any) => {
    if (isLoading || skipSyncRef.current || !currentUser) return;
    
    const data = stateToSave || { team, availableRoles, db };
    const result = await dbService.saveState(data);
    
    setIsSynced(result.success);
    setIsNetworkBlocked(!!result.isNetworkBlock);
    setSyncError(result.error || null);
  }, [team, availableRoles, db, isLoading, currentUser]);

  const loadEverything = async () => {
    const diag = await dbService.diagnoseConnection();
    setIsNetworkBlocked(diag.status === 'BLOCKED');
    
    const saved = await dbService.loadState();
    if (saved) {
      skipSyncRef.current = true;
      const otherMembers = (saved.team || []).filter(u => u.email.toLowerCase() !== CEO_DEFAULT.email.toLowerCase());
      setTeam([CEO_DEFAULT, ...otherMembers]);
      setAvailableRoles(saved.availableRoles || Object.values(DefaultUserRole));
      setDb(saved.db);
      setIsSynced(diag.status === 'CONNECTED');
      setTimeout(() => { skipSyncRef.current = false; }, 1000);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await loadEverything();
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isLoading && !skipSyncRef.current && currentUser) {
      const delay = isNetworkBlocked ? 30000 : 5000;
      const saveTimeout = setTimeout(() => syncToCloud(), delay);
      return () => clearTimeout(saveTimeout);
    }
  }, [team, availableRoles, db, isLoading, syncToCloud, isNetworkBlocked, currentUser]);

  const handleLogin = (u: User) => {
    localStorage.setItem('omega_session_user', JSON.stringify(u));
    setCurrentUser(u);
    loadEverything();
  };

  const handleLogout = () => {
    localStorage.removeItem('omega_session_user');
    setCurrentUser(null);
  };

  const handleUpdateTeamMember = (updatedUser: User) => {
    const newTeam = team.map(u => u.id === updatedUser.id ? updatedUser : u);
    setTeam(newTeam);
    syncToCloud({ team: newTeam, availableRoles, db });
  };

  const updateCurrentMonthData = (updates: Partial<MonthlyData[string]>) => {
    const newDb = { ...db, [selectedMonth]: { ...(db[selectedMonth] || {}), ...updates } };
    setDb(newDb);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 font-inter p-6">
        <div className="w-20 h-20 bg-[#14b8a6] rounded-3xl flex items-center justify-center animate-pulse shadow-[0_0_60px_rgba(20,184,166,0.4)]">
          <span className="text-black font-black text-4xl">Ω</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3 text-teal-500 font-black uppercase tracking-[0.4em] text-[11px] italic">
            <Loader2 className="w-5 h-5 animate-spin" /> Sincronizando Workspace
          </div>
          <p className="text-gray-700 text-[10px] font-bold uppercase tracking-widest">Aguarde a conexão segura...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Auth team={team} onLogin={handleLogin} onUpdateUser={handleUpdateTeamMember} />;

  const currentData = db[selectedMonth] || { 
    clients: [], tasks: [], 
    salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: 'https://seulink.com/onboarding' }, 
    chatMessages: [], drive: [], wiki: []
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden font-inter relative">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#14b8a6] rounded-lg flex items-center justify-center text-black font-black italic">Ω</div>
          <span className="text-sm font-black uppercase tracking-widest text-white italic">Omega</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg text-teal-500">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        isSynced={isSynced} 
        syncError={syncError} 
        isNetworkBlocked={isNetworkBlocked}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto p-4 md:p-12 custom-scrollbar">
          {(() => {
            try {
              switch (activeTab) {
                case 'dashboard': return <Dashboard clients={currentData.clients.filter(c => !c.isPaused)} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
                case 'team': return <TeamView team={team} currentUser={currentUser} availableRoles={availableRoles} onUpdateRole={(id, r) => { const next = team.map(u => u.id === id ? { ...u, role: r } : u); setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} onAddMember={(name, role, email) => { const next = [...team, { id: Date.now().toString(), name, email: email.toLowerCase(), role, isActive: true }]; setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} onRemoveMember={(id) => { if(id === 'ceo-master') return; const next = team.filter(u => u.id !== id); setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} onAddRole={(role) => { const next = [...availableRoles, role]; setAvailableRoles(next); syncToCloud({ team, availableRoles: next, db }); }} onToggleActive={(id) => { const next = team.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u); setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} />;
                case 'commercial': return <SalesView goal={currentData.salesGoal} team={team} clients={currentData.clients} currentUser={currentUser} onUpdateGoal={u => updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, ...u } })} onRegisterSale={(uid, val, cname) => { setTeam(prev => prev.map(usr => usr.id === uid ? { ...usr, salesVolume: (usr.salesVolume || 0) + val } : usr)); const newClient: Client = { id: Date.now().toString(), name: cname, industry: 'Novo Contrato', health: 'Estável', progress: 0, managerId: '', salesId: uid, contractValue: val, statusFlag: 'GREEN', isPaused: false, folder: { briefing: '', accessLinks: '', operationalHistory: '' } }; updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, currentValue: currentData.salesGoal.currentValue + val, totalSales: currentData.salesGoal.totalSales + 1 }, clients: [...currentData.clients, newClient] }); }} onUpdateUserGoal={(id, pg, sg) => setTeam(prev => prev.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u))} onUpdateClientNotes={(cid, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) })} />;
                case 'checklists': return <ChecklistView tasks={currentData.tasks} currentUser={currentUser} onAddTask={t => updateCurrentMonthData({ tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentData.tasks] })} onRemoveTask={id => updateCurrentMonthData({ tasks: currentData.tasks.filter(t => t.id !== id) })} />;
                case 'my-workspace': return <ManagerWorkspace managerId={currentUser.id} clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={items => updateCurrentMonthData({ drive: items })} onToggleTask={id => updateCurrentMonthData({ tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) })} onUpdateNotes={(id, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, notes: n } : c) })} onUpdateStatusFlag={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) })} onUpdateFolder={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) })} />;
                case 'clients': return <SquadsView clients={currentData.clients} currentUser={currentUser} onAssignManager={(cid, mid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, managerId: mid } : c) })} onRemoveClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.filter(c => c.id !== cid) })} onTogglePauseClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) })} />;
                case 'notes': return <WikiView wiki={currentData.wiki || []} currentUser={currentUser} onUpdateWiki={items => updateCurrentMonthData({ wiki: items })} />;
                case 'chat': return (
                  <div className="flex flex-col h-full max-w-[1000px] mx-auto pb-4">
                     <header className="mb-6 flex justify-between items-center px-4"><h2 className="text-2xl md:text-3xl font-black text-white italic uppercase flex items-center gap-3"><Hash className="w-6 h-6 md:w-8 md:h-8 text-teal-500" /> Comunicação</h2></header>
                     <div className="flex-1 bg-[#111] border border-white/5 rounded-[32px] md:rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-4">
                          {(currentData.chatMessages || []).map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                              <span className="text-[9px] font-black text-gray-600 uppercase mb-1 px-2">{msg.senderName}</span>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] ${msg.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-bold' : 'bg-white/5 text-white border border-white/5'}`}>{msg.text}</div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 md:p-6 bg-black/40 border-t border-white/5 flex gap-2 md:gap-4">
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (()=>{if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: new Date().toISOString() }] }); setChatInput('');})()} placeholder="Escreva..." className="flex-1 bg-black rounded-xl px-4 py-3 text-white outline-none border border-white/5 focus:border-teal-500/50 text-sm" />
                          <button onClick={() => {if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: new Date().toISOString() }] }); setChatInput('');}} className="bg-teal-500 px-4 md:px-8 rounded-xl text-black font-black hover:scale-105 transition-all text-xs">ENVIAR</button>
                        </div>
                     </div>
                  </div>
                );
                default: return <Dashboard clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
              }
            } catch (err) {
              console.error("Render error:", err);
              return <div className="p-12 text-center text-red-500 font-black uppercase">Erro de Renderização. Tente atualizar a página.</div>;
            }
          })()}
        </div>
        <div className="fixed top-[-100px] right-[-100px] w-[700px] h-[700px] bg-[#14b8a6]/5 blur-[180px] rounded-full pointer-events-none -z-10"></div>
      </main>
    </div>
  );
};

export default App;
