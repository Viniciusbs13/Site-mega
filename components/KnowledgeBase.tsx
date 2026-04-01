
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-[#14b8a6]" /> Wiki & Comunicados
          </h2>
          <p className="text-[10px] md:text-sm text-gray-400 font-medium">Base de conhecimento e avisos da Ômega.</p>
        </div>
        <div className="flex bg-[#111] p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('NOTICES')} 
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'NOTICES' ? 'bg-[#14b8a6] text-black' : 'text-gray-500 hover:text-white'}`}
          >
            Comunicados
          </button>
          <button 
            onClick={() => setActiveTab('WIKI')} 
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'WIKI' ? 'bg-[#14b8a6] text-black' : 'text-gray-500 hover:text-white'}`}
          >
            Wiki Interna
          </button>
        </div>
      </header>

      {activeTab === 'NOTICES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {isCEO && (
              <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 space-y-6">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-teal-500" /> Novo Comunicado
                </h3>
                <div className="space-y-4">
                  <input 
                    placeholder="Título do Aviso"
                    value={newNotice.title}
                    onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-teal-500/50"
                  />
                  <textarea 
                    placeholder="Conteúdo detalhado..."
                    value={newNotice.content}
                    onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-teal-500/50 min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as Notice['priority'][]).map(p => (
                      <button 
                        key={p}
                        onClick={() => setNewNotice({...newNotice, priority: p})}
                        className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase border transition-all ${newNotice.priority === p ? 'bg-white text-black border-white' : 'bg-black border-white/5 text-gray-600'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleCreateNotice}
                    className="w-full py-3 bg-[#14b8a6] text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> PUBLICAR
                  </button>
                </div>
              </div>
            )}
            <div className="bg-[#111] border border-white/5 rounded-[32px] p-8">
               <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-5 h-5 text-teal-500" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Dicas Ômega</h3>
               </div>
               <p className="text-xs text-gray-500 leading-relaxed">
                 Mantenha-se atualizado com as diretrizes da empresa. Novos briefings e processos são postados aqui regularmente.
               </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {notices.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-[48px] p-20 flex flex-col items-center justify-center text-center">
                <Megaphone className="w-12 h-12 text-gray-800 mb-4" />
                <p className="text-gray-600 font-black uppercase text-xs">Nenhum comunicado no momento.</p>
              </div>
            ) : (
              notices.map(notice => (
                <div key={notice.id} className="bg-[#111] border border-white/5 rounded-[32px] md:rounded-[48px] p-6 md:p-10 space-y-6 relative group overflow-hidden">
                  {notice.priority === 'HIGH' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${notice.priority === 'HIGH' ? 'bg-red-500/20 text-red-500' : notice.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-teal-500/20 text-teal-500'}`}>
                          {notice.priority} PRIORITY
                        </span>
                        <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter">{notice.title}</h4>
                    </div>
                    {isCEO && (
                      <button onClick={() => handleDeleteNotice(notice.id)} className="p-2 text-gray-800 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                    {notice.content}
                  </div>
                  <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-teal-500">
                      {notice.authorName[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">{notice.authorName}</p>
                      <p className="text-[8px] text-gray-600 font-black uppercase">Autor do Comunicado</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full overflow-hidden">
                  <button onClick={() => setCurrentWikiPath(null)} className="hover:text-teal-400">WIKI HOME</button>
                  {wikiBreadcrumbs.map(bc => (
                    <React.Fragment key={bc.id}>
                      <ChevronRight className="w-3 h-3 opacity-20 shrink-0" />
                      <button onClick={() => setCurrentWikiPath(bc.id)} className="hover:text-teal-400 truncate max-w-[120px]">{bc.name}</button>
                    </React.Fragment>
                  ))}
               </div>
            </div>
            {isCEO && (
              <div className="flex gap-2">
                <button onClick={handleCreateFolder} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 rounded-xl text-[9px] font-black text-gray-400 border border-white/5">
                  <FolderPlus className="w-4 h-4 text-purple-400"/> PASTA
                </button>
                <button onClick={handleCreateFile} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#14b8a6] rounded-xl text-[9px] font-black text-black">
                  <FilePlus className="w-4 h-4"/> DOCUMENTO
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#111] border border-white/5 rounded-[48px] p-6 md:p-12 min-h-[500px]">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10">
                {currentWikiPath && (
                  <button onClick={() => setCurrentWikiPath(wiki.find(i => i.id === currentWikiPath)?.parentId || null)} className="flex flex-col items-center justify-center p-8 rounded-[40px] bg-white/[0.02] border border-dashed border-white/10 text-gray-600 h-[180px]">
                    <ArrowLeft className="w-6 h-6 mb-2" />
                    <span className="text-[9px] font-black uppercase">VOLTAR</span>
                  </button>
                )}
                {currentWikiItems.map(item => (
                  <div key={item.id} onClick={() => item.type === 'FOLDER' ? setCurrentWikiPath(item.id) : setEditingFile(item)} className="flex flex-col items-center justify-center p-8 rounded-[40px] border border-white/5 bg-black/40 hover:border-teal-500/40 transition-all group relative h-[180px] cursor-pointer">
                    {isCEO && (
                      <button onClick={(e) => handleDeleteWikiItem(e, item.id)} className="absolute top-4 right-4 p-1.5 text-gray-800 hover:text-red-500 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    )}
                    {item.type === 'FOLDER' ? (
                      <div className="w-14 h-11 rounded-lg relative mb-4 bg-purple-500/20 shadow-lg shadow-purple-500/5">
                        <div className="absolute top-[-3px] left-0 w-8 h-2 rounded-t-sm bg-purple-500"></div>
                      </div>
                    ) : (
                      <div className="w-12 h-16 bg-white/5 border border-white/10 rounded-sm mb-4 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-teal-400/50" />
                      </div>
                    )}
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center truncate w-full px-2">{item.name}</span>
                  </div>
                ))}
                {currentWikiItems.length === 0 && !currentWikiPath && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-20">
                    <FolderOpen className="w-16 h-16 mb-4" />
                    <p className="text-xs font-black uppercase">Wiki vazia</p>
                  </div>
                )}
             </div>
          </div>
        </section>
      )}

      {/* EDITOR DE DOCUMENTO (REUSING SHEET LOGIC FOR NOW AS IT'S ALREADY IN TYPES) */}
      {editingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in zoom-in duration-300">
           <div className="w-full max-w-[95%] bg-[#0a0a0a] border border-white/10 rounded-[48px] overflow-hidden flex flex-col h-[90vh]">
              <div className="px-10 py-6 bg-black/40 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                   <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center border border-teal-500/20">
                     <FileText className="w-5 h-5 text-teal-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">{editingFile.name}</h3>
                     <p className="text-[9px] text-gray-600 font-black uppercase">Documento Wiki</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                    {isCEO && (
                      <button onClick={handleSaveSheet} className="flex items-center gap-2 px-8 py-2.5 bg-[#14b8a6] text-black font-black uppercase text-[9px] rounded-lg">
                        <Save className="w-4 h-4" /> SALVAR
                      </button>
                    )}
                    <button onClick={() => setEditingFile(null)} className="p-2.5 text-gray-500 hover:text-white bg-white/5 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#111] p-10 custom-scrollbar">
                 <table className="w-full border-collapse bg-black/40 rounded-lg overflow-hidden min-w-[1000px]">
                   <tbody>
                     {sheetData.map((row, rIdx) => (
                       <tr key={rIdx}>
                         {row.map((cell, cIdx) => (
                           <td key={cIdx} className="border border-white/5 p-0">
                             <input 
                               value={cell} 
                               readOnly={!isCEO}
                               onChange={(e) => updateCell(rIdx, cIdx, e.target.value)} 
                               className="w-full h-full bg-transparent text-gray-300 text-xs p-4 outline-none focus:bg-white/[0.02]" 
                             />
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
              {isCEO && (
                <div className="p-4 bg-black/20 border-t border-white/5 px-10 flex gap-4">
                  <button onClick={() => setSheetData([...sheetData, new Array(sheetData[0]?.length || 1).fill("")])} className="flex items-center gap-1 px-4 py-2 bg-white/5 rounded-lg text-[9px] font-black text-gray-300 uppercase">+ LINHA</button>
                  <button onClick={() => setSheetData(sheetData.map(row => [...row, ""]))} className="flex items-center gap-1 px-4 py-2 bg-white/5 rounded-lg text-[9px] font-black text-gray-300 uppercase">+ COLUNA</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
