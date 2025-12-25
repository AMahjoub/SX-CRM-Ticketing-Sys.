
import React, { useState, useMemo } from 'react';
import { Customer, User, Project, ProjectPayment, SystemManifest, Service, UserRole, ProjectTask } from '../types';

interface ProjectPipelineProps {
  customers: Customer[];
  staff: User[];
  projects: Project[];
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
  const [isFinancialProbeOpen, setIsFinancialProbeOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: 'Progress collection' });

  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    name: '',
    description: '',
    clientId: '',
    adminId: '',
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
    const totalCollected = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const vat = p.value * p.taxRate;
    const totalContract = p.value + vat;
    const outstanding = totalContract - totalCollected;
    const profit = p.value - p.costs;
    const margin = (profit / p.value) * 100 || 0;
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
                <p className="text-xs text-slate-400 font-normal mb-6 line-clamp-1 break-words">{proj.description}</p>
                
                <div className="grid grid-cols-3 gap-4">
                   <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Value</p>
                     <p className="text-sm font-medium text-slate-900">{manifest.global.currency} {proj.value.toLocaleString()}</p>
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
                  onClick={() => { setSelectedProjectId(proj.id); setIsFinancialProbeOpen(true); }}
                  className="px-6 py-2 text-white rounded-[10px] font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: manifest.global.primaryColor }}
                >
                  Commercial Audit
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

      {isFinancialProbeOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[15px] w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="text-2xl font-medium text-slate-900 tracking-tight break-words">Project Financial Probe</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 truncate">Audit ID: {selectedProject.id} | {selectedProject.name}</p>
              </div>
              <button onClick={() => setIsFinancialProbeOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0"><CloseIcon /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(() => {
                    const { totalCollected, vat, totalContract, outstanding, profit, margin } = calculateFinancials(selectedProject);
                    return (
                      <>
                        <div className="p-5 bg-slate-50 rounded-[12px] border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract + VAT</p>
                          <p className="text-xl font-medium text-slate-900 break-words">SAR {totalContract.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 mt-1 uppercase">VAT (15%): {vat.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-emerald-50 rounded-[12px] border border-emerald-200">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Realized</p>
                          <p className="text-xl font-medium text-emerald-700 break-words">SAR {totalCollected.toLocaleString()}</p>
                          <p className="text-[9px] text-emerald-500 mt-1 uppercase">{((totalCollected / totalContract) * 100).toFixed(1)}% Invoiced</p>
                        </div>
                        <div className="p-5 bg-rose-50 rounded-[12px] border border-rose-200">
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Outstanding</p>
                          <p className="text-xl font-medium text-rose-700 break-words">SAR {outstanding.toLocaleString()}</p>
                          <p className="text-[9px] text-rose-400 mt-1 uppercase">Awaiting Collection</p>
                        </div>
                        <div className="p-5 bg-[#262626] rounded-[12px] shadow-lg text-white">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Margin (EBITDA)</p>
                          <p className="text-xl font-medium">{margin.toFixed(1)}%</p>
                          <p className="text-[9px] text-emerald-400 mt-1 uppercase">Profit: SAR {profit.toLocaleString()}</p>
                        </div>
                      </>
                    )
                  })()}
               </div>

               <div className="space-y-6">
                 <div className="border-b border-slate-100 pb-3">
                   <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Transaction Ledger</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Actual Collections</p>
                      <div className="space-y-2 mb-4">
                         {selectedProject.payments.length === 0 ? (
                           <p className="text-xs text-slate-300 italic py-4">No audited transactions.</p>
                         ) : (
                           selectedProject.payments.map(p => (
                             <div key={p.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-[12px] border border-slate-100 min-w-0">
                                <div className="min-w-0 flex-1 pr-3">
                                  <p className="text-xs font-bold text-slate-900">{manifest.global.currency} {p.amount.toLocaleString()}</p>
                                  <p className="text-[9px] text-slate-400 uppercase">{p.date}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 font-normal break-words break-all text-right max-w-[150px]">{p.note}</p>
                             </div>
                           ))
                         )}
                      </div>
                      {canEdit && (
                        <div className="bg-slate-50 p-6 rounded-[15px] border border-slate-200 space-y-4">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Audit New Transaction</p>
                          <div className="grid grid-cols-2 gap-3">
                             <input type="number" placeholder="Amount" className="px-4 py-3 text-xs border border-slate-200 rounded-[10px] bg-white outline-none" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                             <input type="date" className="px-4 py-3 text-xs border border-slate-200 rounded-[10px] bg-white outline-none" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                          </div>
                          <textarea 
                            rows={1}
                            placeholder="Transaction reference..." 
                            className="w-full px-4 py-3 text-xs border border-slate-200 rounded-[10px] bg-white outline-none resize-none break-words break-all whitespace-pre-wrap min-h-[46px]" 
                            value={paymentForm.note} 
                            onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} 
                          />
                          <button onClick={submitPayment} className="w-full py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-[10px] shadow-sm hover:bg-emerald-700 transition-all">+ Record Audit</button>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Files & Artifacts</p>
                      <div className="space-y-2">
                        {selectedProject.attachments?.map(att => (
                          <div key={att.name} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-[12px] shadow-sm min-w-0">
                             <div className="p-2 bg-slate-50 rounded shrink-0"><FileIcon /></div>
                             <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold text-slate-900 break-all">{att.name}</p>
                               <p className="text-[9px] text-slate-400 uppercase">Unit Artifact</p>
                             </div>
                          </div>
                        ))}
                        <button onClick={() => {
                          const name = prompt("File name:");
                          if (name) onUpdateProject(selectedProject.id, { attachments: [...(selectedProject.attachments || []), { name, url: '#', type: 'doc' }] });
                        }} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-[15px] text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-slate-400 transition-all">Upload Infrastructure Document</button>
                      </div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
               <button onClick={() => setIsFinancialProbeOpen(false)} className="px-10 py-3 bg-slate-900 text-white rounded-[10px] font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all hover:brightness-110">Close Audit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const TrashIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const WorkflowIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

export default ProjectPipeline;
