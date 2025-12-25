
import React, { useState, useRef } from 'react';
import { Ticket, TicketPriority, User, Customer, SystemManifest, Attachment, Project, ProjectTask } from '../types';

interface ClientPortalProps {
  tickets: Ticket[];
  projects: Project[];
  user: User;
  customerData?: Customer;
  onCreateTicket: (subject: string, desc: string, category: string, priority: TicketPriority, attachments?: Attachment[], projectId?: string) => void;
  onReply: (id: string, text: string, attachments?: Attachment[]) => void;
  onMakePayment: (amount: number) => void;
  manifest: SystemManifest;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ tickets, projects = [], user, customerData, onCreateTicket, onReply, onMakePayment, manifest }) => {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'PROJECTS' | 'FINANCE'>('TICKETS');
  
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'Technical', priority: TicketPriority.MEDIUM, projectId: '' });
  const [newTicketFiles, setNewTicketFiles] = useState<Attachment[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<Attachment[]>([]);

  const ticketFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
    const files = e.target.files;
    if (!files) return;

    const attachments: Attachment[] = Array.from(files).map((file: File) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    if (isReply) {
      setReplyFiles(prev => [...prev, ...attachments]);
    } else {
      setNewTicketFiles(prev => [...prev, ...attachments]);
    }
  };

  const removeFile = (index: number, isReply: boolean) => {
    if (isReply) {
      setReplyFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewTicketFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTicket(newTicket.subject, newTicket.description, newTicket.category, newTicket.priority, newTicketFiles, newTicket.projectId);
    setIsNewTicketOpen(false);
    setNewTicket({ subject: '', description: '', category: 'Technical', priority: TicketPriority.MEDIUM, projectId: '' });
    setNewTicketFiles([]);
  };

  const handleSendReply = () => {
    if ((!replyText.trim() && replyFiles.length === 0) || !selectedTicketId) return;
    onReply(selectedTicketId, replyText, replyFiles);
    setReplyText('');
    setReplyFiles([]);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Authorized Client Hub</h2>
          <p className="text-slate-500 font-normal break-words">Secure portal for {customerData?.company || 'Authenticated Entity'}.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex bg-slate-100 p-1.5 rounded-[15px] border border-slate-200">
            {['TICKETS', 'PROJECTS', 'FINANCE'].map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab as any); setSelectedProjectId(null); }} 
                className={`px-6 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                style={activeTab === tab ? { color: manifest.global.primaryColor } : {}}
              >
                {tab === 'TICKETS' ? 'Support Feed' : tab === 'PROJECTS' ? 'Infrastructure' : 'Ledger'}
              </button>
            ))}
          </div>
          <button onClick={() => setIsNewTicketOpen(true)} className="px-8 py-3 text-white rounded-[12px] font-bold shadow-lg flex items-center gap-3 text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: manifest.global.primaryColor }}><PlusIcon /> New Signal</button>
        </div>
      </div>

      {activeTab === 'FINANCE' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-10 rounded-[25px] border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Project Revenue</p>
                <h3 className="text-3xl font-medium text-slate-900 break-words">{manifest.global.currency} {(projects.reduce((acc, p) => acc + p.value, 0) * 1.15).toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-3 font-normal uppercase tracking-tighter">Authorized inclusive of 15% VAT</p>
             </div>
             <div className="bg-emerald-50 p-10 rounded-[25px] border border-emerald-100 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Audited Payments</p>
                <h3 className="text-3xl font-medium text-emerald-700 break-words">{manifest.global.currency} {(customerData?.paidAmount || 0).toLocaleString()}</h3>
                <p className="text-[10px] text-emerald-500 mt-3 font-normal uppercase tracking-tighter">Realized in registry</p>
             </div>
             <div className="bg-rose-50 p-10 rounded-[25px] border border-rose-100 shadow-sm">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-3">Outstanding Balance</p>
                <h3 className="text-3xl font-medium text-rose-700 break-words">{manifest.global.currency} {((projects.reduce((acc, p) => acc + p.value, 0) * 1.15) - (customerData?.paidAmount || 0)).toLocaleString()}</h3>
                <p className="text-[10px] text-rose-400 mt-3 font-normal uppercase tracking-tighter">Scheduled for collection</p>
             </div>
          </div>
          <div className="bg-white rounded-[25px] border border-slate-200 shadow-sm p-10">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-50 pb-6">Transaction Transmission Logs</h4>
             <div className="space-y-4">
                {projects.flatMap(p => p.payments).length === 0 ? (
                  <p className="text-center py-20 text-slate-300 text-sm italic">No verified transactions in the history.</p>
                ) : (
                  projects.flatMap(p => p.payments).sort((a,b) => b.date.localeCompare(a.date)).map(pay => (
                    <div key={pay.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[18px] border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-5 min-w-0 flex-1">
                         <div className="p-3.5 bg-white rounded-full text-emerald-600 shadow-sm border border-slate-100 shrink-0"><AccountingIcon /></div>
                         <div className="min-w-0 flex-1">
                           <p className="text-sm font-bold text-slate-900 break-words whitespace-pre-wrap">{pay.note}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{pay.date}</p>
                         </div>
                      </div>
                      <p className="text-xl font-bold text-slate-900 shrink-0 ml-4">{manifest.global.currency} {pay.amount.toLocaleString()}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'PROJECTS' && !selectedProjectId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          {projects.length === 0 ? (
            <div className="col-span-2 p-24 bg-white border border-slate-200 rounded-[25px] flex flex-col items-center justify-center text-slate-300">
               <div className="p-8 bg-slate-50 rounded-full mb-6 opacity-40"><WorkflowIconLarge /></div>
               <p className="uppercase tracking-[0.4em] text-[10px] font-bold">No active infrastructure units found</p>
            </div>
          ) : (
            projects.map(p => {
              const collected = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
              const progress = (collected / (p.value * 1.15)) * 100;
              return (
                <div key={p.id} className="bg-white p-10 rounded-[25px] border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer" onClick={() => setSelectedProjectId(p.id)}>
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-[9px] font-bold px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-full uppercase tracking-widest">{p.id}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full" style={{ backgroundColor: manifest.global.primaryColor + '15', color: manifest.global.primaryColor }}>{p.status}</span>
                  </div>
                  <h4 className="text-2xl font-medium text-slate-900 tracking-tight mb-4 group-hover:text-emerald-700 transition-colors break-words whitespace-pre-wrap">{p.name}</h4>
                  <p className="text-xs text-slate-400 font-normal line-clamp-2 mb-10 leading-relaxed break-words">{p.description}</p>
                  
                  <div className="mt-auto space-y-6">
                    <div>
                       <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                         <span>Liquidity Status</span>
                         <span>{progress.toFixed(0)}% Authorized</span>
                       </div>
                       <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: manifest.global.primaryColor }}></div>
                       </div>
                    </div>
                    <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                       <div className="flex items-center gap-8">
                         <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Launch</p>
                            <p className="text-[11px] font-bold text-slate-900">{p.startDate || 'TBD'}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sunset</p>
                            <p className="text-[11px] font-bold text-slate-900">{p.endDate || 'TBD'}</p>
                         </div>
                       </div>
                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Enter Data <ArrowRightIconSmall /></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'PROJECTS' && selectedProject && (
        <div className="animate-in fade-in duration-500 space-y-8">
           <button onClick={() => setSelectedProjectId(null)} className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-all active:scale-95">
              <div className="p-2 bg-slate-100 rounded-full"><BackIconSmall /></div> Return to Infrastructure Registry
           </button>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                 <div className="bg-white p-12 rounded-[30px] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                       <h3 className="text-xl font-medium text-slate-900 tracking-tight">Internal Operational Timeline</h3>
                       <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time Status</div>
                    </div>
                    <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                       {selectedProject.tasks?.length === 0 ? (
                         <div className="py-12 text-center">
                            <p className="text-sm text-slate-300 italic">Operational tasks are still being provisioned.</p>
                         </div>
                       ) : (
                         selectedProject.tasks.map(t => (
                           <div key={t.id} className="flex gap-8 relative group">
                              <div className={`w-6 h-6 rounded-full border-4 border-white shadow-md shrink-0 z-10 transition-all duration-500 ${t.status === 'Done' ? 'bg-emerald-500' : t.status === 'Doing' ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                              <div className="flex-1 border-b border-slate-50 pb-6 group-last:border-none">
                                 <div className="flex justify-between items-start min-w-0">
                                    <div className="min-w-0 flex-1 pr-4">
                                      <p className={`text-base font-bold transition-all break-words whitespace-pre-wrap ${t.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Lifecycle State: {t.status}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0 ${t.status === 'Done' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.status}</span>
                                 </div>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                 </div>

                 <div className="bg-white p-12 rounded-[30px] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-medium text-slate-900 tracking-tight mb-10">Infrastructure Artifact Vault</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                       {selectedProject.attachments?.length === 0 ? (
                         <div className="col-span-2 py-10 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-[20px]">
                            <p className="text-sm text-slate-300 italic uppercase tracking-widest font-bold">No documentation artifacts detected</p>
                         </div>
                       ) : (
                         selectedProject.attachments.map(att => (
                           <div key={att.name} className="flex items-center justify-between p-6 bg-slate-50 rounded-[20px] border border-slate-100 group hover:border-slate-200 transition-all">
                              <div className="flex items-center gap-5 min-w-0 flex-1">
                                 <div className="p-3.5 bg-white rounded-xl shadow-sm text-slate-400 border border-slate-100 shrink-0"><FileIcon /></div>
                                 <div className="min-w-0 flex-1">
                                   <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{att.name}</p>
                                   <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Technical Spec</p>
                                 </div>
                              </div>
                              <button className="p-2.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 active:scale-90 shrink-0 ml-2"><DownloadIcon /></button>
                           </div>
                         ))
                       )}
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-[#262626] p-12 rounded-[30px] shadow-2xl text-white flex flex-col justify-between h-96 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><PulseIconLarge /></div>
                    <div className="relative z-10">
                       <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 mb-6 border-b border-white/5 pb-4">Lifecycle Info</p>
                       <div className="space-y-8">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Authorized Launch</p>
                            <p className="text-2xl font-normal tracking-tight">{selectedProject.startDate || 'Protocol Pending'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Project Sunset</p>
                            <p className="text-2xl font-normal tracking-tight">{selectedProject.endDate || 'Protocol Pending'}</p>
                          </div>
                       </div>
                    </div>
                    <div className="pt-8 border-t border-white/10 mt-auto relative z-10 flex items-center gap-3">
                       <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                       <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Operational Protocol: Active</p>
                    </div>
                 </div>

                 <div className="bg-white p-10 rounded-[30px] border border-slate-200 shadow-sm space-y-8">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Commercial Audit</h4>
                    {(() => {
                       const collected = selectedProject.payments.reduce((sum, p) => sum + p.amount, 0);
                       const total = selectedProject.value * 1.15;
                       return (
                         <div className="space-y-8">
                            <div className="p-6 bg-slate-50 rounded-[20px] border border-slate-100">
                               <p className="text-[9px] text-slate-400 uppercase font-bold mb-1.5 tracking-widest">Contract Total</p>
                               <p className="text-3xl font-bold text-slate-900 break-words">{manifest.global.currency} {total.toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                               <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-[15px]">
                                  <p className="text-[8px] text-emerald-600 uppercase font-bold mb-1 tracking-widest">Realized</p>
                                  <p className="text-base font-bold text-emerald-700 break-words">{manifest.global.currency} {collected.toLocaleString()}</p>
                               </div>
                               <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-[15px]">
                                  <p className="text-[8px] text-rose-600 uppercase font-bold mb-1 tracking-widest">Outstanding</p>
                                  <p className="text-base font-bold text-rose-700 break-words">{manifest.global.currency} {(total - collected).toLocaleString()}</p>
                               </div>
                            </div>
                         </div>
                       )
                    })()}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'TICKETS' && (
        <div className="bg-white rounded-[25px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex animate-in slide-in-from-bottom-4">
          <div className="w-1/3 border-r border-slate-100 overflow-y-auto shrink-0">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Registry</h4>
            </div>
            {tickets.length === 0 ? (
               <div className="p-16 text-center">
                  <p className="text-xs text-slate-300 italic uppercase tracking-[0.2em] font-bold">Registry Clear</p>
               </div>
            ) : (
              tickets.map(t => (
                <button key={t.id} onClick={() => setSelectedTicketId(t.id)} className={`w-full text-left p-10 border-b border-slate-50 transition-all ${selectedTicketId === t.id ? 'bg-slate-50 border-l-4 shadow-inner' : 'hover:bg-slate-50/50'}`} style={selectedTicketId === t.id ? { borderLeftColor: manifest.global.primaryColor } : {}}>
                  <div className="flex justify-between items-start mb-2.5 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate text-sm tracking-tight flex-1 pr-2">{t.subject}</h4>
                    <span className={`text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shrink-0 ${t.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.status}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{t.id} | {new Date(t.updatedAt).toLocaleDateString()}</p>
                </button>
              ))
            )}
          </div>
          <div className="flex-1 flex flex-col bg-slate-50/30 min-w-0">
            {selectedTicket ? (
               <>
                 <div className="flex-1 p-10 overflow-y-auto space-y-8">
                    {selectedTicket.messages.map(m => (
                      <div key={m.id} className={`flex ${m.isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] rounded-[22px] p-7 shadow-sm ${m.isAdmin ? 'bg-white border border-slate-200 text-slate-900' : 'text-white'}`} style={!m.isAdmin ? { backgroundColor: manifest.global.primaryColor } : {}}>
                          <div className="flex justify-between items-center mb-3.5 gap-8">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 break-words">{m.senderName}</span>
                            <span className="text-[8px] opacity-40 uppercase font-bold shrink-0">{new Date(m.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm leading-relaxed font-normal whitespace-pre-wrap break-words">{m.text}</p>
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-black/5 space-y-2">
                               {m.attachments.map((att, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-3 bg-black/5 rounded-[12px] group">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                       <div className="text-xs shrink-0"><FileIconSmall /></div>
                                       <span className="text-[10px] font-bold truncate">{att.name}</span>
                                    </div>
                                    <a href={att.url} download={att.name} className="p-1.5 hover:bg-black/10 rounded-full transition-all shrink-0 ml-2"><DownloadIconSmall /></a>
                                 </div>
                               ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                 </div>
                 <div className="p-10 bg-white border-t border-slate-100 flex flex-col gap-4 shadow-2xl">
                    {replyFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                         {replyFiles.map((f, i) => (
                           <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 animate-in zoom-in-95">
                              <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{f.name}</span>
                              <button onClick={() => removeFile(i, true)} className="text-rose-500 hover:text-rose-700 transition-colors"><CloseIconSmall /></button>
                           </div>
                         ))}
                      </div>
                    )}
                    <div className="flex gap-5">
                      <div className="flex-1 relative">
                        <textarea 
                          className="w-full bg-white border border-slate-200 rounded-[18px] p-6 pr-16 text-sm outline-none resize-none shadow-inner focus:ring-1 focus:ring-slate-300 transition-all font-normal break-words whitespace-pre-wrap" 
                          rows={2} 
                          placeholder="Type response..." 
                          value={replyText} 
                          onChange={e => setReplyText(e.target.value)} 
                        />
                        <button 
                          onClick={() => replyFileInputRef.current?.click()}
                          className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <PaperClipIcon />
                        </button>
                        <input type="file" multiple className="hidden" ref={replyFileInputRef} onChange={(e) => handleFileChange(e, true)} />
                      </div>
                      <button onClick={handleSendReply} className="px-14 py-4 text-white rounded-[12px] font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all hover:brightness-110 active:scale-95 self-end shrink-0" style={{ backgroundColor: manifest.global.primaryColor }}>Transmit</button>
                    </div>
                 </div>
               </>
            ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-5">
                  <div className="p-8 bg-slate-100 rounded-full opacity-50"><TicketIconLarge /></div>
                  <p className="font-bold uppercase tracking-[0.4em] text-[10px]">Select a communication channel</p>
                </div>}
          </div>
        </div>
      )}

      {isNewTicketOpen && (
        <div className="fixed inset-0 bg-[#262626]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <div className="bg-white rounded-[25px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
             <form onSubmit={handleSubmitTicket}>
               <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Initiate System Signal</h3>
                 <button type="button" onClick={() => setIsNewTicketOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><CloseIcon /></button>
               </div>
               <div className="p-10 space-y-8 font-normal max-h-[60vh] overflow-y-auto">
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Transmission Class</label>
                     <select required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[15px] outline-none text-sm appearance-none cursor-pointer shadow-sm focus:ring-1 focus:ring-slate-300" value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})}>
                        <option value="Technical">Technical Operations</option>
                        <option value="Billing">Billing & Liquidity</option>
                        <option value="Compliance">Security & Compliance</option>
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Link to Project</label>
                     <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[15px] outline-none text-sm appearance-none cursor-pointer shadow-sm focus:ring-1 focus:ring-slate-300" value={newTicket.projectId} onChange={e => setNewTicket({...newTicket, projectId: e.target.value})}>
                        <option value="">Independent Signal</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Signal Identifier (Wraps)</label>
                    <textarea 
                      required 
                      rows={1}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[15px] outline-none text-sm font-normal shadow-sm focus:ring-1 focus:ring-slate-300 resize-none break-words whitespace-pre-wrap" 
                      placeholder="Summary of the request" 
                      value={newTicket.subject} 
                      onChange={e => setNewTicket({...newTicket, subject: e.target.value})} 
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Detailed Log Transmit</label>
                    <textarea 
                      required 
                      rows={4} 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[15px] outline-none resize-none text-sm font-normal shadow-sm focus:ring-1 focus:ring-slate-300 break-words whitespace-pre-wrap" 
                      placeholder="Provide operational context..." 
                      value={newTicket.description} 
                      onChange={e => setNewTicket({...newTicket, description: e.target.value})} 
                    />
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Documentation Artifacts</label>
                    <div className="flex flex-col gap-3">
                       {newTicketFiles.map((f, i) => (
                         <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[15px]">
                            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                               <FileIconSmall />
                               <span className="text-xs font-bold text-slate-700 truncate">{f.name}</span>
                            </div>
                            <button type="button" onClick={() => removeFile(i, false)} className="text-rose-500 hover:text-rose-700 p-1 shrink-0"><CloseIconSmall /></button>
                         </div>
                       ))}
                       <button 
                        type="button" 
                        onClick={() => ticketFileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[15px] text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-slate-400 transition-all"
                       >
                         + Attach Documentation Artifact
                       </button>
                       <input type="file" multiple className="hidden" ref={ticketFileInputRef} onChange={(e) => handleFileChange(e, false)} />
                    </div>
                 </div>
               </div>
               <div className="p-10 bg-slate-50 flex gap-5 border-t border-slate-100">
                 <button type="button" onClick={() => setIsNewTicketOpen(false)} className="flex-1 py-5 font-bold text-slate-400 uppercase text-[10px] tracking-[0.3em] transition-colors hover:text-slate-600">Abort Signal</button>
                 <button type="submit" className="flex-1 py-5 text-white font-bold rounded-[15px] uppercase text-[10px] tracking-[0.3em] shadow-lg transition-all hover:brightness-110 active:scale-95" style={{ backgroundColor: manifest.global.primaryColor }}>Transmit Transmission</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const WorkflowIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const AccountingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TicketIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const BackIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>;
const DownloadIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const FileIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const ArrowRightIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
const PulseIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const CloseIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export default ClientPortal;
