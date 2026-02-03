
import React, { useState, useEffect } from 'react';
import { UserRole, DefaultUserRole, Client, Task, User, MonthlyData, ClientStatus, SalesGoal, ChatMessage, ClientHealth, DriveItem } from './types';
import { INITIAL_CLIENTS, NAVIGATION_ITEMS, MANAGERS, MONTHS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SquadsView from './components/SquadsView';
import ChecklistView from './components/ChecklistView';
import ManagerWorkspace from './components/ManagerWorkspace';
import TeamView from './components/TeamView';
import SalesView from './components/SalesView';
import { dbService } from './services/database';
import { Hash, LogIn, ShieldCheck, UserCircle, LogOut, Lock } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = localStorage.getItem('omega_session');
    return session ? JSON.parse(session) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [chatInput, setChatInput] = useState('');
  const [loginForm, setLoginForm] = useState({ name: '', role: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  const [team, setTeam] = useState<User[]>([
    { id: 'ceo-master', name: 'Diretoria Ômega', role: DefaultUserRole.CEO, isActive: true },
    { id: 'm1', name: 'Ricardo Tráfego', role: DefaultUserRole.MANAGER, isActive: true }
  ]);
  const [db, setDb] = useState<MonthlyData>({
    [monthKey]: {
      clients: INITIAL_CLIENTS,
      tasks: [],
      salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: 'https://seulink.com/onboarding' },
      chatMessages: [],
      drive: []
    }
  });

  useEffect(() => {
    const saved = dbService.loadState();
    if (saved) {
      setTeam(saved.team);
      setAvailableRoles(saved.availableRoles);
      setDb(saved.db);
    }
  }, []);

  useEffect(() => {
    dbService.saveState({ team, availableRoles, db });
  }, [team, availableRoles, db]);

  useEffect(() => {
    if (currentUser) {
      const dbUser = team.find(u => u.id === currentUser.id);
      if (dbUser && !dbUser.isActive) {
        handleLogout();
        alert('Seu acesso foi revogado pelo administrador.');
      }
    }
  }, [team, currentUser]);

  const currentData = db[selectedMonth] || { 
    clients: [], 
    tasks: [], 
    salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: 'https://seulink.com/onboarding', salesNotes: '' }, 
    chatMessages: [],
    drive: []
  };

  const updateCurrentMonthData = (updates: Partial<MonthlyData[string]>) => {
    setDb(prev => ({ ...prev, [selectedMonth]: { ...currentData, ...updates } }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginForm.role === DefaultUserRole.CEO) {
      if (loginForm.password === 'AssessoriaOmega') {
        const ceo = team.find(u => u.role === DefaultUserRole.CEO) || team[0];
        const sessionUser = { ...ceo, name: loginForm.name || ceo.name };
        setCurrentUser(sessionUser);
        localStorage.setItem('omega_session', JSON.stringify(sessionUser));
      } else {
        setLoginError('Senha de Diretoria Inválida.');
      }
      return;
    }
    const user = team.find(u => u.name.toLowerCase() === loginForm.name.toLowerCase() && u.role === loginForm.role);
    if (user) {
      if (!user.isActive) {
        setLoginError('Acesso desativado. Contate o CEO.');
        return;
      }
      setCurrentUser(user);
      localStorage.setItem('omega_session', JSON.stringify(user));
    } else {
      setLoginError('Colaborador não encontrado nesta função.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('omega_session');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- DRIVE LOGIC ---
  const handleDriveUpdate = (newItems: DriveItem[]) => {
    updateCurrentMonthData({ drive: newItems });
  };

  // --- CLIENT LOGIC ---
  const handleRemoveClient = (clientId: string) => {
    if (confirm('REMOVER CLIENTE DEFINITIVAMENTE?')) {
      updateCurrentMonthData({ clients: currentData.clients.filter(c => c.id !== clientId) });
    }
  };

  const handleTogglePauseClient = (clientId: string) => {
    updateCurrentMonthData({ 
      clients: currentData.clients.map(c => c.id === clientId ? { ...c, isPaused: !c.isPaused } : c) 
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-[#14b8a6] rounded-[24px] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(20,184,166,0.3)]">
              <span className="text-4xl font-black text-black italic">Ω</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Terminal Ômega</h1>
            <p className="text-gray-500 text-sm font-bold tracking-widest uppercase">Sistema de Gestão Restrito</p>
          </div>
          <form onSubmit={handleLogin} className="bg-[#111] border border-white/5 p-10 rounded-[48px] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><UserCircle className="w-3 h-3"/> Nome Identificador</label>
                <input required value={loginForm.name} onChange={e => setLoginForm({ ...loginForm, name: e.target.value })} placeholder="Seu nome completo" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#14b8a6] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3 h-3"/> Função</label>
                <select required value={loginForm.role} onChange={e => setLoginForm({ ...loginForm, role: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#14b8a6] transition-all appearance-none cursor-pointer">
                  <option value="">Selecione seu cargo</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              {loginForm.role === DefaultUserRole.CEO && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Lock className="w-3 h-3"/> Senha de Diretoria</label>
                  <input type="password" required value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" className="w-full bg-black border border-amber-500/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-500 transition-all" />
                </div>
              )}
            </div>
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center animate-pulse">{loginError}</p>}
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-[0_15px_30px_rgba(20,184,166,0.2)]">AUTENTICAR <LogIn className="w-5 h-5" /></button>
          </form>
          <p className="text-center text-[9px] text-gray-800 font-black uppercase tracking-[0.3em]">v2.6 Omega Drive - Auth Required</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard clients={currentData.clients.filter(c => !c.isPaused)} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
      case 'team': return (
        <TeamView 
          team={team} currentUser={currentUser} availableRoles={availableRoles} 
          onUpdateRole={(id, r) => setTeam(prev => prev.map(u => u.id === id ? { ...u, role: r } : u))}
          onAddMember={(name, role) => setTeam(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, role, isActive: true }])}
          onRemoveMember={(id) => setTeam(prev => prev.filter(u => u.id !== id))}
          onAddRole={(role) => setAvailableRoles([...availableRoles, role])}
          onToggleActive={(id) => setTeam(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))} 
        />
      );
      case 'commercial': return (
        <SalesView 
          goal={currentData.salesGoal} team={team} clients={currentData.clients} currentUser={currentUser}
          onUpdateGoal={u => updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, ...u } })}
          onRegisterSale={(uid, val, cname) => {
            setTeam(prev => prev.map(usr => usr.id === uid ? { ...usr, salesVolume: (usr.salesVolume || 0) + val } : usr));
            const newClient: Client = { id: Math.random().toString(36).substr(2,9), name: cname, industry: 'Novo Contrato', health: 'Estável', progress: 0, managerId: '', salesId: uid, contractValue: val, statusFlag: 'GREEN', isPaused: false, folder: { briefing: '', accessLinks: '', operationalHistory: '' } };
            updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, currentValue: currentData.salesGoal.currentValue + val, totalSales: currentData.salesGoal.totalSales + 1 }, clients: [...currentData.clients, newClient] });
          }}
          onUpdateUserGoal={(id, pg, sg) => setTeam(prev => prev.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u))}
          onUpdateClientNotes={(cid, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) })}
        />
      );
      case 'checklists': return <ChecklistView tasks={currentData.tasks} currentUser={currentUser} onAddTask={t => updateCurrentMonthData({ tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentData.tasks] })} onRemoveTask={id => updateCurrentMonthData({ tasks: currentData.tasks.filter(t => t.id !== id) })} />;
      case 'my-workspace': return (
        <ManagerWorkspace 
          managerId={currentUser.id} 
          clients={currentData.clients} 
          tasks={currentData.tasks} 
          currentUser={currentUser} 
          drive={currentData.drive || []}
          onUpdateDrive={handleDriveUpdate}
          onToggleTask={id => updateCurrentMonthData({ tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) })} 
          onUpdateNotes={(id, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, notes: n } : c) })} 
          onUpdateStatusFlag={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) })} 
          onUpdateFolder={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) })} 
        />
      );
      case 'clients': return (
        <SquadsView 
          clients={currentData.clients} 
          currentUser={currentUser}
          onAssignManager={(cid, mid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, managerId: mid } : c) })} 
          onRemoveClient={handleRemoveClient}
          onTogglePauseClient={handleTogglePauseClient}
        />
      );
      case 'chat': return (
        <div className="flex flex-col h-full max-w-[1000px] mx-auto">
           <header className="mb-8 flex justify-between items-center px-4"><h2 className="text-3xl font-black text-white italic uppercase flex items-center gap-3"><Hash className="w-8 h-8 text-teal-500" /> Comunicação Interna</h2></header>
           <div className="flex-1 bg-[#111] border border-white/5 rounded-[40px] flex flex-col overflow-hidden">
              <div className="flex-1 p-8 overflow-y-auto space-y-4">
                {currentData.chatMessages?.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-gray-600 uppercase mb-1">{msg.senderName}</span>
                    <div className={`px-5 py-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-bold' : 'bg-white/5 text-white'}`}>{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-black/40 flex gap-4">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (()=>{if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: '' }] }); setChatInput('');})()} placeholder="Escreva para o time..." className="flex-1 bg-black rounded-2xl px-6 py-4 text-white outline-none border border-white/5" />
                <button onClick={() => {if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: '' }] }); setChatInput('');}} className="bg-teal-500 px-8 rounded-2xl text-black font-black">ENVIAR</button>
              </div>
           </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden font-inter">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto p-12 custom-scrollbar">{renderContent()}</div>
        <div className="fixed top-[-100px] right-[-100px] w-[700px] h-[700px] bg-[#14b8a6]/5 blur-[180px] rounded-full pointer-events-none -z-10"></div>
      </main>
    </div>
  );
};

export default App;
