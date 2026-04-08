
import React, { useState } from 'react';
import { ServiceRequest, User, Client, DefaultUserRole } from '../types';
import { Video, Camera, Clock, AlertCircle, CheckCircle2, Plus, Calendar, User as UserIcon, MessageSquare } from 'lucide-react';

interface ServiceRequestsViewProps {
  requests: ServiceRequest[];
  clients: Client[];
  currentUser: User;
  onAddRequest: (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateStatus: (requestId: string, status: ServiceRequest['status']) => void;
}

const ServiceRequestsView: React.FC<ServiceRequestsViewProps> = ({ 
  requests, clients, currentUser, onAddRequest, onUpdateStatus 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRequest, setNewRequest] = useState({
    clientId: '',
    type: 'EDICAO' as 'EDICAO' | 'CAPTACAO',
    description: '',
    dueDate: ''
  });

  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const isEditor = currentUser.role === DefaultUserRole.EDITOR;
  const isCaptador = currentUser.role === DefaultUserRole.CAPTADOR;
  const isManager = currentUser.role === DefaultUserRole.MANAGER || currentUser.role === DefaultUserRole.ACCOUNT;

  const filteredRequests = requests.filter(req => {
    if (isCEO) return true;
    if (isEditor) return req.type === 'EDICAO';
    if (isCaptador) return req.type === 'CAPTACAO';
    if (isManager) return req.requesterId === currentUser.id;
    return false;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.clientId || !newRequest.description || !newRequest.dueDate) return;
    
    onAddRequest({
      clientId: newRequest.clientId,
      clientName: clients.find(c => c.id === newRequest.clientId)?.name || 'Desconhecido',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      type: newRequest.type,
      description: newRequest.description,
      dueDate: newRequest.dueDate
    });
    setIsAdding(false);
    setNewRequest({ clientId: '', type: 'EDICAO', description: '', dueDate: '' });
  };

  const getStatusBadge = (status: ServiceRequest['status'], dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'COMPLETED';
    
    if (isOverdue) return <span className="bg-red-500/10 text-red-500 text-[8px] px-2 py-1 rounded font-black uppercase flex items-center gap-1"><AlertCircle className="w-2 h-2" /> ATRASADO</span>;
    
    switch (status) {
      case 'PENDING': return <span className="bg-white/5 text-gray-400 text-[8px] px-2 py-1 rounded font-black uppercase">Pendente</span>;
      case 'IN_PROGRESS': return <span className="bg-blue-500/10 text-blue-500 text-[8px] px-2 py-1 rounded font-black uppercase">Em Produção</span>;
      case 'COMPLETED': return <span className="bg-green-500/10 text-green-500 text-[8px] px-2 py-1 rounded font-black uppercase flex items-center gap-1"><CheckCircle2 className="w-2 h-2" /> Entregue</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Solicitações de Serviço</h2>
          <p className="text-sm text-gray-400 font-medium tracking-tight">Gestão de Edição e Captação de Conteúdo.</p>
        </div>
        {(isManager || isCEO) && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#14b8a6] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-[#14b8a6]/20"
          >
            <Plus className="w-4 h-4" /> Nova Solicitação
          </button>
        )}
      </header>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-[40px] p-8 w-full max-w-lg space-y-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-white uppercase italic">Criar Solicitação</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Cliente</label>
                <select 
                  value={newRequest.clientId}
                  onChange={e => setNewRequest({...newRequest, clientId: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#14b8a6]"
                >
                  <option value="">Selecione o Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Tipo de Serviço</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setNewRequest({...newRequest, type: 'EDICAO'})}
                    className={`p-4 rounded-xl border font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${newRequest.type === 'EDICAO' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-black border-white/5 text-gray-500'}`}
                  >
                    <Video className="w-4 h-4" /> Edição
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewRequest({...newRequest, type: 'CAPTACAO'})}
                    className={`p-4 rounded-xl border font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${newRequest.type === 'CAPTACAO' ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'bg-black border-white/5 text-gray-500'}`}
                  >
                    <Camera className="w-4 h-4" /> Captação
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Descrição do Job</label>
                <textarea 
                  value={newRequest.description}
                  onChange={e => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder="Descreva o que precisa ser feito..."
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-[#14b8a6] min-h-[100px] resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Data de Entrega</label>
                <input 
                  type="date"
                  value={newRequest.dueDate}
                  onChange={e => setNewRequest({...newRequest, dueDate: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#14b8a6]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase text-gray-500 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#14b8a6] text-black py-4 rounded-xl font-black text-[10px] uppercase hover:scale-105 transition-transform">Criar Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map(req => {
          const isOverdue = new Date(req.dueDate) < new Date() && req.status !== 'COMPLETED';
          return (
            <div key={req.id} className={`bg-[#111] border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${isOverdue ? 'border-red-500/30' : 'border-white/5'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${req.type === 'EDICAO' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                  {req.type === 'EDICAO' ? <Video className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{req.clientName}</h4>
                    {getStatusBadge(req.status, req.dueDate)}
                  </div>
                  <p className="text-xs text-gray-400 font-medium max-w-md">{req.description}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase"><UserIcon className="w-3 h-3" /> Solicitado por: {req.requesterName}</span>
                    <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}><Calendar className="w-3 h-3" /> Entrega: {new Date(req.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {req.status === 'PENDING' && (isEditor || isCaptador || isCEO) && (
                  <button 
                    onClick={() => onUpdateStatus(req.id, 'IN_PROGRESS')}
                    className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500/20 transition-all"
                  >
                    Iniciar Produção
                  </button>
                )}
                {req.status === 'IN_PROGRESS' && (isEditor || isCaptador || isCEO) && (
                  <button 
                    onClick={() => onUpdateStatus(req.id, 'COMPLETED')}
                    className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase hover:bg-green-500/20 transition-all"
                  >
                    Marcar como Entregue
                  </button>
                )}
                {req.status === 'COMPLETED' && (isCEO || isManager) && (
                  <button 
                    onClick={() => onUpdateStatus(req.id, 'PENDING')}
                    className="px-4 py-2 bg-white/5 text-gray-500 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                  >
                    Reabrir
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-white/[0.01] rounded-[40px] border border-dashed border-white/5">
            <MessageSquare className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Nenhuma solicitação ativa.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestsView;
