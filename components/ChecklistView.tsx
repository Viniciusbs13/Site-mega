
import React, { useState } from 'react';
// Import DefaultUserRole for enum value access
import { Task, User, DefaultUserRole } from '../types';
import { MANAGERS } from '../constants';
import { Plus, Send, Users, Trash2, Lock } from 'lucide-react';

interface ChecklistViewProps {
  tasks: Task[];
  currentUser: User;
  onAddTask: (task: Partial<Task>) => void;
  onRemoveTask: (id: string) => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ tasks, currentUser, onAddTask, onRemoveTask }) => {
  const [newTitle, setNewTitle] = useState('');
  /* Fixed: Using DefaultUserRole enum instead of UserRole type alias */
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  
  // Se não for CEO, ele só pode atribuir para si mesmo
  const [assignee, setAssignee] = useState(isCEO ? 'ALL' : currentUser.id);
  const [type, setType] = useState<'ONCE' | 'WEEKLY'>('ONCE');

  const filteredTasks = isCEO ? tasks : tasks.filter(t => t.assignedTo === currentUser.id || (t.assignedTo === 'ALL' && !isCEO));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    onAddTask({
      title: newTitle,
      assignedTo: isCEO ? assignee : currentUser.id,
      type: type,
      status: 'PENDING',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString()
    });
    setNewTitle('');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1200px] mx-auto pb-20 font-['General_Sans']">
      <header className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
          <Users className="w-6 h-6 text-[#14b8a6]" />
        </div>
        <div>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight italic uppercase leading-none text-gradient">Cronogramas Operacionais</h2>
          <p className="text-[10px] md:text-[11px] font-medium text-white/40 uppercase tracking-[0.3em] mt-2">Organize sua rotina de alta performance.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="glass-card p-10 flex flex-wrap gap-8 items-end border-white/10">
        <div className="flex-1 min-w-[300px] space-y-3">
          <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Nova Tarefa / Objetivo</label>
          <input 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="O que precisa ser feito hoje?"
            className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-5 text-sm text-white focus:border-[#14b8a6] outline-none transition-all placeholder:text-white/10"
          />
        </div>
        
        {isCEO ? (
          <div className="space-y-3 min-w-[240px]">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Destinatário (ADM)</label>
            <select 
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-5 text-sm text-[#14b8a6] font-bold outline-none cursor-pointer appearance-none hover:bg-white/10 transition-all"
            >
              <option value="ALL" className="bg-black">PARA TODA A EQUIPE</option>
              {MANAGERS.map(m => (
                <option key={m.id} value={m.id} className="bg-black">{m.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3 min-w-[240px] opacity-40">
             <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4 flex items-center gap-2">
               <Lock className="w-3 h-3" /> Atribuir para
             </label>
             <div className="bg-white/5 border border-white/5 rounded-full px-8 py-5 text-sm text-white/40 font-bold uppercase tracking-widest italic">
               SOMENTE VOCÊ
             </div>
          </div>
        )}

        <button type="submit" className="bg-white text-black px-12 py-5 rounded-full font-bold text-sm hover:bg-[#14b8a6] transition-all flex items-center gap-3 uppercase tracking-widest shadow-2xl">
          <Plus className="w-5 h-5" /> ADICIONAR
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTasks.map(task => (
          <div key={task.id} className="glass-card p-8 flex items-center justify-between group hover:border-[#14b8a6]/20 transition-all border-white/5">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#14b8a6]/10 transition-colors">
                {task.type === 'WEEKLY' ? <Users className="w-6 h-6 text-blue-400" /> : <Send className="w-6 h-6 text-[#14b8a6]" />}
              </div>
              <div>
                <p className="text-lg font-bold text-white uppercase italic tracking-tighter group-hover:text-[#14b8a6] transition-colors">{task.title}</p>
                <div className="flex items-center gap-3 text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] mt-2">
                  <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/5">{task.type === 'WEEKLY' ? 'Recorrente' : 'Pontual'}</span>
                  <span className="text-[#14b8a6]/60">ALVO: {task.assignedTo === 'ALL' ? 'EQUIPE' : (task.assignedTo === currentUser.id ? 'VOCÊ' : task.assignedTo)}</span>
                </div>
              </div>
            </div>
            { (isCEO || task.assignedTo === currentUser.id) && (
              <button 
                onClick={() => onRemoveTask(task.id)}
                className="text-white/10 hover:text-red-500 transition-all p-3 bg-white/5 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-32 text-center glass-card border-dashed border-white/10 italic text-white/10 text-sm">
            Nenhuma tarefa ativa no seu cronograma operacional.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistView;
