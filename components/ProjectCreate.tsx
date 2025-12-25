
import React, { useState, useMemo } from 'react';
import { Customer, User, Project, ProjectTask, SystemManifest, Service } from '../types';

interface ProjectCreateProps {
  customers: Customer[];
  staff: User[];
  services: Service[];
  currentUser: User;
  onAddProject: (project: Project) => void;
  onBack: () => void;
  manifest: SystemManifest;
}

const ProjectCreate: React.FC<ProjectCreateProps> = ({ 
  customers, 
  staff, 
  services,
  currentUser,
  onAddProject,
  onBack,
  manifest
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    clientId: '',
    adminIds: [currentUser.id],
    value: 0,
    costs: 0,
    awardRef: '',
    invoiceRef: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'PLANNING',
    tasks: [],
    serviceIds: [],
    attachments: []
  });

  const vatAmount = useMemo(() => (formData.value || 0) * 0.15, [formData.value]);
  const totalWithVat = useMemo(() => (formData.value || 0) + vatAmount, [formData.value, vatAmount]);

  const toggleStaffAssignment = (staffId: string) => {
    const current = formData.adminIds || [];
    if (current.includes(staffId)) {
      setFormData({ ...formData, adminIds: current.filter(id => id !== staffId) });
    } else {
      setFormData({ ...formData, adminIds: [...current, staffId] });
    }
  };

  const handleAddService = (serviceId: string) => {
    const current = formData.serviceIds || [];
    if (current.includes(serviceId)) {
      setFormData({ ...formData, serviceIds: current.filter(id => id !== serviceId) });
    } else {
      setFormData({ ...formData, serviceIds: [...current, serviceId] });
    }
  };

  const addNewTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: ProjectTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'Todo'
    };
    setFormData({ ...formData, tasks: [...(formData.tasks || []), task] });
    setNewTaskTitle('');
  };

  const removeTask = (id: string) => {
    setFormData({ ...formData, tasks: formData.tasks?.filter(t => t.id !== id) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId) {
      alert("Please define the Project Identifier and Client Profile.");
      return;
    }

    const project: Project = {
      ...(formData as Project),
      id: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      taxRate: 0.15,
      paymentRates: { first: 25, second: 25, third: 25, final: 25 },
      payments: [],
      expectedCollections: [],
      guarantees: '',
      financialNotes: '',
      createdAt: new Date().toISOString(),
    };

    onAddProject(project);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 font-sans pb-32">
      <div className="flex items-center gap-6">
        <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-[12px] text-slate-400 hover:bg-slate-50 transition-all shadow-sm"><BackIcon /></button>
        <div>
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Initialize Infrastructure Project</h2>
          <p className="text-slate-500 font-normal uppercase text-[10px] tracking-widest mt-1">Authorized by: {currentUser.name} | Security Protocol Active</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[24px] border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white"><InfoIcon /></div>
                <h3 className="text-lg font-medium text-slate-900">Protocol Parameters</h3>
             </div>
             
             <div className="grid grid-cols-1 gap-8">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Identifier (Wraps)</label>
                  <textarea 
                    required 
                    rows={1}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-sm font-medium focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all resize-none break-words break-all whitespace-pre-wrap min-h-[56px]" 
                    placeholder="Project Name..." 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Operational Description</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-sm font-normal focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all resize-none break-words whitespace-pre-wrap" 
                    placeholder="Detail the scope of this project..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registry Client</label>
                    <select required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-sm font-bold appearance-none cursor-pointer" value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                       <option value="">Select Entity...</option>
                       {customers.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Support Staff (Multi-Select)</label>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-[15px] max-h-[200px] overflow-y-auto space-y-2">
                       {staff.map(s => (
                         <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={formData.adminIds?.includes(s.id)} 
                              onChange={() => toggleStaffAssignment(s.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                            />
                            <div className="flex items-center gap-2">
                               <img src={s.avatar} className="w-6 h-6 rounded-full" alt="" />
                               <span className="text-xs font-medium text-slate-700">{s.name}</span>
                            </div>
                         </label>
                       ))}
                    </div>
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-white p-10 rounded-[24px] border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white"><WorkflowIcon /></div>
                <h3 className="text-lg font-medium text-slate-900">Operational Roadmap</h3>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-6 rounded-[20px] border border-slate-100 shadow-inner">
                <textarea 
                  rows={1}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-[15px] outline-none text-sm resize-none break-words break-all whitespace-pre-wrap min-h-[56px] focus:ring-1 focus:ring-slate-300" 
                  placeholder="Define new project milestone..." 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addNewTask();
                    }
                  }}
                />
                <button type="button" onClick={addNewTask} className="px-10 py-4 bg-slate-900 text-white rounded-[15px] font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shrink-0 h-[56px]">+ Provision</button>
             </div>

             <div className="space-y-3">
                {formData.tasks?.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-100 rounded-[20px] text-center">
                    <p className="text-xs text-slate-400 italic font-medium uppercase tracking-widest">No milestones provisioned for this lifecycle.</p>
                  </div>
                ) : (
                  formData.tasks?.map(t => (
                    <div key={t.id} className="flex items-start justify-between p-5 bg-slate-50 rounded-[15px] border border-slate-100 animate-in slide-in-from-left-2 group min-w-0">
                       <div className="flex items-start gap-4 flex-1 pr-4 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 shrink-0"></div>
                          <span className="text-sm font-medium text-slate-900 break-words break-all whitespace-pre-wrap">{t.title}</span>
                       </div>
                       <button type="button" onClick={() => removeTask(t.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"><TrashIconSmall /></button>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[24px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                 <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white"><AccountingIcon /></div>
                 <h3 className="text-lg font-medium text-slate-900">Financial Ledger</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Base Contract Value (SAR)</label>
                   <input required type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-lg font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all" value={formData.value || ''} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
                </div>
                
                {/* AUTO VAT DISPLAY */}
                <div className="p-6 bg-slate-900 rounded-[20px] shadow-xl text-white space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Provision (15%)</p>
                        <p className="text-lg font-medium text-emerald-400">+ SAR {vatAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Total</p>
                        <p className="text-2xl font-bold tracking-tight text-white">SAR {totalWithVat.toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-1.5 pt-4">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Projected Costs</label>
                   <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-lg font-bold text-slate-500 focus:bg-white transition-all" value={formData.costs || ''} onChange={e => setFormData({...formData, costs: Number(e.target.value)})} />
                </div>
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Award Ref (GCP/Tender)</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-xs font-bold" placeholder="REF-000-000" value={formData.awardRef} onChange={e => setFormData({...formData, awardRef: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Invoice Master Ref</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-xs font-bold" placeholder="INV-MASTER" value={formData.invoiceRef} onChange={e => setFormData({...formData, invoiceRef: e.target.value})} />
                  </div>
                </div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[24px] border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Launch Date</label>
                 <input type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-sm font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target End Date</label>
                 <input type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[15px] outline-none text-sm font-bold" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
           </div>

           <div className="bg-[#262626] p-10 rounded-[24px] shadow-2xl text-white space-y-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10"><PulseIconLarge /></div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 border-b border-white/5 pb-4 relative z-10">Service Linkage</h4>
              <div className="space-y-3 relative z-10">
                {services.map(s => (
                  <button 
                    key={s.id}
                    type="button"
                    onClick={() => handleAddService(s.id)}
                    className={`w-full p-4 rounded-[12px] border text-left transition-all flex items-center justify-between ${formData.serviceIds?.includes(s.id) ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="pr-4 min-w-0">
                      <p className="text-xs font-bold tracking-tight break-words">{s.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">SAR {s.basePrice.toLocaleString()}</p>
                    </div>
                    {formData.serviceIds?.includes(s.id) && <CheckIconSmall />}
                  </button>
                ))}
              </div>
           </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
           <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="hidden md:flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><LockIcon /></div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest leading-none">Security Deployment</p>
                    <p className="text-[9px] text-slate-400 uppercase mt-1">Infrastructure Provisioning</p>
                 </div>
              </div>
              <div className="flex gap-4 flex-1 md:flex-none">
                 <button type="button" onClick={onBack} className="px-8 py-3.5 font-bold text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Discard Draft</button>
                 <button 
                   type="submit"
                   className="flex-1 md:flex-none px-16 py-3.5 text-white font-bold rounded-[12px] uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 flex items-center justify-center gap-3"
                   style={{ backgroundColor: manifest.global.primaryColor }}
                 >
                   <SaveIcon /> Deploy Project & Sync Pipeline
                 </button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const AccountingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrashIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const CheckIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const PulseIconLarge = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

export default ProjectCreate;
