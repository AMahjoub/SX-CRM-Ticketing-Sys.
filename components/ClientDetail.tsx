
import React, { useState, useRef } from 'react';
import { Customer, Project, User, SystemManifest, Attachment, Ticket, TicketStatus } from '../types';

interface ClientDetailProps {
  customer: Customer;
  projects: Project[];
  tickets: Ticket[];
  staff: User[];
  manifest: SystemManifest;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onUpdateTicketStatus: (id: string, status: TicketStatus) => void;
  onReplyToTicket: (id: string, text: string, attachments?: Attachment[]) => void;
  onBack: () => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ 
  customer, 
  projects: allProjects, 
  tickets: allClientTickets,
  staff,
  manifest,
  onUpdateTicketStatus,
  onUpdateProject,
  onReplyToTicket,
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'TICKETS'>('OVERVIEW');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<Attachment[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const clientProjects = allProjects.filter(p => p.clientId === customer.id);
  const selectedTicket = allClientTickets.find(t => t.id === selectedTicketId);
  const selectedProject = clientProjects.find(p => p.id === selectedProjectId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const attachments: Attachment[] = (Array.from(files) as File[]).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    setReplyFiles(prev => [...prev, ...attachments]);
  };

  const handleProjectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files) return;
    
    const newFiles: Attachment[] = (Array.from(e.target.files) as File[]).map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    onUpdateProject(selectedProject.id, { 
      attachments: [...(selectedProject.attachments || []), ...newFiles] 
    });
    
