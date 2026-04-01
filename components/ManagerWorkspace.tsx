
import React, { useState, useEffect } from 'react';
import { Client, Task, ClientStatus, User, DriveItem } from '../types';
import { CheckCircle2, Circle, Target, Flag, FolderOpen, Info, Link as LinkIcon, History, ChevronDown, ChevronUp, FileText, FolderPlus, FilePlus, ChevronRight, Trash2, ArrowLeft, Save, X, Plus, Minus, Table as TableIcon } from 'lucide-react';

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
  const [sheetData, setSheetData] = useState<string[][]>([[""]]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const currentItems = drive.filter(item => item.parentId === currentDrivePath);
  
  useEffect(() => {
    if (editingFile) {
      try {
        const parsed = JSON.parse(editingFile.content || '[["","",""],["","",""],["","",""]]');
        setSheetData(parsed);
      } catch (e) {
        setSheetData([["", "", ""], ["", "", ""], ["", "", ""]]);
      }
    }
  }, [editingFile]);

  const breadcrumbs = [];
  let tempPath = currentDrivePath;
  while (tempPath) {
    const parent = drive.find(i => i.id === tempPath);
    if (parent) {
      breadcrumbs.unshift(parent);
      tempPath = parent.parentId;
    } else break;
  }

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
    const name = prompt('Nome da Planilha:');
    if (!name) return;
    const initialSheet = JSON.stringify([["", "", ""], ["", "", ""], ["", "", ""]]);
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FILE',
      content: initialSheet,
      parentId: currentDrivePath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateDrive([...drive, newItem]);
    setEditingFile(newItem);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Excluir permanentemente?')) {
      const itemsToDelete = new Set<string>();
      const collectToDelete = (targetId: string) => {
        itemsToDelete.add(targetId);
        drive.filter(i => i.parentId === targetId).forEach(child => collectToDelete(child.id));
      };
      collectToDelete(id);
      onUpdateDrive(drive.filter(i => !itemsToDelete.has(i.id)));
    }
  };

  const handleSaveSheet = () => {
    if (!editingFile) return;
    const updatedFile = { ...editingFile, content: JSON.stringify(sheetData) };
    onUpdateDrive(drive.map(i => i.id === editingFile.id ? updatedFile : i));
    setEditingFile(null);
  };

  const updateCell = (r: number, c: number, val: string) => {
    const newData = sheetData.map((row, ri) => 
      ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row
    );
    setSheetData(newData);
  };

  const addRow = () => setSheetData([...sheetData, new Array(sheetData[0]?.length || 1).fill("")]);
  const addCol = () => setSheetData(sheetData.map(row => [...row, ""]));
  const removeRow = (idx: number) => {
    if (sheetData.length <= 1) return;
    setSheetData(sheetData.filter((_, i) => i !== idx));
  };
  const removeCol = (idx: number) => {
    if (sheetData[0].length <= 1) return;
    setSheetData(sheetData.map(row => row.filter((_, i) => i !== idx)));
  };

  const getColLetter = (n: number) => String.fromCharCode(65 + n);
  const myClients = clients.filter(c => c.managerId === currentUser.id && !c.isPaused);
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-24 font-['General_Sans']">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <FolderOpen className="w-6 h-6 text-[#14b8a6]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight italic uppercase leading-none text-gradient">Minha Gestão</h2>
            <p className="text-[10px] md:text-[11px] font-medium text-white/40 uppercase tracking-[0.3em] mt-2">Controle operacional e organização de ativos.</p>
          </div>
        </div>
      </header>

      {/* DRIVE SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-xl">
                <button onClick={() => setCurrentDrivePath(null)} className="hover:text-[#14b8a6] transition-colors">HOME</button>
                {breadcrumbs.map(bc => (
                  <React.Fragment key={bc.id}>
                    <ChevronRight className="w-3.5 h-3.5 opacity-20 shrink-0" />
                    <button onClick={() => setCurrentDrivePath(bc.id)} className="hover:text-[#14b8a6] transition-colors truncate max-w-[150px]">{bc.name}</button>
                  </React.Fragment>
                ))}
             </div>
          </div>
          <div className="flex gap-4">
            <button onClick={handleCreateFolder} className="flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-bold text-white/60 uppercase tracking-widest border border-white/10 transition-all backdrop-blur-xl">
              <FolderPlus className="w-4.5 h-4.5 text-purple-400"/> PASTA
            </button>
            <button onClick={handleCreateFile} className="flex items-center justify-center gap-3 px-8 py-3 bg-white text-black rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl">
              <FilePlus className="w-4.5 h-4.5"/> PLANILHA
            </button>
          </div>
        </div>

        <div className="glass-card p-10 md:p-16 min-h-[450px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12">
              {currentDrivePath && (
                <button onClick={() => setCurrentDrivePath(drive.find(i => i.id === currentDrivePath)?.parentId || null)} className="flex flex-col items-center justify-center p-10 rounded-[48px] bg-white/5 border border-dashed border-white/10 text-white/20 h-[220px] hover:border-[#14b8a6]/40 hover:text-white transition-all">
                  <ArrowLeft className="w-8 h-8 mb-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">VOLTAR</span>
                </button>
              )}
              {currentItems.map(item => (
                <div key={item.id} onClick={() => item.type === 'FOLDER' ? setCurrentDrivePath(item.id) : setEditingFile(item)} className="flex flex-col items-center justify-center p-10 rounded-[48px] border border-white/5 bg-white/[0.02] hover:border-[#14b8a6]/40 hover:bg-white/[0.05] transition-all group relative h-[220px] cursor-pointer shadow-2xl backdrop-blur-xl">
                  <button onClick={(e) => handleDeleteItem(e, item.id)} className="absolute top-6 right-6 p-2 text-white/10 hover:text-red-500 transition-all bg-white/5 rounded-xl opacity-0 group-hover:opacity-100"><Trash2 className="w-4.5 h-4.5" /></button>
                  {item.type === 'FOLDER' ? (
                    <div className="w-16 h-12 rounded-xl relative mb-6 bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.2)] border border-purple-500/20">
                      <div className="absolute top-[-4px] left-0 w-10 h-3 rounded-t-lg bg-purple-500"></div>
                    </div>
                  ) : (
                    <div className="w-14 h-18 bg-white/5 border border-white/10 rounded-lg mb-6 flex items-center justify-center shadow-2xl">
                      <TableIcon className="w-8 h-8 text-[#14b8a6]/40" />
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest text-center truncate w-full px-2 group-hover:text-white transition-colors">{item.name}</span>
                </div>
              ))}
              {currentItems.length === 0 && !currentDrivePath && (
                <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-10">
                  <FolderOpen className="w-24 h-24 mb-6" />
                  <p className="text-sm font-bold uppercase tracking-[0.4em]">Drive vazio</p>
                </div>
              )}
           </div>
        </div>
      </section>

      {/* EDITOR DE PLANILHA */}
      {editingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-8 animate-in fade-in zoom-in duration-500">
           <div className="w-full max-w-[95%] glass-card border-white/10 overflow-hidden flex flex-col h-[90vh] shadow-[0_0_150px_rgba(0,0,0,0.8)]">
              <div className="px-12 py-8 bg-white/5 border-b border-white/10 flex items-center justify-between backdrop-blur-3xl">
                 <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-[#14b8a6]/10 rounded-2xl flex items-center justify-center border border-[#14b8a6]/20 shadow-2xl">
                     <TableIcon className="w-7 h-7 text-[#14b8a6]" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-white italic uppercase tracking-tighter text-gradient">{editingFile.name}</h3>
                     <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1">Ômega Sheets</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-5">
                    <button onClick={handleSaveSheet} className="flex items-center gap-3 px-10 py-4 bg-white text-black font-bold uppercase text-[11px] rounded-full tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl">
                      <Save className="w-4.5 h-4.5" /> SALVAR
                    </button>
                    <button onClick={() => setEditingFile(null)} className="p-4 text-white/20 hover:text-white bg-white/5 rounded-full border border-white/5 transition-all">
                      <X className="w-6 h-6" />
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-black/40 p-12 custom-scrollbar">
                 <table className="w-full border-collapse bg-white/[0.02] rounded-[32px] overflow-hidden min-w-[1200px] border border-white/5">
                   <thead>
                     <tr>
                       <th className="w-16 bg-white/5 border-b border-white/10 text-[10px] text-white/20 font-bold p-4">#</th>
                       {sheetData[0]?.map((_, i) => (
                         <th key={i} className="bg-white/5 border-b border-white/10 text-[10px] text-white/40 font-bold p-4 tracking-widest">
                           {getColLetter(i)}
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {sheetData.map((row, rIdx) => (
                       <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                         <td className="bg-white/5 border-r border-white/10 text-[10px] text-white/20 font-bold text-center p-4">{rIdx + 1}</td>
                         {row.map((cell, cIdx) => (
                           <td key={cIdx} className="border border-white/5 p-0">
                             <input value={cell} onChange={(e) => updateCell(rIdx, cIdx, e.target.value)} className="w-full h-full bg-transparent text-white/60 text-sm p-6 outline-none focus:bg-[#14b8a6]/5 focus:text-white transition-all font-medium" />
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
              <div className="p-6 bg-white/5 border-t border-white/10 px-12 flex gap-6 backdrop-blur-3xl">
                <button onClick={addRow} className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/5 transition-all">+ LINHA</button>
                <button onClick={addCol} className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/5 transition-all">+ COLUNA</button>
              </div>
           </div>
        </div>
      )}

      {/* TASK & CLIENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#14b8a6]" /> FILA DIÁRIA
            </h3>
            <span className="text-[10px] bg-[#14b8a6]/10 px-4 py-2 rounded-full text-[#14b8a6] font-bold italic border border-[#14b8a6]/20">{myTasks.filter(t => t.status === 'PENDING').length} PENDENTES</span>
          </div>
          <div className="glass-card p-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar border-white/10">
            {myTasks.length === 0 ? (
              <div className="py-20 text-center opacity-20">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Sem tarefas</p>
              </div>
            ) : (
              myTasks.map(task => (
                  <button key={task.id} onClick={() => onToggleTask(task.id)} className={`w-full flex items-center gap-5 p-6 rounded-[32px] border transition-all text-left group ${task.status === 'COMPLETED' ? 'bg-white/[0.02] border-white/5 opacity-40' : 'bg-white/5 border-white/10 hover:border-[#14b8a6]/40 hover:bg-white/[0.08]'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${task.status === 'COMPLETED' ? 'bg-[#14b8a6] border-[#14b8a6] text-black' : 'border-white/20 group-hover:border-[#14b8a6]'}`}>
                      {task.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#14b8a6]" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold uppercase italic tracking-tight truncate ${task.status === 'COMPLETED' ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</p>
                      <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em]">{task.type}</span>
                    </div>
                  </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-3 px-4">
            <Target className="w-5 h-5 text-[#14b8a6]" /> GESTÃO DE CONTAS SQUAD
          </h3>
          <div className="space-y-6">
            {myClients.length === 0 ? (
              <div className="glass-card p-32 text-center border-dashed border-white/10">
                <Target className="w-16 h-16 mx-auto mb-6 opacity-5" />
                <p className="text-white/20 font-bold uppercase text-[11px] tracking-[0.3em]">Nenhuma conta atribuída.</p>
              </div>
            ) : (
              myClients.map(client => (
                <div key={client.id} className="glass-card border-white/10 overflow-hidden hover:border-[#14b8a6]/20 transition-all">
                  <div className={`p-8 md:p-12 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-all`} onClick={() => setExpandedFolder(expandedFolder === client.id ? null : client.id)}>
                    <div className="flex items-center gap-6 md:gap-10">
                      <div className={`w-3.5 h-3.5 rounded-full shadow-2xl ${client.statusFlag === 'GREEN' ? 'bg-green-500 shadow-green-500/40' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500 shadow-yellow-500/40' : 'bg-red-500 shadow-red-500/40'}`}></div>
                      <div className="min-w-0">
                        <h4 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-tighter italic leading-none text-gradient">{client.name}</h4>
                        <p className="text-[10px] md:text-[11px] text-white/30 font-bold uppercase tracking-[0.3em] mt-2">{client.industry}</p>
                      </div>
                    </div>
                    <div className="text-white/20 group-hover:text-white transition-colors">{expandedFolder === client.id ? <ChevronUp /> : <ChevronDown />}</div>
                  </div>
                  {expandedFolder === client.id && (
                    <div className="p-8 md:p-12 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 animate-in slide-in-from-top-4 duration-500">
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4 flex items-center gap-2">Briefing Estratégico</label>
                          <textarea value={client.folder?.briefing || ''} onChange={(e) => onUpdateFolder(client.id, { briefing: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm text-white/60 min-h-[150px] outline-none focus:border-[#14b8a6] transition-all resize-none" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4 flex items-center gap-2">Acessos & Credenciais</label>
                          <textarea value={client.folder?.accessLinks || ''} onChange={(e) => onUpdateFolder(client.id, { accessLinks: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm text-white/60 min-h-[100px] outline-none focus:border-[#14b8a6] transition-all resize-none" />
                        </div>
                      </div>
                      <div className="space-y-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4 flex items-center gap-2">Log Operacional</label>
                          <textarea value={client.folder?.operationalHistory || ''} onChange={(e) => onUpdateFolder(client.id, { operationalHistory: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm text-white/60 min-h-[150px] outline-none focus:border-[#14b8a6] transition-all resize-none" />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Status da Conta</label>
                           <div className="flex gap-3">
                              {(['GREEN', 'YELLOW', 'RED'] as ClientStatus[]).map(flag => (
                                <button key={flag} onClick={() => onUpdateStatusFlag(client.id, flag)} className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center ${client.statusFlag === flag ? (flag === 'GREEN' ? 'bg-green-500 border-green-400 text-black shadow-[0_0_30px_rgba(34,197,94,0.3)]' : flag === 'YELLOW' ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'bg-red-500 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]') : 'bg-white/5 border-white/5 text-white/10 hover:text-white'}`}>
                                  <Flag className="w-4 h-4" />
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

  );
};

export default ManagerWorkspace;
