
import React, { useState } from 'react';
import { Client, Task, ClientStatus, User, DriveItem } from '../types';
import { CheckCircle2, Circle, Target, Flag, FolderOpen, Info, Link as LinkIcon, History, ChevronDown, ChevronUp, FileText, FolderPlus, FilePlus, ChevronRight, Trash2, ArrowLeft, Save } from 'lucide-react';

interface ManagerWorkspaceProps {
  managerId: string;
  clients: Client[];
  tasks: Task[];
  currentUser: User;
  drive: DriveItem[];
  onUpdateDrive: (items: DriveItem[]) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateNotes: (clientId: string, notes: string) => void;
  onUpdateStatusFlag: (clientId: string, flag: ClientStatus) => void;
  onUpdateFolder: (clientId: string, folder: Partial<Client['folder']>) => void;
}

const ManagerWorkspace: React.FC<ManagerWorkspaceProps> = ({ 
  managerId, clients, tasks, currentUser, drive, onUpdateDrive, onToggleTask, onUpdateNotes, onUpdateStatusFlag, onUpdateFolder 
}) => {
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [currentDrivePath, setCurrentDrivePath] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<DriveItem | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const myClients = clients.filter(c => c.managerId === currentUser.id && !c.isPaused);
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  // DRIVE FILTERS
  const currentItems = drive.filter(item => item.parentId === currentDrivePath && item.ownerId === currentUser.id);
  
  const breadcrumbs = [];
  let tempPath = currentDrivePath;
  while (tempPath) {
    const parent = drive.find(i => i.id === tempPath);
    if (parent) {
      breadcrumbs.unshift(parent);
      tempPath = parent.parentId;
    } else break;
  }

  // --- DRIVE ACTIONS ---
  const handleCreateFolder = () => {
    const name = prompt('Nome da Pasta:');
    if (!name) return;
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FOLDER',
      parentId: currentDrivePath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateDrive([...drive, newItem]);
  };

  const handleCreateFile = () => {
    const name = prompt('Nome do Arquivo / Documento:');
    if (!name) return;
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FILE',
      content: '',
      parentId: currentDrivePath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateDrive([...drive, newItem]);
    setEditingFile(newItem);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Excluir este item permanentemente?')) {
      // Também exclui sub-itens se for pasta
      const itemsToDelete = new Set<string>();
      const collectToDelete = (targetId: string) => {
        itemsToDelete.add(targetId);
        drive.filter(i => i.parentId === targetId).forEach(child => collectToDelete(child.id));
      };
      collectToDelete(id);
      onUpdateDrive(drive.filter(i => !itemsToDelete.has(i.id)));
    }
  };

  const handleSaveFile = () => {
    if (!editingFile) return;
    onUpdateDrive(drive.map(i => i.id === editingFile.id ? editingFile : i));
    setEditingFile(null);
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, isFolder: boolean) => {
    e.preventDefault();
    if (isFolder && targetId !== draggedItemId) {
      setDragOverFolderId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    setDragOverFolderId(null);
    setDraggedItemId(null);

    // Evitar mover para si mesmo ou para sua própria pasta atual
    if (itemId === targetFolderId) return;

    onUpdateDrive(drive.map(item => 
      item.id === itemId ? { ...item, parentId: targetFolderId } : item
    ));
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-32">
      <header>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-[#14b8a6]" /> Estação de Alta Performance
        </h2>
        <p className="text-gray-400 font-medium">Sua central privada de documentos e organização de squads.</p>
      </header>

      {/* --- ÔMEGA DRIVE (NOVO SISTEMA DRAG-AND-DROP) --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
             <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" /> Ômega Drive
             </h3>
             <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                <button 
                  onClick={() => setCurrentDrivePath(null)} 
                  onDragOver={(e) => handleDragOver(e, 'root', true)}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`hover:text-purple-400 p-1 rounded transition-colors ${dragOverFolderId === 'root' ? 'bg-purple-500/20 text-purple-400' : ''}`}
                >
                  Raiz
                </button>
                {breadcrumbs.map(bc => (
                  <React.Fragment key={bc.id}>
                    <ChevronRight className="w-3 h-3" />
                    <button 
                      onClick={() => setCurrentDrivePath(bc.id)} 
                      onDragOver={(e) => handleDragOver(e, bc.id, true)}
                      onDrop={(e) => handleDrop(e, bc.id)}
                      className={`hover:text-purple-400 max-w-[100px] truncate p-1 rounded transition-colors ${dragOverFolderId === bc.id ? 'bg-purple-500/20 text-purple-400' : ''}`}
                    >
                      {bc.name}
                    </button>
                  </React.Fragment>
                ))}
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateFolder} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-gray-400 hover:text-white transition-all">
              <FolderPlus className="w-4 h-4"/> PASTA
            </button>
            <button onClick={handleCreateFile} className="flex items-center gap-2 px-4 py-2 bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20 rounded-xl text-[10px] font-black text-[#14b8a6] hover:text-white transition-all border border-[#14b8a6]/20">
              <FilePlus className="w-4 h-4"/> DOCUMENTO
            </button>
          </div>
        </div>

        <div 
          className="bg-[#111] border border-white/5 rounded-[48px] p-8 min-h-[400px] relative overflow-hidden group shadow-2xl"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => draggedItemId && !dragOverFolderId && handleDrop(e, currentDrivePath)}
        >
           <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6 relative z-10">
              {currentDrivePath && (
                <button 
                  onClick={() => {
                    const current = drive.find(i => i.id === currentDrivePath);
                    setCurrentDrivePath(current?.parentId || null);
                  }}
                  className="flex flex-col items-center justify-center p-6 rounded-[32px] bg-white/[0.02] border border-dashed border-white/5 text-gray-600 hover:text-white hover:bg-white/5 transition-all h-[160px]"
                >
                  <ArrowLeft className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-black uppercase">Voltar</span>
                </button>
              )}
              
              {currentItems.map(item => (
                <div 
                  key={item.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id, item.type === 'FOLDER')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => item.type === 'FOLDER' && handleDrop(e, item.id)}
                  onClick={() => item.type === 'FOLDER' ? setCurrentDrivePath(item.id) : setEditingFile(item)}
                  className={`flex flex-col items-center justify-center p-6 rounded-[40px] border transition-all group/item relative h-[160px] cursor-grab active:cursor-grabbing ${
                    item.type === 'FOLDER' 
                      ? (dragOverFolderId === item.id ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-105' : 'bg-black/40 border-white/5 hover:border-purple-500/30') 
                      : (draggedItemId === item.id ? 'opacity-30' : 'bg-black/40 border-white/5 hover:border-blue-500/30')
                  }`}
                >
                  <button 
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="absolute top-4 right-4 p-2 text-gray-800 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {item.type === 'FOLDER' ? (
                    <div className={`w-16 h-12 rounded-lg relative mb-4 transition-transform group-hover/item:scale-110 ${dragOverFolderId === item.id ? 'bg-purple-400' : 'bg-purple-500/20'}`}>
                      <div className={`absolute top-[-4px] left-0 w-8 h-2 rounded-t-sm ${dragOverFolderId === item.id ? 'bg-purple-300' : 'bg-purple-500'}`}></div>
                    </div>
                  ) : (
                    <FileText className="w-12 h-12 text-blue-400/50 mb-4 transition-transform group-hover/item:scale-110" />
                  )}
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center truncate w-full px-2 group-hover/item:text-white transition-colors">
                    {item.name}
                  </span>
                </div>
              ))}

              {currentItems.length === 0 && !currentDrivePath && (
                <div className="col-span-full py-32 text-center opacity-20 italic flex flex-col items-center gap-4">
                  <FolderOpen className="w-12 h-12" />
                  <p className="text-xs font-black uppercase tracking-[0.4em]">Seu drive está vazio.</p>
                </div>
              )}
           </div>
        </div>
        <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest px-4">Dica: Arraste arquivos para cima de pastas para movê-los.</p>
      </section>

      {/* EDITOR DE DOCUMENTO (ÔMEGA DOCS) */}
      {editingFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 animate-in fade-in zoom-in duration-300">
           <div className="w-full max-w-5xl bg-[#111] border border-white/10 rounded-[64px] overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8)] h-[85vh]">
              <div className="p-10 bg-black/40 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                     <FileText className="w-6 h-6 text-blue-400" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingFile.name}</h3>
                     <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Ômega Document Cloud • Editando Agora</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <button onClick={() => setEditingFile(null)} className="px-6 py-3 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
                   <button onClick={handleSaveFile} className="flex items-center gap-2 px-10 py-3 bg-[#14b8a6] text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-[#14b8a6]/20 hover:scale-105 transition-all">
                    <Save className="w-4 h-4" /> SALVAR DOCUMENTO
                   </button>
                 </div>
              </div>
              <textarea 
                autoFocus
                value={editingFile.content || ''}
                onChange={(e) => setEditingFile({...editingFile, content: e.target.value})}
                placeholder="Comece a registrar as informações estratégicas aqui..."
                className="flex-1 w-full bg-transparent p-16 text-gray-300 text-xl outline-none resize-none font-medium leading-relaxed custom-scrollbar"
              />
           </div>
        </div>
      )}

      {/* --- RESTO DA WORKSPACE (TAREFAS E CLIENTES) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" /> Fila de Execução
            </h3>
            <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-500 font-black">{myTasks.filter(t => t.status === 'PENDING').length} PENDENTES</span>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-[48px] p-8 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">
            {myTasks.map(task => (
                <button key={task.id} onClick={() => onToggleTask(task.id)} className={`w-full flex items-center gap-4 p-6 rounded-[32px] border transition-all text-left ${task.status === 'COMPLETED' ? 'bg-black/40 border-transparent opacity-40' : 'bg-white/[0.03] border-white/5 hover:border-teal-500/20'}`}>
                  {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 text-teal-500" /> : <Circle className="w-5 h-5 text-gray-700" />}
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-tighter ${task.status === 'COMPLETED' ? 'text-gray-600 line-through' : 'text-white'}`}>{task.title}</p>
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{task.type}</span>
                  </div>
                </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 px-2">
            <Target className="w-4 h-4 text-teal-500" /> Gestão de Contas Ativas
          </h3>
          <div className="space-y-4">
            {myClients.map(client => (
              <div key={client.id} className="bg-[#111] border border-white/5 rounded-[48px] overflow-hidden transition-all duration-300">
                <div className={`p-10 cursor-pointer flex items-center justify-between hover:bg-white/[0.01] ${expandedFolder === client.id ? 'bg-white/[0.02]' : ''}`} onClick={() => setExpandedFolder(expandedFolder === client.id ? null : client.id)}>
                  <div className="flex items-center gap-6">
                    <div className={`w-3 h-3 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'} shadow-lg`}></div>
                    <div><h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">{client.name}</h4><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{client.industry}</p></div>
                  </div>
                  <div className="flex items-center gap-4">{expandedFolder === client.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}</div>
                </div>
                {expandedFolder === client.id && (
                  <div className="p-10 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-top-4">
                    <div className="space-y-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Info className="w-3 h-3 text-blue-400" /> Briefing Estratégico</label>
                        <textarea value={client.folder?.briefing || ''} onChange={(e) => onUpdateFolder(client.id, { briefing: e.target.value })} placeholder="Estratégia central..." className="w-full bg-black border border-white/5 rounded-3xl p-6 text-xs text-gray-400 min-h-[120px] outline-none focus:border-blue-500/30 transition-all resize-none" />
                      </div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><LinkIcon className="w-3 h-3 text-purple-400" /> Acessos & Links Rápidos</label>
                        <textarea value={client.folder?.accessLinks || ''} onChange={(e) => onUpdateFolder(client.id, { accessLinks: e.target.value })} placeholder="IDs, Links de Pastas..." className="w-full bg-black border border-white/5 rounded-3xl p-6 text-xs text-gray-400 min-h-[100px] outline-none focus:border-purple-500/30 transition-all resize-none" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><History className="w-3 h-3 text-teal-400" /> Log de Atividades</label>
                        <textarea value={client.folder?.operationalHistory || ''} onChange={(e) => onUpdateFolder(client.id, { operationalHistory: e.target.value })} placeholder="O que foi feito recentemente..." className="w-full bg-black border border-white/5 rounded-3xl p-6 text-xs text-gray-400 min-h-[120px] outline-none focus:border-teal-500/30 transition-all resize-none" />
                      </div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-600 uppercase flex items-center justify-between">Sinalizador de Urgência</label>
                         <div className="flex gap-3">
                            {(['GREEN', 'YELLOW', 'RED'] as ClientStatus[]).map(flag => (
                              <button key={flag} onClick={() => onUpdateStatusFlag(client.id, flag)} className={`flex-1 py-4 rounded-[20px] border transition-all ${client.statusFlag === flag ? (flag === 'GREEN' ? 'bg-green-500 border-green-400 text-black' : flag === 'YELLOW' ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-red-500 border-red-400 text-white') : 'bg-black border-white/5 text-gray-600 opacity-20'}`}>
                                <Flag className="w-4 h-4 mx-auto fill-current" />
                              </button>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerWorkspace;