    if (projectFileInputRef.current) projectFileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setReplyFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = () => {
    if ((!replyText.trim() && replyFiles.length === 0) || !selectedTicketId) return;
    onReplyToTicket(selectedTicketId, replyText, replyFiles);
    setReplyText('');
    setReplyFiles([]);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-[12px] text-slate-400 hover:bg-slate-50 transition-colors shadow-sm shrink-0"><BackIcon /></button>
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-3xl font-medium text-slate-900 tracking-tight break-words whitespace-pre-wrap">{customer.company}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Registry Profile: {customer.id} | Control Center</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-[12px] border border-slate-200 shrink-0">
          {['OVERVIEW', 'PROJECTS', 'TICKETS'].map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab as any); setSelectedProjectId(null); }} 
              className={`px-8 py-2 rounded-[10px] text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-sm' : 'text-slate-400'}`} 
              style={activeTab === tab ? { color: manifest.global.primaryColor } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
            <div className="col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[20px] border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Internal Profile Registry</h3>
                <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-wrap break-words">{customer.description || 'No detailed metadata provided for this authorized client.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white p-8 rounded-[20px] border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Identification Data</p>
                   <div className="space-y-6">
                      <div><p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Lead Architect</p><p className="text-sm font-medium text-slate-900 break-words">{customer.name}</p></div>
                      <div><p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Email</p><p className="text-sm font-medium text-slate-900 break-all">{customer.email}</p></div>
                      <div><p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Industry</p><p className="text-sm font-medium text-slate-900 break-words">{customer.industry || 'Global'}</p></div>
                   </div>
                 </div>
                 <div className="bg-white p-8 rounded-[20px] border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Commercial Metadata</p>
                   <div className="space-y-6">
                      <div><p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Lifecycle Value</p><p className="text-sm font-bold" style={{ color: manifest.global.primaryColor }}>SAR {customer.lifetimeValue.toLocaleString()}</p></div>
                      <div><p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Receivables</p><p className="text-sm font-bold text-rose-600">SAR {(customer.totalPrice - customer.paidAmount).toLocaleString()}</p></div>
                      <div><p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Last Sync</p><p className="text-sm font-medium text-slate-900">{customer.lastContact}</p></div>
                   </div>
                 </div>
              </div>
            </div>
            <div className="bg-[#262626] p-10 rounded-[20px] shadow-2xl text-white flex flex-col justify-between">
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-4">Operational Status</p>
                 <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: manifest.global.primaryColor }}></div>
                    <p className="text-4xl font-normal tracking-tighter uppercase">{customer.status}</p>
                 </div>
               </div>
               <div className="pt-10 border-t border-white/10 mt-auto">
                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Master Control Profile</p>
                 <p className="text-xs text-slate-400 mt-4 font-normal leading-relaxed italic opacity-80 break-words">This profile is verified and encrypted in the Securelogx infrastructure.</p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'PROJECTS' && !selectedProjectId && (
          <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
            {clientProjects.length === 0 ? (
              <div className="col-span-2 p-24 bg-white border border-slate-200 rounded-[20px] flex flex-col items-center justify-center text-slate-300">
                <p className="uppercase tracking-[0.3em] text-[10px] font-bold">No authorized projects authorized</p>
              </div>
            ) : (
              clientProjects.map(p => (
                <div key={p.id} className="bg-white p-10 rounded-[20px] border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setSelectedProjectId(p.id)}>
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-[9px] font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-widest">{p.id}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: manifest.global.primaryColor + '15', color: manifest.global.primaryColor }}>{p.status}</span>
                  </div>
                  <h4 className="text-2xl font-medium text-slate-900 tracking-tight mb-4 group-hover:text-emerald-700 transition-colors break-words whitespace-pre-wrap">{p.name}</h4>
                  <p className="text-xs text-slate-400 font-normal line-clamp-2 mb-10 leading-relaxed break-words">{p.description}</p>
                  <div className="grid grid-cols-2 gap-6 border-t border-slate-50 pt-8">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Contract</p>
                      <p className="text-sm font-bold text-slate-900">SAR {(p.value * 1.15).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-end items-center">
                       <button className="px-6 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-[10px] hover:brightness-125 transition-all">Audit Detail</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'PROJECTS' && selectedProject && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <button onClick={() => setSelectedProjectId(null)} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
              <BackIconSmall /> Master Registry
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-[20px] border border-slate-200 shadow-sm">
                   <h3 className="text-xl font-medium text-slate-900 mb-8">Internal Task Timeline Audit</h3>
                   <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                     {selectedProject.tasks?.map(t => (
                        <div key={t.id} className="flex gap-6 relative group">
                           <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm shrink-0 z-10 transition-colors ${t.status === 'Done' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                           <div className="flex-1 border-b border-slate-50 pb-4 min-w-0">
                              <div className="flex justify-between items-start min-w-0">
                                <p className="text-sm font-bold text-slate-900 break-words whitespace-pre-wrap flex-1 pr-4">{t.title}</p>
                                <span className={`text-[8px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${t.status === 'Done' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.status}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                   </div>
                </div>
                <div className="bg-white p-10 rounded-[20px] border border-slate-200 shadow-sm">
                   <h3 className="text-xl font-medium text-slate-900 mb-8">Infrastructure Artifacts</h3>
                   <div className="grid grid-cols-2 gap-4">
                      {selectedProject.attachments?.map(att => (
                        <div key={att.name} className="flex items-center justify-between p-5 bg-slate-50 rounded-[15px] border border-slate-100 min-w-0">
                           <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 shrink-0"><FileIcon /></div>
                              <p className="text-xs font-bold text-slate-900 truncate">{att.name}</p>
                           </div>
                           <button className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 shrink-0 ml-2"><DownloadIcon /></button>
                        </div>
                      ))}
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        ref={projectFileInputRef} 
                        onChange={handleProjectFileUpload} 
                      />
                      <button 
                        onClick={() => projectFileInputRef.current?.click()} 
                        className="col-span-2 py-4 border-2 border-dashed border-slate-200 rounded-[15px] text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-slate-400 transition-all"
                      >
                        + Project Documents
                      </button>
                   </div>
                </div>
              </div>
              <div className="space-y-8">
                 <div className="bg-white p-10 rounded-[20px] border border-slate-200 shadow-sm space-y-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Financial Probe</h4>
                    {(() => {
                       const collected = selectedProject.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                       const total = (selectedProject.value as number) * 1.15;
                       return (
                         <div className="space-y-6">
                            <div><p className="text-[9px] text-slate-400 uppercase font-bold">Authorized Contract (Inc. VAT)</p><p className="text-xl font-bold text-slate-900 break-words">SAR {total.toLocaleString()}</p></div>
                            <div className="pt-6 border-t border-slate-50 space-y-4">
                               <div className="flex justify-between items-center"><p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Realized</p><p className="text-sm font-bold text-emerald-700">SAR {collected.toLocaleString()}</p></div>
                               <div className="flex justify-between items-center"><p className="text-[9px] text-rose-600 font-bold uppercase tracking-widest">Pending</p><p className="text-sm font-bold text-rose-700">SAR {(total - collected).toLocaleString()}</p></div>
                            </div>
                         </div>
                       )
                    })()}
                 </div>
                 <div className="bg-slate-50 p-10 rounded-[20px] border border-slate-200 space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Leaders</p>
                    <div className="flex -space-x-2 overflow-hidden">
                       {staff.filter(s => selectedProject.adminIds?.includes(s.id)).map(s => (
                         <img key={s.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src={s.avatar} alt="" title={s.name} />
                       ))}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Assigned Operational Unit</p>
                 </div>
                 <div className="bg-slate-50 p-10 rounded-[20px] border border-slate-200 space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduling</p>
                    <div className="space-y-4">
                       <div><p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Start</p><p className="text-sm font-bold text-slate-900">{selectedProject.startDate || 'TBD'}</p></div>
                       <div><p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Deadline</p><p className="text-sm font-bold text-slate-900">{selectedProject.endDate || 'TBD'}</p></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TICKETS' && (
          <div className="flex gap-8 h-[700px] animate-in slide-in-from-bottom-4">
            <div className="w-96 bg-white border border-slate-200 rounded-[20px] overflow-hidden flex flex-col shadow-sm shrink-0">
               <div className="p-6 bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">Support Queue</div>
               <div className="flex-1 overflow-y-auto">
                 {allClientTickets.length === 0 ? (
                    <p className="p-10 text-center text-xs text-slate-300 italic uppercase tracking-widest">No active requests.</p>
                 ) : (
                   allClientTickets.map(t => (
                    <button key={t.id} onClick={() => setSelectedTicketId(t.id)} className={`w-full p-8 text-left border-b border-slate-50 transition-all ${selectedTicketId === t.id ? 'bg-slate-50 border-l-4 shadow-inner' : ''}`} style={selectedTicketId === t.id ? { borderLeftColor: manifest.global.primaryColor } : {}}>
                      <div className="flex justify-between text-[8px] font-bold uppercase text-slate-400 mb-2">
                        <span>{t.id}</span>
                        <span>{t.priority}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate">{t.subject}</p>
                    </button>
                   ))
                 )}
               </div>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-[20px] flex flex-col shadow-sm overflow-hidden min-w-0">
               {selectedTicket ? (
                 <>
                   <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30 shrink-0">
                     <div className="min-w-0 flex-1 pr-4">
                       <h4 className="text-xl font-medium text-slate-900 tracking-tight break-words whitespace-pre-wrap">{selectedTicket.subject}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status Protocol: {selectedTicket.status}</p>
                     </div>
                     <select className="bg-white border border-slate-200 text-[9px] font-bold uppercase tracking-widest rounded-[12px] px-6 py-2 outline-none appearance-none cursor-pointer shadow-sm shrink-0" value={selectedTicket.status} onChange={(e) => onUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}>
                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                   </div>
                   <div className="flex-1 p-10 overflow-y-auto space-y-8">
                     {selectedTicket.messages.map(m => (
                       <div key={m.id} className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] rounded-[20px] p-6 shadow-sm ${m.isAdmin ? 'text-white' : 'bg-slate-50 text-slate-800'}`} style={m.isAdmin ? { backgroundColor: manifest.global.primaryColor } : {}}>
                           <p className="text-sm font-normal leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                           {m.attachments && m.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-black/5 space-y-1.5">
                               {m.attachments.map((att, i) => (
                                 <div key={i} className="flex items-center justify-between p-2.5 bg-black/5 rounded-[12px] min-w-0">
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                       <FileIconSmall />
                                       <span className="text-[10px] font-bold truncate">{att.name}</span>
                                    </div>
                                    <a href={att.url} download={att.name} className="p-1 hover:bg-black/10 rounded-full transition-all shrink-0"><DownloadIconSmall /></a>
                                 </div>
                               ))}
                            </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                   <div className="p-8 border-t border-slate-100 flex flex-col gap-3 bg-slate-50/30 shrink-0 shadow-inner">
                     {replyFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                           {replyFiles.map((f, i) => (
                             <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full">
                                <span className="text-[9px] font-bold text-slate-500 truncate max-w-[100px]">{f.name}</span>
                                <button onClick={() => removeFile(i)} className="text-rose-500"><CloseIconSmall /></button>
                             </div>
                           ))}
                        </div>
                     )}
                     <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <textarea className="w-full bg-white border border-slate-200 rounded-[15px] p-5 pr-14 text-sm outline-none resize-none shadow-inner break-words whitespace-pre-wrap font-normal" rows={2} placeholder="Respond to signal..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                          <button onClick={() => fileInputRef.current?.click()} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"><PaperClipIcon /></button>
                          <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                        <button onClick={handleSendReply} className="px-12 py-3 text-white rounded-[10px] font-bold uppercase tracking-widest text-[10px] shadow-lg transition-all hover:brightness-110 self-end shrink-0" style={{ backgroundColor: manifest.global.primaryColor }}>Transmit Response</button>
                     </div>
                   </div>
                 </>
               ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
                    <p className="font-bold uppercase tracking-[0.3em] text-[10px]">Select a communication channel</p>
                  </div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>;
const BackIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const FileIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const DownloadIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const CloseIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;

export default ClientDetail;
