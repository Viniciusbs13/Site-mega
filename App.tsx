
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

  const currentUserRef = useRef(currentUser);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    currentUserRef.current = currentUser;
    activeTabRef.current = activeTab;
  }, [currentUser, activeTab]);

  // Real-time Sync
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubState = dbService.subscribeToGlobalState((data) => {
      if (skipSyncRef.current) return;
      if (data.availableRoles) setAvailableRoles(data.availableRoles);
    });

    const unsubTeam = dbService.subscribeToTeam((users) => {
      if (skipSyncRef.current) return;
      
      const current = currentUserRef.current;
      if (!current) return;

      // Update local team
      const ceoFromDb = users.find(u => u.email?.toLowerCase() === CEO_DEFAULT.email.toLowerCase());
      const otherMembers = users.filter(u => u.email?.toLowerCase() !== CEO_DEFAULT.email.toLowerCase());
      setTeam([ceoFromDb || CEO_DEFAULT, ...otherMembers]);

      // CRITICAL: Update current user role if changed in DB
      const dbUser = users.find(u => u.id === current.id);
      if (dbUser && (dbUser.role !== current.role || dbUser.isActive !== current.isActive)) {
        const updatedUser = { ...current, role: dbUser.role, isActive: dbUser.isActive };
        setCurrentUser(updatedUser);
        localStorage.setItem('omega_session_user', JSON.stringify(updatedUser));
        
        // Reset tab if current tab is not allowed for new role
        const allowedTabs = NAVIGATION_ITEMS.filter(item => (item.roles as string[]).includes(dbUser.role)).map(i => i.id);
        if (!allowedTabs.includes(activeTabRef.current)) {
          setActiveTab('dashboard');
        }
      }
    });

    return () => {
      unsubState();
      unsubTeam();
    };
  }, [currentUser?.id]); // Only re-run if user ID changes

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

  const getDefaultTab = (role: UserRole): string => {
    switch (role) {
      case DefaultUserRole.CEO: return 'dashboard';
      case DefaultUserRole.MANAGER: return 'my-workspace';
      case DefaultUserRole.SALES: return 'commercial';
      default: return 'my-workspace';
    }
  };

  useEffect(() => {
    if (currentUser) {
      const defaultTab = getDefaultTab(currentUser.role);
      if (activeTab === 'dashboard' && defaultTab !== 'dashboard') {
        setActiveTab(defaultTab);
      }
    }
  }, [currentUser?.role]);

  const loadEverything = async () => {
    try {
      const diag = await dbService.diagnoseConnection();
      setIsNetworkBlocked(diag.status === 'BLOCKED');
      
      const saved = await dbService.loadState();
      if (saved) {
        skipSyncRef.current = true;
        
        const ceoFromDb = (saved.team || []).find((u: User) => u.email?.toLowerCase() === CEO_DEFAULT.email.toLowerCase());
        const otherMembers = (saved.team || []).filter((u: User) => u.email?.toLowerCase() !== CEO_DEFAULT.email.toLowerCase());
        
        setTeam([ceoFromDb || CEO_DEFAULT, ...otherMembers]);
        setAvailableRoles(saved.availableRoles && saved.availableRoles.length > 0 ? saved.availableRoles : Object.values(DefaultUserRole));
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

  const updateCurrentMonthData = useCallback(async (updates: Partial<MonthlyData[string]> | ((prev: MonthlyData[string]) => Partial<MonthlyData[string]>)) => {
    let finalUpdates: Partial<MonthlyData[string]> = {};
    
    setDb(prev => {
      const currentMonthContent = prev[selectedMonth] || DEFAULT_MONTH_DATA();
      finalUpdates = typeof updates === 'function' ? updates(currentMonthContent) : updates;
      const newContent = { ...currentMonthContent, ...finalUpdates };
      return { ...prev, [selectedMonth]: newContent };
    });

    // Save to cloud OUTSIDE of setDb
    await dbService.saveMonthData(selectedMonth, finalUpdates);
  }, [selectedMonth]);

  const handleUpdateUser = async (u: User) => {
    setTeam(prev => prev.map(m => m.id === u.id ? u : m));
    const result = await dbService.saveUser(u);
    setIsSynced(result.success);
    setSyncError(result.error || null);
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

  if (!currentUser) return <Auth team={team} onLogin={handleLogin} onUpdateUser={handleUpdateUser} />;

  const currentData = (db && db[selectedMonth]) ? db[selectedMonth] : DEFAULT_MONTH_DATA();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-white overflow-hidden relative font-['General_Sans']">
      {/* Video Background */}
      <video 
        className="video-bg" 
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />

      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/50 backdrop-blur-md z-50">
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
                case 'team': return <TeamView team={team} currentUser={currentUser} availableRoles={availableRoles} onUpdateRole={async (id, r) => { const user = team.find(u => u.id === id); if(user) await handleUpdateUser({ ...user, role: r }); }} onAddMember={async (name, role, email) => { 
                  await handleUpdateUser({ id: email.toLowerCase(), name, email: email.toLowerCase(), role, isActive: true }); 
                  // Send invite email
                  try {
                    const response = await fetch('/api/send-invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.toLowerCase(), name, role })
                    });
                    if (!response.ok) {
                      const errorData = await response.json();
                      console.error('Falha ao enviar convite:', errorData.error);
                    } else {
                      console.log('Convite enviado com sucesso para:', email);
                    }
                  } catch (err) {
                    console.error('Erro ao chamar API de convite:', err);
                  }
                }} onRemoveMember={async (id) => { if(id === CEO_DEFAULT.id) return; await dbService.deleteUser(id); }} onAddRole={async (role) => { const next = [...availableRoles, role]; setAvailableRoles(next); await dbService.saveGlobalState({ availableRoles: next }); }} onToggleActive={async (id) => { const user = team.find(u => u.id === id); if(user) await handleUpdateUser({ ...user, isActive: !user.isActive }); }} />;
                case 'commercial': return (
                  <SalesView 
                    goal={currentData.salesGoal} 
                    team={team} 
                    clients={currentData.clients} 
                    currentUser={currentUser} 
                    onUpdateGoal={u => updateCurrentMonthData(prev => ({ salesGoal: { ...prev.salesGoal, ...u } }))} 
                    onRegisterSale={async (uid, val, cname) => { 
                      const seller = team.find(u => u.id === uid);
                      if (seller) {
                        await handleUpdateUser({ ...seller, salesVolume: (seller.salesVolume || 0) + val });
                      }
                      const newClient: Client = { 
                        id: Date.now().toString(), 
                        name: cname, 
                        industry: 'Novo Contrato', 
                        health: 'Estável', 
                        progress: 0, 
                        managerId: '', 
                        salesId: uid, 
                        contractValue: val, 
                        statusFlag: 'GREEN', 
                        isPaused: false, 
                        folder: { briefing: '', accessLinks: '', operationalHistory: '' } 
                      }; 
                      await updateCurrentMonthData(prev => ({ 
                        salesGoal: { 
                          ...prev.salesGoal, 
                          currentValue: prev.salesGoal.currentValue + val, 
                          totalSales: prev.salesGoal.totalSales + 1 
                        }, 
                        clients: [...prev.clients, newClient] 
                      })); 
                    }} 
                    onUpdateUserGoal={async (id, pg, sg) => {
                      const user = team.find(u => u.id === id);
                      if (user) await handleUpdateUser({ ...user, personalGoal: pg, superGoal: sg });
                    }} 
                    onUpdateClientNotes={(cid, n) => updateCurrentMonthData(prev => ({ clients: prev.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) }))} 
                  />
                );
                case 'checklists': return <ChecklistView tasks={currentData.tasks} currentUser={currentUser} onAddTask={t => updateCurrentMonthData(prev => ({ tasks: [{ ...t, id: Date.now().toString() } as Task, ...prev.tasks] }))} onRemoveTask={id => updateCurrentMonthData(prev => ({ tasks: prev.tasks.filter(t => t.id !== id) }))} />;
                case 'my-workspace': return <ManagerWorkspace managerId={currentUser.id} clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={items => updateCurrentMonthData({ drive: items })} onToggleTask={id => updateCurrentMonthData(prev => ({ tasks: prev.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) }))} onUpdateNotes={(id, n) => updateCurrentMonthData(prev => ({ clients: prev.clients.map(c => c.id === id ? { ...c, notes: n } : c) }))} onUpdateStatusFlag={(id, f) => updateCurrentMonthData(prev => ({ clients: prev.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) }))} onUpdateFolder={(id, f) => updateCurrentMonthData(prev => ({ clients: prev.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) }))} />;
                case 'clients': return <SquadsView clients={currentData.clients} currentUser={currentUser} onAssignManager={(cid, mid) => updateCurrentMonthData(prev => ({ clients: prev.clients.map(c => c.id === cid ? { ...c, managerId: mid } : c) }))} onRemoveClient={(cid) => updateCurrentMonthData(prev => ({ clients: prev.clients.filter(c => c.id !== cid) }))} onTogglePauseClient={(cid) => updateCurrentMonthData(prev => ({ clients: prev.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) }))} />;
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
