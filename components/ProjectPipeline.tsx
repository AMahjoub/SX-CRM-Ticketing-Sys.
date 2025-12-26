
import React, { useState, useMemo, useRef } from 'react';
// Fix: Added ProjectPayment to the imports from ../types and cleaned up duplicate ProjectTask import.
import { Customer, User, Project, ProjectTask, SystemManifest, Service, UserRole, Attachment, Ticket, ProjectPayment } from '../types';

interface ProjectPipelineProps {
  customers: Customer[];
  staff: User[];
  projects: Project[];
  tickets: Ticket[];
  services: Service[];
  currentUser: User;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onAddProject: (project: Project) => void;
  onAddPayment: (projectId: string, payment: ProjectPayment) => void;
  onSwitchToCreate: () => void;
  manifest: SystemManifest;
}

const ProjectPipeline: React.FC<ProjectPipelineProps> = ({ 
  customers, 
  staff, 
  projects, 
  tickets,
  services,
  currentUser,
  onUpdateProject,
  onAddProject,
  onAddPayment,
  onSwitchToCreate,
  manifest
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [controlCenterTab, setControlCenterTab] = useState<'FINANCE' | 'TASKS' | 'DOCS' | 'SIGNALS'>('FINANCE');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: 'Progress collection' });

  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    name: '',
    description: '',
    clientId: '',
    adminIds: [],
    value: 0,
    costs: 0,
    awardRef: '',
    invoiceRef: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
    tasks: [],
    attachments: []
  });

  const canCreate = currentUser.role === UserRole.ADMIN || (currentUser.crudPermissions?.['PROJECT_PIPELINE']?.create);
  const canEdit = currentUser.role === UserRole.ADMIN || (currentUser.crudPermissions?.['PROJECT_PIPELINE']?.edit);

  const handleOpenEdit = (proj: Project) => {
    setProjectForm({ ...proj });
    setNewTaskTitle('');
    setIsEditModalOpen(true);
  };

  const handleApplyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.id) return;
    onUpdateProject(projectForm.id, projectForm);
    setIsEditModalOpen(false);
  };

  const toggleStaffAssignmentInForm = (staffId: string) => {
    const current = projectForm.adminIds || [];
    if (current.includes(staffId)) {
      setProjectForm({ ...projectForm, adminIds: current.filter(id => id !== staffId) });
    } else {
      setProjectForm({ ...projectForm, adminIds: [...current, staffId] });
    }
  };

  const addNewTaskToForm = () => {
    if (newTaskTitle.trim()) {
      const newTask: ProjectTask = { 
        id: `task-${Date.now()}`, 
        title: newTaskTitle.trim(), 
        status: 'Todo' 
      };
      setProjectForm(prev => ({
        ...prev,
        tasks: [...(prev.tasks || []), newTask]
      }));
      setNewTaskTitle('');
    }
  };

  const removeTaskFromForm = (taskId: string) => {
    setProjectForm(prev => ({
      ...prev,
      tasks: prev.tasks?.filter(t => t.id !== taskId)
    }));
  };

  const updateTaskStatusInForm = (taskId: string, status: any) => {
    setProjectForm(prev => ({
      ...prev,
      tasks: prev.tasks?.map(t => t.id === taskId ? { ...t, status } : t)
    }));
  };

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const relatedTickets = useMemo(() => tickets.filter(t => t.projectId === selectedProjectId), [tickets, selectedProjectId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitPayment = () => {
    if (!selectedProjectId || !paymentForm.amount) return;
    const payment: ProjectPayment = {
      id: `pay-${Date.now()}`,
      amount: Number(paymentForm.amount),
      date: paymentForm.date,
      note: paymentForm.note
    };
    onAddPayment(selectedProjectId, payment);
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: 'Progress collection' });
  };

  const toggleTaskCompletion = (taskId: string, currentStatus: string) => {
    if (!selectedProject) return;
    const newStatus = currentStatus === 'Done' ? 'Todo' : 'Done';
    onUpdateProject(selectedProject.id, {
      tasks: selectedProject.tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t)
    });
  };

  const calculateFinancials = (p: Project) => {
    const totalCollected = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const vat = Number(p.value) * 0.15;
    const totalContract = Number(p.value) + vat;
    const outstanding = totalContract - totalCollected;
    const profit = Number(p.value) - Number(p.costs);
    const margin = (profit / Number(p.value)) * 100 || 0;
    return { totalCollected, vat, totalContract, outstanding, profit, margin };
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">{manifest.projects.title}</h2>
          <p className="text-slate-500 font-normal">Infrastructure lifecycle and project workflow system.</p>
        </div>
        {canCreate && (
          <button 
            onClick={onSwitchToCreate}
            className="px-6 py-3 text-white rounded-[10px] font-medium text-xs uppercase tracking-widest shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            style={{ backgroundColor: manifest.global.primaryColor }}
          >
            <PlusIcon /> Launch New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 font-normal">
        {projects.length === 0 ? (
           <div className="col-span-2 p-20 bg-white border border-slate-200 border-dashed rounded-[20px] flex flex-col items-center justify-center text-slate-300">
             <WorkflowIconLarge />
             <p className="mt-6 font-bold uppercase tracking-[0.3em] text-[10px]">Registry Clear. No projects provisioned.</p>
           </div>
        ) : projects.map(proj => {
          const { totalCollected, totalContract, profit } = calculateFinancials(proj);
          const assignedStaff = staff.filter(s => proj.adminIds?.includes(s.id));
          
          return (
            <div key={proj.id} className="bg-white rounded-[15px] border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md group">
              <div className="p-8 border-b border-slate-50">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest" style={{ backgroundColor: manifest.global.primaryColor + '15', color: manifest.global.primaryColor }}>{proj.id}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{proj.awardRef || 'No Award Ref'}</span>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && (
                      <button onClick={() => handleOpenEdit(proj)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><EditIconSmall /></button>
                    )}
                    <select 
                      disabled={!canEdit}
                      className="bg-white border border-slate-200 px-4 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer disabled:opacity-50 shadow-sm"
                      value={proj.status}
                      onChange={(e) => onUpdateProject(proj.id, { status: e.target.value as any })}
                    >
                      <option value="PLANNING">PLANNING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="ON_HOLD">ON_HOLD</option>
                    </select>
                  </div>
                </div>
                
                <h3 className="text-2xl font-medium text-slate-900 tracking-tight mb-2 break-words break-all">{proj.name}</h3>
                
                <div className="flex items-center gap-2 mb-6">
                   <div className="flex -space-x-2 overflow-hidden">
                      {assignedStaff.map(s => (
                        <img key={s.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src={s.avatar} alt={s.name} title={s.name} />
                      ))}
                      {assignedStaff.length === 0 && <span className="text-[9px] font-bold text-slate-300 uppercase italic">Unassigned</span>}
                   </div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{assignedStaff.length} Lead{assignedStaff.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Authorized</p>
                     <p className="text-sm font-medium text-slate-900">SAR {totalContract.toLocaleString()}</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Collection</p>
                     <p className="text-sm font-medium text-slate-900">{((totalCollected / totalContract) * 100).toFixed(0)}%</p>
                   </div>
                   <div className="p-4 rounded-[10px] border border-emerald-100" style={{ backgroundColor: profit >= 0 ? '#ecfdf5' : '#fff1f2' }}>
                     <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: profit >= 0 ? '#059669' : '#e11d48' }}>Profitability</p>
                     <p className="text-sm font-medium" style={{ color: profit >= 0 ? '#059669' : '#e11d48' }}>{manifest.global.currency} {profit.toLocaleString()}</p>
                   </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Start Date</p>
                    <p className="text-[10px] font-medium text-slate-600">{proj.startDate || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">End Date</p>
                    <p className="text-[10px] font-medium text-slate-600">{proj.endDate || 'TBD'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedProjectId(proj.id); setIsControlCenterOpen(true); }}
                  className="px-6 py-2 text-white rounded-[10px] font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: manifest.global.primaryColor }}
                >
                  Project Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isControlCenterOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[25px] w-full max-w-6xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-medium text-slate-900 tracking-tight break-words">{selectedProject.name}</h3>
                   <span className="text-[10px] font-bold px-3 py-1 bg-slate-900 text-white rounded-full uppercase tracking-widest shrink-0">{selectedProject.id}</span>
                </div>
              </div>
              <button onClick={() => setIsControlCenterOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0 text-slate-400"><CloseIcon /></button>
            </div>
            
            <div className="flex border-b border-slate-100 bg-white">
                {[
                  { id: 'FINANCE', label: 'Commercial Audit', icon: <AccountingIconSmall /> },
                  { id: 'TASKS', label: 'Roadmap', icon: <WorkflowIconSmall /> },
                  { id: 'SIGNALS', label: 'Related Signals', icon: <SignalIconSmall /> },
                  { id: 'DOCS', label: 'Documents', icon: <FileIconSmall /> }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setControlCenterTab(tab.id as any)}
                    className={`flex-1 py-5 flex items-center justify-center gap-3 border-b-2 transition-all font-bold text-[10px] uppercase tracking-widest ${controlCenterTab === tab.id ? 'border-slate-900 text-slate-900 bg-slate-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
               {controlCenterTab === 'TASKS' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div>
                            <h4 className="text-lg font-medium text-slate-900">Operational Milestones</h4>
                            <p className="text-xs text-slate-400 font-normal mt-1">Check to complete tasks instantly.</p>
                        </div>
                    </div>
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {selectedProject.tasks?.map(t => (
                            <div key={t.id} className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[20px] shadow-sm">
                                <button 
                                  onClick={() => toggleTaskCompletion(t.id, t.status)}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${t.status === 'Done' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}
                                >
                                  {t.status === 'Done' && <CheckIconSmall />}
                                </button>
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className={`text-sm font-bold break-words whitespace-pre-wrap ${t.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Status: {t.status}</p>
                                </div>
                                <select 
                                    className="bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-lg px-4 py-2 outline-none cursor-pointer"
                                    value={t.status}
                                    onChange={e => onUpdateProject(selectedProject.id, { tasks: selectedProject.tasks.map(task => task.id === t.id ? { ...task, status: e.target.value as any } : task) })}
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="Doing">Doing</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                        ))}
                    </div>
                 </div>
               )}
               {controlCenterTab === 'FINANCE' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-white p-8 rounded-[20px] border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Commercial Ledger</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center"><p className="text-xs text-slate-500">Contract Baseline</p><p className="text-sm font-bold text-slate-900">SAR {Number(selectedProject.value).toLocaleString()}</p></div>
                             <div className="flex justify-between items-center"><p className="text-xs text-slate-500">VAT Provision (15%)</p><p className="text-sm font-bold text-slate-900">SAR {(Number(selectedProject.value) * 0.15).toLocaleString()}</p></div>
                             <div className="pt-4 border-t border-slate-50 flex justify-between items-center"><p className="text-xs font-bold text-slate-900 uppercase">Authorized Total</p><p className="text-lg font-bold text-slate-900">SAR {(Number(selectedProject.value) * 1.15).toLocaleString()}</p></div>
                          </div>
                       </div>
                       <div className="bg-white p-8 rounded-[20px] border border-slate-100 shadow-sm">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Realization Audit</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center"><p className="text-xs text-emerald-600">Total Collected</p><p className="text-sm font-bold text-emerald-700">SAR {selectedProject.payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</p></div>
                             <div className="flex justify-between items-center"><p className="text-xs text-rose-600">Outstanding Balance</p><p className="text-sm font-bold text-rose-700">SAR {((Number(selectedProject.value) * 1.15) - selectedProject.payments.reduce((sum, p) => sum + Number(p.amount), 0)).toLocaleString()}</p></div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-slate-50 p-8 rounded-[20px] border border-slate-100">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Log New Collection Signal</h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <input type="number" placeholder="Amount (SAR)" className="px-5 py-3 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-bold" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                          <input type="date" className="px-5 py-3 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-bold" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                          <button onClick={submitPayment} className="px-8 py-3 bg-slate-900 text-white rounded-[12px] font-bold text-[10px] uppercase tracking-widest shadow-md hover:brightness-110 transition-all">Transmit Receipt</button>
                       </div>
                    </div>
                 </div>
               )}
               {controlCenterTab === 'DOCS' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                       <h4 className="text-lg font-medium text-slate-900">Infrastructure Artifacts</h4>
                       <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-[10px] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">+ Upload Doc</button>
                       <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {selectedProject.attachments?.map(att => (
                          <div key={att.name} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[15px] shadow-sm">
                             <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><FileIconSmall /></div>
                                <span className="text-xs font-bold text-slate-700 truncate">{att.name}</span>
                             </div>
                             <a href={att.url} download={att.name} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><DownloadIconSmall /></a>
                          </div>
                       ))}
                    </div>
                 </div>
               )}
               {controlCenterTab === 'SIGNALS' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <h4 className="text-lg font-medium text-slate-900">Project Support Signals</h4>
                    <div className="space-y-4">
                       {relatedTickets.length === 0 ? (
                          <div className="p-10 border-2 border-dashed border-slate-100 rounded-[20px] text-center text-slate-300 italic font-bold uppercase tracking-widest text-[10px]">No linked communication signals found.</div>
                       ) : (
                          relatedTickets.map(t => (
                             <div key={t.id} className="p-6 bg-white border border-slate-100 rounded-[20px] shadow-sm flex justify-between items-center">
                                <div>
                                   <p className="text-sm font-bold text-slate-900">{t.subject}</p>
                                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">{t.id} | Status: {t.status}</p>
                                </div>
                                <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.status}</span>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
           <div className="bg-white rounded-[20px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
              <form onSubmit={handleApplyEdit}>
                 <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Configure Infrastructure Node</h3>
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
                 </div>
                 <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Identifier (Wraps)</label>
                       <textarea rows={1} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-medium resize-none break-words break-all whitespace-pre-wrap" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lifecycle State</label>
                       <select className="w-full px-5 py-3 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-bold uppercase tracking-widest appearance-none cursor-pointer" value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value as any})}>
                          <option value="PLANNING">PLANNING</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="ON_HOLD">ON_HOLD</option>
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Baseline Value (SAR)</label>
                          <input type="number" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-bold" value={projectForm.value} onChange={e => setProjectForm({...projectForm, value: Number(e.target.value)})} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Internal Costs (SAR)</label>
                          <input type="number" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-bold" value={projectForm.costs} onChange={e => setProjectForm({...projectForm, costs: Number(e.target.value)})} />
                       </div>
                    </div>
                 </div>
                 <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Abort Updates</button>
                    <button type="submit" className="flex-1 py-4 text-white font-bold rounded-[10px] uppercase text-[10px] tracking-widest shadow-lg hover:brightness-110 transition-all" style={{ backgroundColor: manifest.global.primaryColor }}>Deploy Sync</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

/* Adding missing icon components to resolve "Cannot find name" errors */

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const WorkflowIconLarge = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EditIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AccountingIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const WorkflowIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SignalIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const FileIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const DownloadIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CheckIconSmall = () => (
  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
  </svg>
);

export default ProjectPipeline;
