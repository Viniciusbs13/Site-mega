
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
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-24">
      <header>
        <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
          <FolderOpen className="w-6 h-6 md:w-8 md:h-8 text-[#14b8a6]" /> Minha Gestão
        </h2>
        <p className="text-[10px] md:text-sm text-gray-400 font-medium">Controle operacional e organização de ativos.</p>
      </header>

      {/* DRIVE SECTION */}
      <section className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
             <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full overflow-hidden max-w-full">
                <button onClick={() => setCurrentDrivePath(null)} className="hover:text-teal-400">HOME</button>
                {breadcrumbs.map(bc => (
                  <React.Fragment key={bc.id}>
                    <ChevronRight className="w-3 h-3 opacity-20 shrink-0" />
                    <button onClick={() => setCurrentDrivePath(bc.id)} className="hover:text-teal-400 truncate max-w-[80px] md:max-w-[120px]">{bc.name}</button>
                  </React.Fragment>
                ))}
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateFolder} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-xl text-[9px] font-black text-gray-400 border border-white/5">
              <FolderPlus className="w-4 h-4 text-purple-400"/> PASTA
            </button>
            <button onClick={handleCreateFile} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-[#14b8a6] rounded-xl text-[9px] font-black text-black">
              <FilePlus className="w-4 h-4"/> PLANILHA
            </button>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-[32px] md:rounded-[48px] p-6 md:p-10 min-h-[300px] md:min-h-[450px]">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
              {currentDrivePath && (
                <button onClick={() => setCurrentDrivePath(drive.find(i => i.id === currentDrivePath)?.parentId || null)} className="flex flex-col items-center justify-center p-4 rounded-[24px] md:rounded-[32px] bg-white/[0.02] border border-dashed border-white/10 text-gray-600 h-[140px] md:h-[180px]">
                  <ArrowLeft className="w-6 h-6 mb-2" />
                  <span className="text-[9px] font-black uppercase">VOLTAR</span>
                </button>
              )}
              {currentItems.map(item => (
                <div key={item.id} onClick={() => item.type === 'FOLDER' ? setCurrentDrivePath(item.id) : setEditingFile(item)} className="flex flex-col items-center justify-center p-4 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5 bg-black/40 hover:border-teal-500/40 transition-all group relative h-[140px] md:h-[180px] cursor-pointer">
                  <button onClick={(e) => handleDeleteItem(e, item.id)} className="absolute top-3 right-3 p-1.5 text-gray-800 hover:text-red-500 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                  {item.type === 'FOLDER' ? (
                    <div className="w-10 h-8 md:w-14 md:h-11 rounded-lg relative mb-3 bg-purple-500/20 shadow-lg shadow-purple-500/5">
                      <div className="absolute top-[-3px] left-0 w-6 md:w-8 h-1.5 md:h-2 rounded-t-sm bg-purple-500"></div>
                    </div>
                  ) : (
                    <div className="w-10 h-12 md:w-12 md:h-16 bg-white/5 border border-white/10 rounded-sm mb-3 flex items-center justify-center">
                      <TableIcon className="w-5 h-5 md:w-6 md:h-6 text-teal-400/50" />
                    </div>
                  )}
                  <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest text-center truncate w-full px-1">{item.name}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* EDITOR DE PLANILHA */}
      {editingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 md:p-6 animate-in fade-in zoom-in duration-300">
           <div className="w-full max-w-[98%] md:max-w-[95%] bg-[#0a0a0a] border border-white/10 rounded-3xl md:rounded-[48px] overflow-hidden flex flex-col h-[95vh] md:h-[90vh]">
              <div className="p-4 md:p-6 md:px-10 bg-black/40 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3 md:gap-6">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-500/10 rounded-lg flex items-center justify-center border border-teal-500/20">
                     <TableIcon className="w-4 h-4 md:w-5 md:h-5 text-teal-400" />
                   </div>
                   <div className="max-w-[120px] md:max-w-none">
                     <h3 className="text-xs md:text-lg font-black text-white italic uppercase tracking-tighter truncate">{editingFile.name}</h3>
                     <p className="text-[8px] md:text-[9px] text-gray-600 font-black uppercase">Ômega Sheets</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleSaveSheet} className="flex items-center gap-2 px-4 py-2 md:px-8 md:py-2.5 bg-[#14b8a6] text-black font-black uppercase text-[9px] rounded-lg">
                      <Save className="w-3.5 h-3.5" /> SALVAR
                    </button>
                    <button onClick={() => setEditingFile(null)} className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#111] p-2 md:p-6 custom-scrollbar">
                 <table className="w-full border-collapse bg-black/40 rounded-lg overflow-hidden min-w-[500px] md:min-w-[1000px]">
                   <thead>
                     <tr>
                       <th className="w-8 md:w-12 bg-black border border-white/10 text-[9px] text-gray-600 font-black p-2">#</th>
                       {sheetData[0]?.map((_, i) => (
                         <th key={i} className="bg-black border border-white/10 text-[9px] text-gray-400 font-black p-2 min-w-[100px] md:min-w-[150px]">
                           {getColLetter(i)}
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {sheetData.map((row, rIdx) => (
                       <tr key={rIdx}>
                         <td className="bg-black border border-white/10 text-[9px] text-gray-600 font-black text-center p-2">{rIdx + 1}</td>
                         {row.map((cell, cIdx) => (
                           <td key={cIdx} className="border border-white/5 p-0">
                             <input value={cell} onChange={(e) => updateCell(rIdx, cIdx, e.target.value)} className="w-full h-full bg-transparent text-gray-300 text-[10px] md:text-xs p-2 md:p-3 outline-none" />
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
              <div className="p-3 bg-black/20 border-t border-white/5 px-6 md:px-10 flex gap-4 overflow-x-auto">
                <button onClick={addRow} className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded-lg text-[8px] font-black text-gray-300 uppercase">+ LINHA</button>
                <button onClick={addCol} className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded-lg text-[8px] font-black text-gray-300 uppercase">+ COLUNA</button>
              </div>
           </div>
        </div>
      )}

      {/* TASK & CLIENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" /> FILA DIÁRIA
            </h3>
            <span className="text-[9px] bg-white/5 px-3 py-1.5 rounded-full text-gray-500 font-black italic">{myTasks.filter(t => t.status === 'PENDING').length} PENDENTES</span>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-4 md:p-8 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {myTasks.map(task => (
                <button key={task.id} onClick={() => onToggleTask(task.id)} className={`w-full flex items-center gap-4 p-4 md:p-6 rounded-2xl md:rounded-[32px] border transition-all text-left ${task.status === 'COMPLETED' ? 'bg-black/40 opacity-40' : 'bg-white/[0.03] border-white/5'}`}>
                  {task.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" /> : <Circle className="w-4 h-4 text-gray-700 shrink-0" />}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase truncate ${task.status === 'COMPLETED' ? 'text-gray-600 line-through' : 'text-white'}`}>{task.title}</p>
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{task.type}</span>
                  </div>
                </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 px-2">
            <Target className="w-4 h-4 text-teal-500" /> GESTÃO DE CONTAS SQUAD
          </h3>
          <div className="space-y-4">
            {myClients.map(client => (
              <div key={client.id} className="bg-[#111] border border-white/5 rounded-[24px] md:rounded-[48px] overflow-hidden">
                <div className={`p-6 md:p-10 cursor-pointer flex items-center justify-between hover:bg-white/[0.01]`} onClick={() => setExpandedFolder(expandedFolder === client.id ? null : client.id)}>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className={`w-2.5 h-2.5 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <div className="min-w-0">
                      <h4 className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter italic truncate">{client.name}</h4>
                      <p className="text-[9px] md:text-[10px] text-gray-600 font-black uppercase tracking-widest">{client.industry}</p>
                    </div>
                  </div>
                  <div className="text-gray-600">{expandedFolder === client.id ? <ChevronUp /> : <ChevronDown />}</div>
                </div>
                {expandedFolder === client.id && (
                  <div className="p-6 md:p-10 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 animate-in slide-in-from-top-4">
                    <div className="space-y-4 md:space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">Briefing</label>
                        <textarea value={client.folder?.briefing || ''} onChange={(e) => onUpdateFolder(client.id, { briefing: e.target.value })} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-[11px] text-gray-400 min-h-[100px] outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">Acessos</label>
                        <textarea value={client.folder?.accessLinks || ''} onChange={(e) => onUpdateFolder(client.id, { accessLinks: e.target.value })} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-[11px] text-gray-400 min-h-[80px] outline-none" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">Log Operacional</label>
                        <textarea value={client.folder?.operationalHistory || ''} onChange={(e) => onUpdateFolder(client.id, { operationalHistory: e.target.value })} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-[11px] text-gray-400 min-h-[100px] outline-none" />
                      </div>
                      <div className="space-y-3">
                         <div className="flex gap-2">
                            {(['GREEN', 'YELLOW', 'RED'] as ClientStatus[]).map(flag => (
                              <button key={flag} onClick={() => onUpdateStatusFlag(client.id, flag)} className={`flex-1 py-3 rounded-xl border transition-all ${client.statusFlag === flag ? (flag === 'GREEN' ? 'bg-green-500 border-green-400 text-black' : flag === 'YELLOW' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white') : 'bg-black border-white/5 text-gray-600 opacity-20'}`}>
                                <Flag className="w-3.5 h-3.5 mx-auto" />
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
