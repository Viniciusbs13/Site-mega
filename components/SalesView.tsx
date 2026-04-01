
import React, { useState } from 'react';
// Import DefaultUserRole for enum value access
import { SalesGoal, User, DefaultUserRole, Client } from '../types';
import { Target, TrendingUp, Trophy, Bell, Plus, Edit2, DollarSign, Link, Clipboard, StickyNote, CheckCircle2, UserCheck, Info } from 'lucide-react';

interface SalesViewProps {
  goal: SalesGoal;
  team: User[];
  clients: Client[];
  currentUser: User;
  onUpdateGoal: (updates: Partial<SalesGoal>) => void;
  onRegisterSale: (userId: string, value: number, clientName: string) => void;
  onUpdateUserGoal: (userId: string, personalGoal: number, superGoal: number) => void;
  onUpdateClientNotes: (clientId: string, closingNotes: string) => void;
}

const SalesView: React.FC<SalesViewProps> = ({ 
  goal, team, clients, currentUser, onUpdateGoal, onRegisterSale, onUpdateUserGoal, onUpdateClientNotes 
}) => {
  const [celebration, setCelebration] = useState<{ name: string; value: number } | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [saleValue, setSaleValue] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [copied, setCopied] = useState(false);

  /* Fixed: Using DefaultUserRole enum instead of UserRole type alias */
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const isSales = currentUser.role === DefaultUserRole.SALES;

  const sellers = team.filter(u => u.role === DefaultUserRole.SALES).sort((a, b) => (b.salesVolume || 0) - (a.salesVolume || 0));
  const myClosedClients = clients.filter(c => c.salesId === currentUser.id);
  const progressPercent = Math.min(100, Math.round((goal.currentValue / goal.monthlyTarget) * 100));

  const handleConfirmSale = () => {
    const val = parseFloat(saleValue);
    if (isNaN(val) || val <= 0 || !newClientName) return;
    
    setCelebration({ name: currentUser.name, value: val });
    onRegisterSale(currentUser.id, val, newClientName);
    setSaleValue('');
    setNewClientName('');
    setTimeout(() => setCelebration(null), 5000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(goal.contractFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSellerStatusClass = (seller: User) => {
    const vol = seller.salesVolume || 0;
    const g = seller.personalGoal || 10000;
    const sg = seller.superGoal || 15000;
    if (vol >= sg) return 'animate-gold-shine border-amber-400';
    if (vol >= g) return 'border-green-500 bg-green-500/5';
    if (vol >= g * 0.5) return 'animate-pulse-yellow border-yellow-500/50 bg-yellow-500/5';
    return 'border-red-500/30 bg-red-500/5';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-20 font-['General_Sans']">
      
      {celebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-10 p-16 glass-card border-white/10 shadow-[0_0_150px_rgba(20,184,166,0.3)]">
            <Bell className="w-64 h-64 text-[#14b8a6] animate-bell mx-auto drop-shadow-[0_0_80px_rgba(20,184,166,0.7)]" />
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-bold text-white uppercase tracking-tighter italic text-gradient">META ESMAGADA!</h2>
              <p className="text-3xl md:text-5xl font-bold text-white/60 uppercase tracking-tight">{celebration.name}</p>
              <p className="text-5xl md:text-7xl font-black text-white tracking-tighter">R$ {celebration.value.toLocaleString()}</p>
            </div>
            <button onClick={() => setCelebration(null)} className="pill-button-outer group">
              <div className="pill-button-inner bg-white text-black px-16 py-6 text-xl font-bold uppercase tracking-widest group-hover:bg-[#14b8a6] transition-all">
                Continuar o Grind
              </div>
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <Target className="w-6 h-6 text-[#14b8a6]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight italic uppercase leading-none text-gradient">Arena de Vendas</h2>
            <p className="text-[10px] md:text-[11px] font-medium text-white/40 uppercase tracking-[0.3em] mt-2">Protocolo de Performance & Motivação</p>
          </div>
        </div>
        {isCEO && (
          <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="pill-button-outer group">
            <div className="pill-button-inner bg-white/5 text-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest group-hover:bg-white/10 transition-all flex items-center gap-3">
              <Edit2 className="w-4 h-4" /> Ajustes de Meta (CEO)
            </div>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        <div className="xl:col-span-2 space-y-10">
          
          {isSales && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-10 space-y-8 border-white/10">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#14b8a6]" /> Lançar Nova Vitória
                </h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Empresa / Cliente</label>
                    <input 
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Ex: TechNova LTDA"
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-[#14b8a6] transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Valor do Contrato</label>
                    <input 
                      type="number"
                      value={saleValue}
                      onChange={(e) => setSaleValue(e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm text-white font-bold outline-none focus:border-[#14b8a6] transition-all placeholder:text-white/10"
                    />
                  </div>
                  <button onClick={handleConfirmSale} className="w-full bg-white text-black py-5 rounded-full font-bold text-sm hover:bg-[#14b8a6] transition-all uppercase tracking-widest shadow-2xl">
                    REGISTRAR E TOCAR O SINO
                  </button>
                </div>
              </div>

              <div className="glass-card p-10 flex flex-col justify-between border-white/10">
                <div>
                  <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Link className="w-5 h-5" /> Link de Onboarding
                  </h4>
                  <p className="text-[11px] text-white/40 mt-4 leading-relaxed">Envie ao cliente para coletar os dados do contrato e iniciar o protocolo:</p>
                </div>
                <div className="mt-8 p-5 bg-black/40 border border-white/10 rounded-3xl flex items-center justify-between backdrop-blur-xl">
                  <span className="text-[10px] text-white/30 font-mono truncate mr-4">{goal.contractFormUrl}</span>
                  <button onClick={copyToClipboard} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Clipboard className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isSales && (
            <section className="space-y-6">
               <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-3 ml-2">
                 <UserCheck className="w-5 h-5 text-[#14b8a6]" /> Minhas Vendas (Contexto Operacional)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {myClosedClients.map(client => (
                   <div key={client.id} className="glass-card p-8 space-y-6 border-white/10 hover:border-[#14b8a6]/20 transition-all">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-bold text-white uppercase italic tracking-tighter">{client.name}</p>
                        <span className="text-sm font-bold text-[#14b8a6] tracking-tight">R$ {client.contractValue.toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-white/20 uppercase flex items-center gap-2 tracking-widest ml-2">
                          <Info className="w-3.5 h-3.5" /> Briefing Operacional
                        </label>
                        <textarea 
                          value={client.closingNotes || ''}
                          onChange={(e) => onUpdateClientNotes(client.id, e.target.value)}
                          placeholder="Ex: Cliente focado em leads de WhatsApp, prefere contato por e-mail..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white/60 min-h-[100px] outline-none focus:border-[#14b8a6] transition-all resize-none placeholder:text-white/10"
                        />
                      </div>
                   </div>
                 ))}
                 {myClosedClients.length === 0 && (
                   <div className="col-span-full py-20 text-center glass-card border-dashed border-white/10 italic text-white/20 text-sm">
                     Nenhum fechamento registrado este mês. Vamos pra cima!
                   </div>
                 )}
               </div>
            </section>
          )}

          {isCEO && isEditingGoal && (
            <div className="glass-card p-10 space-y-8 border-[#14b8a6]/30 animate-in slide-in-from-top-6">
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-3">Configurações de Meta Direta</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Meta Global (R$)</label>
                  <input type="number" defaultValue={goal.monthlyTarget} onBlur={(e) => onUpdateGoal({ monthlyTarget: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-[#14b8a6]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Super Meta (R$)</label>
                  <input type="number" defaultValue={goal.monthlySuperTarget} onBlur={(e) => onUpdateGoal({ monthlySuperTarget: parseFloat(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-[#14b8a6]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Link de Form</label>
                  <input type="text" defaultValue={goal.contractFormUrl} onBlur={(e) => onUpdateGoal({ contractFormUrl: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm text-blue-400 outline-none focus:border-[#14b8a6]" />
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-12 relative overflow-hidden group border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
             <div className="absolute right-[-40px] top-[-40px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-all duration-1000 group-hover:scale-110">
                <TrendingUp className="w-[450px] h-[450px]" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                <div className="space-y-8 flex-1 w-full">
                  <div>
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.4em] mb-4">Faturamento Global do Ciclo</p>
                    <h3 className="text-6xl md:text-8xl font-bold text-white tracking-tighter italic text-gradient">R$ {goal.currentValue.toLocaleString()}</h3>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
                  <div className="glass-card p-8 border-white/5 text-center min-w-[160px]">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">Contratos</p>
                    <p className="text-4xl font-bold text-white italic">{goal.totalSales}</p>
                  </div>
                  <div className="glass-card p-8 border-white/5 text-center min-w-[160px]">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">Progresso</p>
                    <p className="text-4xl font-bold text-[#14b8a6] italic">{progressPercent}%</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-10 space-y-10 h-full flex flex-col border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h4 className="flex items-center gap-4 text-2xl font-bold text-white uppercase italic tracking-tighter">
              <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" /> Ranking Global
            </h4>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {sellers.map((seller, index) => (
                <div key={seller.id} className={`flex flex-col p-6 rounded-[32px] border transition-all duration-500 backdrop-blur-xl ${getSellerStatusClass(seller)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'bg-white/10 text-white'}`}>{index + 1}º</span>
                      <p className={`text-sm font-bold uppercase tracking-tight ${seller.id === currentUser.id ? 'text-[#14b8a6]' : 'text-white'}`}>{seller.name}</p>
                    </div>
                    <p className="text-sm font-bold text-white tracking-tight">R$ {(seller.salesVolume || 0).toLocaleString()}</p>
                  </div>
                  {isCEO && isEditingGoal ? (
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-white/20 uppercase ml-2">Meta</label>
                        <input type="number" placeholder="Meta" onBlur={(e) => onUpdateUserGoal(seller.id, parseFloat(e.target.value), seller.superGoal || 0)} className="w-full bg-black border border-white/10 rounded-full px-4 py-2 text-[10px] text-teal-400 outline-none focus:border-teal-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-white/20 uppercase ml-2">Super</label>
                        <input type="number" placeholder="Super" onBlur={(e) => onUpdateUserGoal(seller.id, seller.personalGoal || 0, parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-full px-4 py-2 text-[10px] text-amber-400 outline-none focus:border-amber-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 border border-white/5">
                      <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, ((seller.salesVolume || 0)/(seller.personalGoal || 1)) * 100)}%` }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesView;
