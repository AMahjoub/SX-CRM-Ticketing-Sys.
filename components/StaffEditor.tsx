
import React, { useState } from 'react';
import { User, UserRole, SystemManifest, ViewType, CrudPermissions } from '../types';

interface StaffEditorProps {
  staffMember: User;
  manifest: SystemManifest;
  onUpdate: (updates: Partial<User>) => void;
  onBack: () => void;
}

const DEFAULT_CRUD: CrudPermissions = { view: true, create: false, edit: false, delete: false };

const StaffEditor: React.FC<StaffEditorProps> = ({ staffMember, manifest, onUpdate, onBack }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    ...staffMember,
    password: staffMember.password || '',
    permissions: staffMember.permissions || [],
    crudPermissions: staffMember.crudPermissions || {}
  });

  const viewsToManage: {id: ViewType, label: string}[] = [
    { id: 'DASHBOARD', label: manifest.navigation.dashboard },
    { id: 'CRM', label: manifest.navigation.crm },
    { id: 'PROJECT_PIPELINE', label: manifest.navigation.projects },
    { id: 'FINANCIAL_PIPELINE', label: manifest.navigation.financials },
    { id: 'TICKETS', label: manifest.navigation.tickets },
    { id: 'SERVICES_CATALOG', label: manifest.navigation.services },
    { id: 'ADMIN_MGMT', label: manifest.navigation.admin },
  ];

  const toggleViewPermission = (view: ViewType) => {
    const current = formData.permissions || [];
    const updated = current.includes(view) 
      ? current.filter(v => v !== view) 
      : [...current, view];
    
    const updatedCrud = { ...(formData.crudPermissions || {}) };
    if (!updated.includes(view)) {
      delete updatedCrud[view];
    } else if (!updatedCrud[view]) {
      updatedCrud[view] = { ...DEFAULT_CRUD };
    }

    setFormData({ ...formData, permissions: updated, crudPermissions: updatedCrud });
  };

  const updateCrud = (view: ViewType, field: keyof CrudPermissions, val: boolean) => {
    const updatedCrud = { ...(formData.crudPermissions || {}) };
    if (!updatedCrud[view]) updatedCrud[view] = { ...DEFAULT_CRUD };
    updatedCrud[view] = { ...updatedCrud[view], [field]: val };
    setFormData({ ...formData, crudPermissions: updatedCrud });
  };

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans font-normal pb-32">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-[12px] text-slate-400 hover:bg-slate-50 shadow-sm transition-all active:scale-95"><BackIcon /></button>
        <div>
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Configure Team Member</h2>
          <p className="text-slate-500 break-all">Staff ID: {staffMember.id} | Protocol Identity: {staffMember.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white p-8 rounded-[20px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex flex-col items-center text-center min-w-0">
                 <img src={staffMember.avatar} className="w-24 h-24 rounded-[20px] object-cover mb-4 border-4 border-slate-50 shadow-md" alt="" />
                 <h3 className="text-xl font-bold text-slate-900 break-words whitespace-pre-wrap">{formData.name}</h3>
                 <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">{formData.role}</p>
              </div>
              <div className="space-y-6 pt-6 border-t border-slate-50">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Name (Wraps)</label>
                    <textarea 
                      rows={1}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none text-sm font-medium resize-none break-words whitespace-pre-wrap focus:bg-white focus:ring-1 focus:ring-slate-200" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registry Email</label>
                    <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none text-sm font-medium break-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Security Passphrase</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none text-sm font-bold tracking-widest" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Tier</label>
                    <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-[12px] outline-none appearance-none cursor-pointer text-sm font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                       <option value={UserRole.STAFF}>Support Staff</option>
                       <option value={UserRole.ADMIN}>Platform Administrator</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                 <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Security Capability Matrix</h4>
                 <p className="text-[11px] text-slate-400 mt-1 uppercase font-medium">Define module access and operational permissions (CRUD)</p>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left font-normal border-collapse">
                  <thead className="bg-slate-50/50 text-[9px] uppercase tracking-widest font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">System Module</th>
                      <th className="px-6 py-5 text-center">Visibility (R)</th>
                      <th className="px-6 py-5 text-center">Create (C)</th>
                      <th className="px-6 py-5 text-center">Modify (U)</th>
                      <th className="px-6 py-5 text-center">Revoke (D)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {viewsToManage.map(view => {
                      const isVisible = formData.permissions?.includes(view.id);
                      const perms = (formData.crudPermissions && formData.crudPermissions[view.id]) || DEFAULT_CRUD;
                      
                      return (
                        <tr key={view.id} className={`transition-all ${isVisible ? 'bg-white' : 'bg-slate-50/30 opacity-60'}`}>
                          <td className="px-8 py-6">
                            <label className="flex items-center gap-4 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all ${isVisible ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 group-hover:border-slate-400'}`}>
                                <input type="checkbox" checked={isVisible} onChange={() => toggleViewPermission(view.id)} className="hidden" />
                                {isVisible && <CheckIcon />}
                              </div>
                              <span className={`text-xs font-bold transition-colors break-words whitespace-pre-wrap ${isVisible ? 'text-slate-900' : 'text-slate-400'}`}>{view.label}</span>
                            </label>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <input type="checkbox" disabled={!isVisible} checked={perms.view} onChange={e => updateCrud(view.id, 'view', e.target.checked)} className="w-4 h-4 accent-emerald-500 disabled:opacity-20 cursor-pointer" />
                          </td>
                          <td className="px-6 py-6 text-center">
                            <input type="checkbox" disabled={!isVisible} checked={perms.create} onChange={e => updateCrud(view.id, 'create', e.target.checked)} className="w-4 h-4 accent-emerald-500 disabled:opacity-20 cursor-pointer" />
                          </td>
                          <td className="px-6 py-6 text-center">
                            <input type="checkbox" disabled={!isVisible} checked={perms.edit} onChange={e => updateCrud(view.id, 'edit', e.target.checked)} className="w-4 h-4 accent-emerald-500 disabled:opacity-20 cursor-pointer" />
                          </td>
                          <td className="px-6 py-6 text-center">
                            <input type="checkbox" disabled={!isVisible} checked={perms.delete} onChange={e => updateCrud(view.id, 'delete', e.target.checked)} className="w-4 h-4 accent-emerald-500 disabled:opacity-20 cursor-pointer" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
           <div className="hidden md:flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><LockIcon /></div>
              <div>
                 <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest leading-none">Security Deployment</p>
                 <p className="text-[9px] text-slate-400 uppercase mt-1">Authorized by root administrator</p>
              </div>
           </div>
           <div className="flex gap-4 flex-1 md:flex-none">
              <button onClick={onBack} className="px-8 py-3.5 font-bold text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Discard Sync</button>
              <button 
                onClick={handleSave}
                className="flex-1 md:flex-none px-16 py-3.5 text-white font-bold rounded-[12px] uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 flex items-center justify-center gap-3"
                style={{ backgroundColor: manifest.global.primaryColor }}
              >
                <SaveIcon /> Deploy & Save Profile Permissions
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>;
const CheckIcon = () => <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>;

export default StaffEditor;
