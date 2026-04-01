
import React, { useState, useEffect } from 'react';
import { DriveItem, Notice, User, DefaultUserRole } from '../types';
import { 
  FolderOpen, FolderPlus, FilePlus, ChevronRight, Trash2, ArrowLeft, Save, X, Plus, 
  Table as TableIcon, Megaphone, Bell, Clock, User as UserIcon, AlertCircle, 
  ChevronDown, ChevronUp, FileText, Send
} from 'lucide-react';

interface KnowledgeBaseProps {
  wiki: DriveItem[];
  notices: Notice[];
  currentUser: User;
  onUpdateWiki: (items: DriveItem[]) => void;
  onUpdateNotices: (notices: Notice[]) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ 
  wiki, notices, currentUser, onUpdateWiki, onUpdateNotices 
}) => {
  const [activeTab, setActiveTab] = useState<'WIKI' | 'NOTICES'>('NOTICES');
  const [currentWikiPath, setCurrentWikiPath] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<DriveItem | null>(null);
  const [sheetData, setSheetData] = useState<string[][]>([[""]]);
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', priority: 'LOW' as Notice['priority'] });

  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const currentWikiItems = wiki.filter(item => item.parentId === currentWikiPath);

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

  const wikiBreadcrumbs = [];
  let tempPath = currentWikiPath;
  while (tempPath) {
    const parent = wiki.find(i => i.id === tempPath);
    if (parent) {
      wikiBreadcrumbs.unshift(parent);
      tempPath = parent.parentId;
    } else break;
  }

  const handleCreateFolder = () => {
    if (!isCEO) return;
    const name = prompt('Nome da Pasta:');
    if (!name) return;
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FOLDER',
      parentId: currentWikiPath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateWiki([...wiki, newItem]);
  };

  const handleCreateFile = () => {
    if (!isCEO) return;
    const name = prompt('Nome do Documento:');
    if (!name) return;
    const initialSheet = JSON.stringify([["", "", ""], ["", "", ""], ["", "", ""]]);
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FILE',
      content: initialSheet,
      parentId: currentWikiPath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateWiki([...wiki, newItem]);
    setEditingFile(newItem);
  };

  const handleDeleteWikiItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isCEO) return;
    if (confirm('Excluir permanentemente?')) {
      const itemsToDelete = new Set<string>();
      const collectToDelete = (targetId: string) => {
        itemsToDelete.add(targetId);
        wiki.filter(i => i.parentId === targetId).forEach(child => collectToDelete(child.id));
      };
      collectToDelete(id);
      onUpdateWiki(wiki.filter(i => !itemsToDelete.has(i.id)));
    }
  };

  const handleSaveSheet = () => {
    if (!editingFile) return;
    const updatedFile = { ...editingFile, content: JSON.stringify(sheetData) };
    onUpdateWiki(wiki.map(i => i.id === editingFile.id ? updatedFile : i));
    setEditingFile(null);
  };

  const updateCell = (r: number, c: number, val: string) => {
    const newData = sheetData.map((row, ri) => 
      ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row
    );
    setSheetData(newData);
  };

  const handleCreateNotice = () => {
    if (!newNotice.title || !newNotice.content) return;
    const notice: Notice = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNotice.title,
      content: newNotice.content,
      priority: newNotice.priority,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString()
    };
    onUpdateNotices([notice, ...notices]);
    setIsCreatingNotice(false);
    setNewNotice({ title: '', content: '', priority: 'LOW' });
  };

  const handleDeleteNotice = (id: string) => {
    if (!isCEO) return;
    if (confirm('Excluir este comunicado?')) {
      onUpdateNotices(notices.filter(n => n.id !== id));
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24 font-['General_Sans']">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
            <FolderOpen className="w-6 h-6 text-[#14b8a6]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight italic uppercase leading-none text-gradient">Wiki & Comunicados</h2>
            <p className="text-[10px] md:text-[11px] font-medium text-white/40 uppercase tracking-[0.3em] mt-2">Base de conhecimento e avisos da Ômega.</p>
          </div>
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab('NOTICES')} 
            className={`px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'NOTICES' ? 'bg-white text-black shadow-2xl' : 'text-white/40 hover:text-white'}`}
          >
            Comunicados
          </button>
          <button 
            onClick={() => setActiveTab('WIKI')} 
            className={`px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'WIKI' ? 'bg-white text-black shadow-2xl' : 'text-white/40 hover:text-white'}`}
          >
            Wiki Interna
          </button>
        </div>
      </header>

      {activeTab === 'NOTICES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            {isCEO && (
              <div className="glass-card p-10 space-y-8 border-white/10">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-[#14b8a6]" /> Novo Comunicado
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Título do Aviso</label>
                    <input 
                      placeholder="Título do Aviso"
                      value={newNotice.title}
                      onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-[#14b8a6] transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-4">Conteúdo Detalhado</label>
                    <textarea 
                      placeholder="Conteúdo detalhado..."
                      value={newNotice.content}
                      onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-sm text-white outline-none focus:border-[#14b8a6] transition-all min-h-[150px] resize-none placeholder:text-white/10"
                    />
                  </div>
                  <div className="flex gap-3">
                    {(['LOW', 'MEDIUM', 'HIGH'] as Notice['priority'][]).map(p => (
                      <button 
                        key={p}
                        onClick={() => setNewNotice({...newNotice, priority: p})}
                        className={`flex-1 py-3 rounded-full text-[9px] font-bold uppercase border transition-all ${newNotice.priority === p ? 'bg-white text-black border-white shadow-2xl' : 'bg-white/5 border-white/5 text-white/20 hover:text-white'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleCreateNotice}
                    className="w-full py-5 bg-white text-black font-bold uppercase text-sm rounded-full flex items-center justify-center gap-3 tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl"
                  >
                    <Send className="w-5 h-5" /> PUBLICAR
                  </button>
                </div>
              </div>
            )}
            <div className="glass-card p-10 border-white/10">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#14b8a6]/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#14b8a6]" />
                  </div>
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.3em]">Dicas Ômega</h3>
               </div>
               <p className="text-xs text-white/40 leading-relaxed font-medium">
                 Mantenha-se atualizado com as diretrizes da empresa. Novos briefings e processos são postados aqui regularmente para garantir a excelência operacional.
               </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {notices.length === 0 ? (
              <div className="glass-card p-32 flex flex-col items-center justify-center text-center border-dashed border-white/10">
                <Megaphone className="w-16 h-16 text-white/5 mb-6" />
                <p className="text-white/20 font-bold uppercase text-[11px] tracking-[0.3em]">Nenhum comunicado no momento.</p>
              </div>
            ) : (
              notices.map(notice => (
                <div key={notice.id} className="glass-card p-10 md:p-14 space-y-8 relative group overflow-hidden border-white/10 hover:border-[#14b8a6]/20 transition-all">
                  {notice.priority === 'HIGH' && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${notice.priority === 'HIGH' ? 'bg-red-500/10 text-red-500 border-red-500/20' : notice.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20'}`}>
                          {notice.priority} PRIORITY
                        </span>
                        <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-3xl md:text-5xl font-bold text-white uppercase italic tracking-tighter text-gradient leading-none">{notice.title}</h4>
                    </div>
                    {isCEO && (
                      <button onClick={() => handleDeleteNotice(notice.id)} className="p-3 text-white/10 hover:text-red-500 transition-all bg-white/5 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="text-white/60 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {notice.content}
                  </div>
                  <div className="pt-10 border-t border-white/5 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-[#14b8a6] italic shadow-2xl">
                      {notice.authorName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tight italic">{notice.authorName}</p>
                      <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] mt-1">Autor do Comunicado</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-xl">
                  <button onClick={() => setCurrentWikiPath(null)} className="hover:text-[#14b8a6] transition-colors">WIKI HOME</button>
                  {wikiBreadcrumbs.map(bc => (
                    <React.Fragment key={bc.id}>
                      <ChevronRight className="w-3.5 h-3.5 opacity-20 shrink-0" />
                      <button onClick={() => setCurrentWikiPath(bc.id)} className="hover:text-[#14b8a6] transition-colors truncate max-w-[150px]">{bc.name}</button>
                    </React.Fragment>
                  ))}
               </div>
            </div>
            {isCEO && (
              <div className="flex gap-4">
                <button onClick={handleCreateFolder} className="flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-bold text-white/60 uppercase tracking-widest border border-white/10 transition-all backdrop-blur-xl">
                  <FolderPlus className="w-4.5 h-4.5 text-purple-400"/> PASTA
                </button>
                <button onClick={handleCreateFile} className="flex items-center justify-center gap-3 px-8 py-3 bg-white text-black rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl">
                  <FilePlus className="w-4.5 h-4.5"/> DOCUMENTO
                </button>
              </div>
            )}
          </div>

          <div className="glass-card p-10 md:p-16 min-h-[600px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12">
                {currentWikiPath && (
                  <button onClick={() => setCurrentWikiPath(wiki.find(i => i.id === currentWikiPath)?.parentId || null)} className="flex flex-col items-center justify-center p-10 rounded-[48px] bg-white/5 border border-dashed border-white/10 text-white/20 h-[220px] hover:border-[#14b8a6]/40 hover:text-white transition-all">
                    <ArrowLeft className="w-8 h-8 mb-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">VOLTAR</span>
                  </button>
                )}
                {currentWikiItems.map(item => (
                  <div key={item.id} onClick={() => item.type === 'FOLDER' ? setCurrentWikiPath(item.id) : setEditingFile(item)} className="flex flex-col items-center justify-center p-10 rounded-[48px] border border-white/5 bg-white/[0.02] hover:border-[#14b8a6]/40 hover:bg-white/[0.05] transition-all group relative h-[220px] cursor-pointer shadow-2xl backdrop-blur-xl">
                    {isCEO && (
                      <button onClick={(e) => handleDeleteWikiItem(e, item.id)} className="absolute top-6 right-6 p-2 text-white/10 hover:text-red-500 transition-all bg-white/5 rounded-xl opacity-0 group-hover:opacity-100"><Trash2 className="w-4.5 h-4.5" /></button>
                    )}
                    {item.type === 'FOLDER' ? (
                      <div className="w-16 h-12 rounded-xl relative mb-6 bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.2)] border border-purple-500/20">
                        <div className="absolute top-[-4px] left-0 w-10 h-3 rounded-t-lg bg-purple-500"></div>
                      </div>
                    ) : (
                      <div className="w-14 h-18 bg-white/5 border border-white/10 rounded-lg mb-6 flex items-center justify-center shadow-2xl">
                        <FileText className="w-8 h-8 text-[#14b8a6]/40" />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest text-center truncate w-full px-2 group-hover:text-white transition-colors">{item.name}</span>
                  </div>
                ))}
                {currentWikiItems.length === 0 && !currentWikiPath && (
                  <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-10">
                    <FolderOpen className="w-24 h-24 mb-6" />
                    <p className="text-sm font-bold uppercase tracking-[0.4em]">Wiki vazia</p>
                  </div>
                )}
             </div>
          </div>
        </section>
      )}

      {editingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-8 animate-in fade-in zoom-in duration-500">
           <div className="w-full max-w-[95%] glass-card border-white/10 overflow-hidden flex flex-col h-[90vh] shadow-[0_0_150px_rgba(0,0,0,0.8)]">
              <div className="px-12 py-8 bg-white/5 border-b border-white/10 flex items-center justify-between backdrop-blur-3xl">
                 <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-[#14b8a6]/10 rounded-2xl flex items-center justify-center border border-[#14b8a6]/20 shadow-2xl">
                     <FileText className="w-7 h-7 text-[#14b8a6]" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-white italic uppercase tracking-tighter text-gradient">{editingFile.name}</h3>
                     <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1">Documento Operacional Wiki</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-5">
                    {isCEO && (
                      <button onClick={handleSaveSheet} className="flex items-center gap-3 px-10 py-4 bg-white text-black font-bold uppercase text-[11px] rounded-full tracking-widest hover:bg-[#14b8a6] transition-all shadow-2xl">
                        <Save className="w-4.5 h-4.5" /> SALVAR PROTOCOLO
                      </button>
                    )}
                    <button onClick={() => setEditingFile(null)} className="p-4 text-white/20 hover:text-white bg-white/5 rounded-full border border-white/5 transition-all">
                      <X className="w-6 h-6" />
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-black/40 p-12 custom-scrollbar">
                 <table className="w-full border-collapse bg-white/[0.02] rounded-[32px] overflow-hidden min-w-[1200px] border border-white/5">
                   <tbody>
                     {sheetData.map((row, rIdx) => (
                       <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                         {row.map((cell, cIdx) => (
                           <td key={cIdx} className="border border-white/5 p-0">
                             <input 
                               value={cell} 
                               readOnly={!isCEO}
                               onChange={(e) => updateCell(rIdx, cIdx, e.target.value)} 
                               className="w-full h-full bg-transparent text-white/60 text-sm p-6 outline-none focus:bg-[#14b8a6]/5 focus:text-white transition-all font-medium" 
                             />
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
              {isCEO && (
                <div className="p-6 bg-white/5 border-t border-white/10 px-12 flex gap-6 backdrop-blur-3xl">
                  <button onClick={() => setSheetData([...sheetData, new Array(sheetData[0]?.length || 1).fill("")])} className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/5 transition-all">+ ADICIONAR LINHA</button>
                  <button onClick={() => setSheetData(sheetData.map(row => [...row, ""]))} className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest border border-white/5 transition-all">+ ADICIONAR COLUNA</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
