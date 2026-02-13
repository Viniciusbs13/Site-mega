
import React from 'react';
import { Client, Task, User, DefaultUserRole } from '../types';
import { LayoutDashboard, ArrowRight, ChevronRight, FileText, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  tasks: Task[];
  currentUser: User;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  months: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, tasks, currentUser, currentMonth, onMonthChange, months }) => {
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const filteredClients = isCEO ? clients : clients.filter(c => c.managerId === currentUser.id);
  const filteredTasks = isCEO ? tasks : tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const avgProgress = filteredClients.length ? Math.round(filteredClients.reduce((acc, c) => acc + c.progress, 0) / filteredClients.length) : 0;

  const getStatusColor = (flag: string) => {
    if (flag === 'GREEN') return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    if (flag === 'YELLOW') return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="w-6 h-6 text-[#14b8a6]" />
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight italic uppercase leading-none">Painel de Performance</h2>
            <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Operador: {currentUser.name}</p>
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 p-1 rounded-xl w-full md:w-auto">
          <select 
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-[#14b8a6] outline-none cursor-pointer uppercase"
          >
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="xl:col-span-3 space-y-4 md:space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-6 md:p-12 relative overflow-hidden group flex flex-col justify-center min-h-[280px] md:min-h-[400px]">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <span className="text-[200px] md:text-[350px] font-black leading-none select-none">Ω</span>
            </div>

            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-4">Sua Performance Média</p>
              <div className="flex items-baseline gap-2 md:gap-4 mb-6 md:mb-8">
                <h3 className="text-6xl md:text-[110px] font-black text-white leading-none tracking-tighter">
                  {avgProgress}<span className="text-[#14b8a6]">%</span>
                </h3>
                <p className="text-sm md:text-xl font-medium text-gray-500 lowercase">entregas</p>
              </div>
              <div className="w-full h-2 md:h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${avgProgress}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-8 md:mt-12 relative z-10">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
                <p className="text-[8px] md:text-[10px] font-bold text-gray-600 uppercase mb-1 tracking-widest">Tarefas</p>
                <p className="text-xl md:text-3xl font-black text-white">{filteredTasks.length}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 text-center md:text-left">
                <p className="text-[8px] md:text-[10px] font-bold text-gray-600 uppercase mb-1 tracking-widest">Contas</p>
                <p className="text-xl md:text-3xl font-black text-white">{filteredClients.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#14b8a6] rounded-[32px] p-6 md:p-10 flex flex-col justify-between text-black relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] opacity-10">
            <span className="text-[150px] font-black italic">Ω</span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold mb-2 italic uppercase">{currentMonth}</p>
            <h3 className="text-2xl md:text-4xl font-black leading-tight tracking-tighter mb-6 md:mb-8 uppercase italic">
              Foco na <br className="hidden md:block"/> Operação.
            </h3>
          </div>
          <div className="p-3 bg-black/10 rounded-xl">
             <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Status de Rede</p>
             <p className="text-[10px] font-bold">Protocolo Seguro</p>
          </div>
        </div>
      </div>

      {isCEO ? (
        <section className="space-y-4 md:space-y-6">
          <h4 className="flex items-center gap-3 text-sm md:text-lg font-bold text-white uppercase tracking-tighter italic px-2">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" /> Visão Geral da Carteira
          </h4>
          <div className="bg-[#111] border border-white/5 rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Progresso</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">Contrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(client.statusFlag)}`}></div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white uppercase italic text-xs">{client.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1 bg-white/5 rounded-full max-w-[60px]">
                            <div className="h-full bg-[#14b8a6]" style={{ width: `${client.progress}%` }}></div>
                          </div>
                          <span className="text-[9px] font-black text-gray-500">{client.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-white text-xs">R$ {client.contractValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        <div className="bg-[#111] border border-white/5 p-8 md:p-12 rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center text-center space-y-4">
           <ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-gray-700" />
           <div className="max-w-xs">
             <h4 className="text-sm md:text-lg font-bold text-white uppercase italic">Privacidade de Dados</h4>
             <p className="text-[10px] md:text-xs text-gray-500 mt-1">Valores contratuais restritos à diretoria. Foque em entregar resultados excelentes para suas contas.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
