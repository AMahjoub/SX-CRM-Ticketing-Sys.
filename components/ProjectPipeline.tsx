
import React, { useState, useMemo, useRef } from 'react';
import { Customer, User, Project, ProjectPayment, SystemManifest, Service, UserRole, ProjectTask, Attachment, Ticket } from '../types';

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

  const calculateFinancials = (p: Project) => {
    const totalCollected = p.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
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
                
                {/* MULTI-STAFF AVATARS */}
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

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[15px] w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <form onSubmit={handleApplyEdit} className="flex flex-col h-full">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Configure Project</h3>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><CloseIcon /></button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Identifier (Wraps)</label>
                    <textarea 
                      required 
                      rows={1}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none font-normal resize-none break-words break-all whitespace-pre-wrap focus:bg-white focus:ring-1 focus:ring-slate-200 min-h-[50px]" 
                      placeholder="Project Name..." 
                      value={projectForm.name} 
                      onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                    />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assign Leads (Multi-Select)</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-[12px]">
                       {staff.map(s => (
                         <button 
                            key={s.id}
                            type="button"
                            onClick={() => toggleStaffAssignmentInForm(s.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-tighter ${projectForm.adminIds?.includes(s.id) ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                         >
                            <img src={s.avatar} className="w-4 h-4 rounded-full" alt="" />
                            {s.name}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contextual Description</label>
                    <textarea 
                      rows={2} 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none font-normal resize-none break-words whitespace-pre-wrap focus:bg-white focus:ring-1 focus:ring-slate-200" 
                      placeholder="Project Scope..." 
                      value={projectForm.description} 
                      onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Scheduled Start</label>
                    <input type="date" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none font-normal" value={projectForm.startDate} onChange={e => setProjectForm({...projectForm, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Client Entity</label>
                    <select required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none appearance-none cursor-pointer" value={projectForm.clientId} onChange={e => setProjectForm({...projectForm, clientId: e.target.value})}>
                      <option value="">Choose Registry Client...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                    </select>
                  </div>
                   <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contract Base Value</label>
                    <input required type="number" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none font-bold" value={projectForm.value || ''} onChange={e => setProjectForm({...projectForm, value: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Allocated Costs</label>
                    <input type="number" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none font-bold" value={projectForm.costs || ''} onChange={e => setProjectForm({...projectForm, costs: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Project Roadmap & Tasks</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Add internal operational milestones for this project.</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-[15px] border border-slate-100">
                    <textarea 
                      rows={1}
                      placeholder="Add a new task..." 
                      className="flex-1 px-4 py-3 text-xs bg-white border border-slate-200 rounded-[10px] outline-none resize-none break-words break-all whitespace-pre-wrap focus:ring-1 focus:ring-slate-300 min-h-[46px]"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => { 
                        if(e.key === 'Enter' && !e.shiftKey) { 
                          e.preventDefault(); 
                          addNewTaskToForm(); 
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={addNewTaskToForm} 
                      className="px-6 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-[10px] hover:brightness-125 transition-all shrink-0 h-[46px]"
                    >
                      + Provision
                    </button>
                  </div>
                  <div className="space-y-3">
                    {projectForm.tasks?.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-[12px] border border-dashed border-slate-200 uppercase tracking-widest font-bold">No tasks provisioned.</p>
                    )}
                    {projectForm.tasks?.map((t) => (
                      <div key={t.id} className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-[12px] shadow-sm animate-in slide-in-from-left-2">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${t.status === 'Done' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className={`text-xs font-medium flex-1 break-words break-all whitespace-pre-wrap ${t.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <select 
                            className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded-md outline-none font-bold uppercase tracking-tighter" 
                            value={t.status} 
                            onChange={e => updateTaskStatusInForm(t.id, e.target.value as any)}
                          >
                            <option value="Todo">Todo</option>
                            <option value="Doing">Doing</option>
                            <option value="Done">Done</option>
                          </select>
                          <button 
                            type="button" 
                            onClick={() => removeTaskFromForm(t.id)} 
                            className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <TrashIconSmall />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Abort</button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 text-white font-bold rounded-[12px] uppercase text-xs shadow-lg transition-all hover:brightness-110 tracking-widest active:scale-[0.98]" 
                  style={{ backgroundColor: manifest.global.primaryColor }}
                >
                  Sync Project Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isControlCenterOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[25px] w-full max-w-6xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-medium text-slate-900 tracking-tight break-words">{selectedProject.name}</h3>
                   <span className="text-[10px] font-bold px-3 py-1 bg-slate-900 text-white rounded-full uppercase tracking-widest shrink-0">{selectedProject.id}</span>
                </div>
                <div className="flex items-center gap-6 mt-1">
                   <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Client: {customers.find(c => c.id === selectedProject.clientId)?.company}</p>
                   <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Leads:</p>
                      <div className="flex -space-x-1">
                         {staff.filter(s => selectedProject.adminIds?.includes(s.id)).map(s => <img key={s.id} src={s.avatar} className="w-5 h-5 rounded-full ring-1 ring-white" alt="" title={s.name} />)}
                      </div>
                   </div>
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
               {controlCenterTab === 'FINANCE' && (
                 <div className="space-y-10 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(() => {
                            const { totalCollected, vat, totalContract, outstanding, profit, margin } = calculateFinancials(selectedProject);
                            return (
                            <>
                                <div className="p-6 bg-slate-50 rounded-[20px] border border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Contract (Inc. VAT)</p>
                                <p className="text-xl font-bold text-slate-900 break-words">SAR {totalContract.toLocaleString()}</p>
                                <p className="text-[9px] text-emerald-600 mt-2 font-bold uppercase">Base: {selectedProject.value.toLocaleString()}</p>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-[20px] text-white">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">VAT Provision (15%)</p>
                                <p className="text-xl font-bold break-words">SAR {vat.toLocaleString()}</p>
                                <p className="text-[9px] text-emerald-400 mt-2 font-bold uppercase">Tax Liability Logged</p>
                                </div>
                                <div className="p-6 bg-emerald-50 rounded-[20px] border border-emerald-200">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Realized Collection</p>
                                <p className="text-xl font-bold text-emerald-700 break-words">SAR {totalCollected.toLocaleString()}</p>
                                <p className="text-[9px] text-emerald-500 mt-2 font-bold uppercase">{((totalCollected / totalContract) * 100).toFixed(1)}% Realized</p>
                                </div>
                                <div className="p-6 bg-rose-50 rounded-[20px] border border-rose-200">
                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Audit Outstanding</p>
                                <p className="text-xl font-bold text-rose-700 break-words">SAR {outstanding.toLocaleString()}</p>
                                <p className="text-[9px] text-rose-400 mt-2 font-bold uppercase">Pending realization</p>
                                </div>
                            </>
                            )
                        })()}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Transactional Ledger</h4>
                            <div className="space-y-3">
                                {selectedProject.payments.length === 0 ? (
                                <p className="text-sm text-slate-300 italic py-6 text-center border-2 border-dashed border-slate-50 rounded-xl">No audited transactions.</p>
                                ) : (
                                selectedProject.payments.map(p => (
                                    <div key={p.id} className="flex items-start justify-between p-5 bg-white border border-slate-100 rounded-[15px] shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-emerald-50 rounded-full text-emerald-600"><CheckIconSmall /></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">SAR {p.amount.toLocaleString()}</p>
                                                <p className="text-[9px] text-slate-400 uppercase font-bold">{p.date}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-normal italic max-w-[150px] text-right">{p.note}</p>
                                    </div>
                                ))
                                )}
                            </div>
                        </div>
                        {canEdit && (
                            <div className="bg-slate-50 p-8 rounded-[25px] border border-slate-100 space-y-6">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Record Transaction</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Collection Amount</label>
                                        <input type="number" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-[12px] text-sm font-bold outline-none" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Date</label>
                                        <input type="date" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-[12px] text-sm font-bold outline-none" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Audit Reference</label>
                                    <textarea rows={1} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-[12px] text-sm font-medium outline-none resize-none" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} />
                                </div>
                                <button onClick={submitPayment} className="w-full py-4 bg-slate-900 text-white font-bold rounded-[12px] text-[10px] uppercase tracking-widest shadow-lg hover:brightness-125 transition-all">Authorize Audit Entry</button>
                            </div>
                        )}
                    </div>
                 </div>
               )}

               {controlCenterTab === 'TASKS' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div>
                            <h4 className="text-lg font-medium text-slate-900">Operational Milestones</h4>
                            <p className="text-xs text-slate-400 font-normal mt-1">Lifecycle roadmap tracking and status registry.</p>
                        </div>
                    </div>
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {selectedProject.tasks?.map(t => (
                            <div key={t.id} className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[20px] shadow-sm">
                                <div className={`w-3 h-3 rounded-full shrink-0 ${t.status === 'Done' ? 'bg-emerald-500' : t.status === 'Doing' ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className={`text-sm font-bold break-words whitespace-pre-wrap ${t.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Status: {t.status}</p>
                                </div>
                                <select 
                                    className="bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-lg px-4 py-2 outline-none cursor-pointer"
                                    value={t.status}
                                    onChange={e => onUpdateProject(selectedProject.id, { tasks: selectedProject.tasks.map(task => task.id === t.id ? { ...task, status: e.target.value as any } : task) })}
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="Doing">Doing</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                        ))}
                        {selectedProject.tasks?.length === 0 && <p className="text-center py-20 text-slate-300 italic uppercase tracking-widest text-sm font-bold">No provisioned milestones.</p>}
                    </div>
                 </div>
               )}

               {controlCenterTab === 'SIGNALS' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div>
                            <h4 className="text-lg font-medium text-slate-900">Project Support Signals</h4>
                            <p className="text-xs text-slate-400 font-normal mt-1">Bidirectional communication related to this infrastructure node.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {relatedTickets.map(t => (
                            <div key={t.id} className="p-6 bg-white border border-slate-100 rounded-[20px] shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[9px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-widest">{t.id}</span>
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.status}</span>
                                </div>
                                <h5 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-4">{t.subject}</h5>
                                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(t.updatedAt).toLocaleDateString()}</p>
                                    <p className="text-[9px] text-slate-900 uppercase font-bold tracking-widest">Inspector Assigned</p>
                                </div>
                            </div>
                        ))}
                        {relatedTickets.length === 0 && <div className="col-span-2 py-24 text-center text-slate-300 italic uppercase tracking-[0.4em] font-bold">No active signals linked to this project node.</div>}
                    </div>
                 </div>
               )}

               {controlCenterTab === 'DOCS' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div>
                            <h4 className="text-lg font-medium text-slate-900">Infrastructure Artifact Vault</h4>
                            <p className="text-xs text-slate-400 font-normal mt-1">Official documentation and technical artifacts.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedProject.attachments?.map(att => (
                            <div key={att.name} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[20px] shadow-sm group">
                                <div className="flex items-center gap-4 min-w-0 pr-4">
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all"><FileIconSmall /></div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{att.name}</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Artifact File</p>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"><DownloadIconSmall /></button>
                            </div>
                        ))}
                        <div className="col-span-full pt-10">
                            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all group"
                            >
                                <div className="p-4 bg-slate-50 rounded-full group-hover:bg-slate-900 group-hover:text-white transition-all"><PlusIcon /></div>
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">Upload Project Documents</span>
                            </button>
                        </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
               <button onClick={() => setIsControlCenterOpen(false)} className="px-12 py-3.5 bg-slate-900 text-white rounded-[12px] font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all hover:brightness-125">Exit Control Center</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const TrashIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const WorkflowIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const AccountingIconSmall = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WorkflowIconSmall = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const SignalIconSmall = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const FileIconSmall = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const DownloadIconSmall = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const CheckIconSmall = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>;

export default ProjectPipeline;
