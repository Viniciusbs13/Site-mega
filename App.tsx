
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, DefaultUserRole, Client, Task, User, MonthlyData, ClientStatus, SalesGoal, DriveItem } from './types';
import { INITIAL_CLIENTS, NAVIGATION_ITEMS, MANAGERS, MONTHS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SquadsView from './components/SquadsView';
import ChecklistView from './components/ChecklistView';
import ManagerWorkspace from './components/ManagerWorkspace';
import TeamView from './components/TeamView';
import SalesView from './components/SalesView';
import Auth from './components/Auth';
import KnowledgeBase from './components/KnowledgeBase';
import { dbService } from './services/database';
import { Loader2, Menu, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [hasFatalError, setHasFatalError] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('omega_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  
  const CEO_DEFAULT: User = { 
    id: 'assessoriaomega1@gmail.com', 
    name: 'Diretoria Ômega', 
    email: 'assessoriaomega1@gmail.com', 
    password: 'admin', 
    role: DefaultUserRole.CEO, 
    isActive: true 
  };

  const DEFAULT_MONTH_DATA = (): MonthlyData[string] => ({
    clients: INITIAL_CLIENTS,
    tasks: [],
    salesGoal: { 
      monthlyTarget: 100000, 
      monthlySuperTarget: 150000, 
      currentValue: 0, 
      totalSales: 0, 
      contractFormUrl: 'https://seulink.com/onboarding' 
    },
    drive: [],
    wiki: [],
    notices: []
  });

  const [team, setTeam] = useState<User[]>([CEO_DEFAULT]);
  const [db, setDb] = useState<MonthlyData>({ [monthKey]: DEFAULT_MONTH_DATA() });
  const [activities, setActivities] = useState<any[]>([]);

  const skipSyncRef = useRef(false);

  const normalizeDb = (rawDb: any): MonthlyData => {
    if (!rawDb || typeof rawDb !== 'object') return { [monthKey]: DEFAULT_MONTH_DATA() };
    const cleanDb: MonthlyData = {};
    Object.keys(rawDb).forEach(key => {
      const monthData = rawDb[key];
      cleanDb[key] = {
        clients: Array.isArray(monthData.clients) ? monthData.clients : [],
        tasks: Array.isArray(monthData.tasks) ? monthData.tasks : [],
        salesGoal: monthData.salesGoal || DEFAULT_MONTH_DATA().salesGoal,
        drive: Array.isArray(monthData.drive) ? monthData.drive : [],
        wiki: Array.isArray(monthData.wiki) ? monthData.wiki : [],
        notices: Array.isArray(monthData.notices) ? monthData.notices : []
      };
    });
    return cleanDb;
  };

  // Real-time Sync
  useEffect(() => {
    if (!currentUser) return;

    const unsubState = dbService.subscribeToGlobalState((data) => {
      if (skipSyncRef.current) return;
      if (data.availableRoles) setAvailableRoles(data.availableRoles);
    });

    const unsubTeam = dbService.subscribeToTeam((users) => {
      if (skipSyncRef.current) return;
      // Ensure CEO is always present and correct
      const hasCeo = users.some(u => u.email.toLowerCase() === CEO_DEFAULT.email.toLowerCase());
      if (!hasCeo) {
        setTeam([CEO_DEFAULT, ...users]);
      } else {
        setTeam(users);
      }
    });

    return () => {
      unsubState();
      unsubTeam();
    };
  }, [currentUser]);

  // Month-specific Sync
  useEffect(() => {
    if (!currentUser || !selectedMonth) return;

    const unsubMonth = dbService.subscribeToMonth(selectedMonth, (data) => {
      if (skipSyncRef.current) return;
      setDb(prev => ({
        ...prev,
        [selectedMonth]: {
          clients: Array.isArray(data.clients) ? data.clients : [],
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          salesGoal: data.salesGoal || DEFAULT_MONTH_DATA().salesGoal,
          drive: Array.isArray(data.drive) ? data.drive : [],
          wiki: Array.isArray(data.wiki) ? data.wiki : [],
          notices: Array.isArray(data.notices) ? data.notices : []
        }
      }));
    });

    return () => unsubMonth();
  }, [currentUser, selectedMonth]);

  // Presence & Activity
  useEffect(() => {
    if (!currentUser) return;

    let unsubActivity = () => {};
    if (currentUser.role === DefaultUserRole.CEO) {
      unsubActivity = dbService.subscribeToActivity((data) => {
        setActivities(data);
      });
    }

    const presenceInterval = setInterval(() => {
      dbService.updateUserPresence(currentUser.id);
    }, 30000);
    dbService.updateUserPresence(currentUser.id);

    return () => {
      unsubActivity();
      clearInterval(presenceInterval);
    };
  }, [currentUser]);

  const syncToCloud = useCallback(async (stateToSave?: any) => {
    if (isLoading || !currentUser) return;
    const data = stateToSave || { team, availableRoles, db };
    
    // Optimistic update prevention: we don't want to trigger a sync from a sync
    skipSyncRef.current = true;
    const result = await dbService.saveState(data);
    setIsSynced(result.success);
    setSyncError(result.error || null);
    setTimeout(() => { skipSyncRef.current = false; }, 1000);
  }, [team, availableRoles, db, isLoading, currentUser]);

  const loadEverything = async () => {
    try {
      const diag = await dbService.diagnoseConnection();
      setIsNetworkBlocked(diag.status === 'BLOCKED');
      
      const saved = await dbService.loadState();
      if (saved) {
        skipSyncRef.current = true;
        const otherMembers = (saved.team || []).filter((u: User) => u.email?.toLowerCase() !== CEO_DEFAULT.email.toLowerCase());
        setTeam([CEO_DEFAULT, ...otherMembers]);
        setAvailableRoles(saved.availableRoles || Object.values(DefaultUserRole));
        setDb(normalizeDb(saved.db));
        setIsSynced(diag.status === 'CONNECTED');
        setTimeout(() => { skipSyncRef.current = false; }, 1000);
        return true;
      }
    } catch (err: any) {
      if (err.message?.includes('Missing or insufficient permissions')) {
        console.warn("Aviso: Algumas permissões estão restritas. O sistema continuará em modo limitado.");
        return false;
      }
      console.error("Erro crítico ao carregar dados:", err);
      setHasFatalError(true);
    }
    return false;
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await dbService.ensureAuth();
      await loadEverything();
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isLoading && !skipSyncRef.current && currentUser && !hasFatalError) {
      const delay = isNetworkBlocked ? 60000 : 10000;
      const saveTimeout = setTimeout(() => syncToCloud(), delay);
      return () => clearTimeout(saveTimeout);
    }
  }, [team, availableRoles, db, isLoading, syncToCloud, isNetworkBlocked, currentUser, hasFatalError]);

  const handleLogin = (u: User) => {
    localStorage.setItem('omega_session_user', JSON.stringify(u));
    setCurrentUser(u);
    dbService.logActivity(u.id, u.name, 'Entrou no sistema');
    loadEverything();
  };

  const handleLogout = () => {
    if (currentUser) {
      dbService.logActivity(currentUser.id, currentUser.name, 'Saiu do sistema');
    }
    localStorage.removeItem('omega_session_user');
    setCurrentUser(null);
  };

  const updateCurrentMonthData = (updates: Partial<MonthlyData[string]>) => {
    setDb(prev => {
      const currentMonthContent = prev[selectedMonth] || DEFAULT_MONTH_DATA();
      return { ...prev, [selectedMonth]: { ...currentMonthContent, ...updates } };
    });
  };

  if (hasFatalError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-black text-white uppercase italic">Erro de Sistema</h1>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs">Resetar e Recarregar</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-20 h-20 bg-[#14b8a6] rounded-3xl flex items-center justify-center animate-pulse shadow-[0_0_60px_rgba(20,184,166,0.4)]">
          <span className="text-black font-black text-4xl">Ω</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 text-teal-500 font-black uppercase tracking-[0.4em] text-[11px] italic">
            <Loader2 className="w-5 h-5 animate-spin" /> Ω-CORE CONECTANDO
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Auth team={team} onLogin={handleLogin} onUpdateUser={(u) => { setTeam(prev => prev.map(m => m.id === u.id ? u : m)); syncToCloud(); }} />;

  const currentData = (db && db[selectedMonth]) ? db[selectedMonth] : DEFAULT_MONTH_DATA();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden relative">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#14b8a6] rounded-lg flex items-center justify-center text-black font-black italic">Ω</div>
          <span className="text-sm font-black uppercase tracking-widest text-white italic">Omega</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg text-teal-500"><Menu className="w-6 h-6" /></button>
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
        team={team}
      />
      
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto p-4 md:p-12 custom-scrollbar">
          {(() => {
            try {
              switch (activeTab) {
                case 'dashboard': return <Dashboard clients={currentData.clients.filter(c => !c.isPaused)} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} activities={activities} notices={currentData.notices || []} />;
                case 'knowledge-base': return <KnowledgeBase wiki={currentData.wiki || []} notices={currentData.notices || []} currentUser={currentUser} onUpdateWiki={items => updateCurrentMonthData({ wiki: items })} onUpdateNotices={notices => updateCurrentMonthData({ notices })} />;
                case 'team': return <TeamView team={team} currentUser={currentUser} availableRoles={availableRoles} onUpdateRole={(id, r) => { const next = team.map(u => u.id === id ? { ...u, role: r } : u); setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} onAddMember={(name, role, email) => { const next = [...team, { id: email.toLowerCase(), name, email: email.toLowerCase(), role, isActive: true }]; setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} onRemoveMember={(id) => { if(id === CEO_DEFAULT.id) return; const next = team.filter(u => u.id !== id); setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} onAddRole={(role) => { const next = [...availableRoles, role]; setAvailableRoles(next); syncToCloud({ team, availableRoles: next, db }); }} onToggleActive={(id) => { const next = team.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u); setTeam(next); syncToCloud({ team: next, availableRoles, db }); }} />;
                case 'commercial': return <SalesView goal={currentData.salesGoal} team={team} clients={currentData.clients} currentUser={currentUser} onUpdateGoal={u => updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, ...u } })} onRegisterSale={(uid, val, cname) => { setTeam(prev => prev.map(usr => usr.id === uid ? { ...usr, salesVolume: (usr.salesVolume || 0) + val } : usr)); const newClient: Client = { id: Date.now().toString(), name: cname, industry: 'Novo Contrato', health: 'Estável', progress: 0, managerId: '', salesId: uid, contractValue: val, statusFlag: 'GREEN', isPaused: false, folder: { briefing: '', accessLinks: '', operationalHistory: '' } }; updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, currentValue: currentData.salesGoal.currentValue + val, totalSales: currentData.salesGoal.totalSales + 1 }, clients: [...currentData.clients, newClient] }); }} onUpdateUserGoal={(id, pg, sg) => setTeam(prev => prev.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u))} onUpdateClientNotes={(cid, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) })} />;
                case 'checklists': return <ChecklistView tasks={currentData.tasks} currentUser={currentUser} onAddTask={t => updateCurrentMonthData({ tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentData.tasks] })} onRemoveTask={id => updateCurrentMonthData({ tasks: currentData.tasks.filter(t => t.id !== id) })} />;
                case 'my-workspace': return <ManagerWorkspace managerId={currentUser.id} clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={items => updateCurrentMonthData({ drive: items })} onToggleTask={id => updateCurrentMonthData({ tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) })} onUpdateNotes={(id, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, notes: n } : c) })} onUpdateStatusFlag={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) })} onUpdateFolder={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) })} />;
                case 'clients': return <SquadsView clients={currentData.clients} currentUser={currentUser} onAssignManager={(cid, mid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, managerId: mid } : c) })} onRemoveClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.filter(c => c.id !== cid) })} onTogglePauseClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) })} />;
                default: return <Dashboard clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
              }
            } catch (err) {
              return <div className="p-12 text-center text-red-500 font-black flex flex-col items-center gap-4"><AlertTriangle className="w-12 h-12" /><p>Erro ao carregar módulo.</p></div>;
            }
          })()}
        </div>
      </main>
    </div>
  );
};

export default App;
