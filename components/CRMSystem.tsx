
import React, { useState } from 'react';
import { Customer, AccountStatus, SystemManifest, User, UserRole } from '../types';
import { suggestLeadOutreach } from '../services/geminiService';

interface CRMSystemProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  currentUser: User;
  onDelete: (id: string) => void;
  manifest: SystemManifest;
  onViewDetails: (id: string) => void;
}

const CRMSystem: React.FC<CRMSystemProps> = ({ customers, setCustomers, currentUser, onDelete, manifest, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeRegistryTab, setActiveRegistryTab] = useState<'APPROVED' | 'PENDING'>('APPROVED');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '', company: '', email: '', phone: '', status: 'Lead' as Customer['status'], totalPrice: 0, password: '', industry: '', description: ''
  });

  const canCreate = true;
  const canDelete = true;
  const canEdit = true;

  const filteredCustomers = customers.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())) &&
    c.accountStatus === activeRegistryTab
  );

  const pendingApprovalsCount = customers.filter(c => c.accountStatus === AccountStatus.PENDING).length;

  const handleUpdateAccountStatus = (id: string, accountStatus: AccountStatus) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, accountStatus } : c));
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `cust-${Date.now()}`;
    const customer: Customer = {
      ...newCustomer,
      id,
      lifetimeValue: 0,
      paidAmount: 0,
      accountStatus: AccountStatus.APPROVED,
      lastContact: new Date().toISOString().split('T')[0],
      assignedTo: currentUser.id
    };
    setCustomers(prev => [...prev, customer]);
    setIsAddModalOpen(false);
    setNewCustomer({ name: '', company: '', email: '', phone: '', status: 'Lead', totalPrice: 0, password: '', industry: '', description: '' });
  };

  const handleAiOutreach = async (customer: Customer) => {
    setIsAiLoading(true);
    const suggestion = await suggestLeadOutreach(customer);
    alert(`AI Outreach Suggestion for ${customer.name}:\n\n${suggestion}`);
    setIsAiLoading(false);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Client Registry</h2>
          <p className="text-slate-500 font-normal">Manage client identities and account approvals.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-[10px] border border-slate-200">
            <button 
              onClick={() => setActiveRegistryTab('APPROVED')}
              className={`px-5 py-2 rounded-[8px] text-[10px] font-medium uppercase transition-all ${activeRegistryTab === 'APPROVED' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
              style={activeRegistryTab === 'APPROVED' ? { color: manifest.global.primaryColor } : {}}
            >
              Approved
            </button>
            <button 
              onClick={() => setActiveRegistryTab('PENDING')}
              className={`px-5 py-2 rounded-[8px] text-[10px] font-medium uppercase transition-all flex items-center gap-2 ${activeRegistryTab === 'PENDING' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
              style={activeRegistryTab === 'PENDING' ? { color: manifest.global.primaryColor } : {}}
            >
              Pending {pendingApprovalsCount > 0 && <span className="bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] animate-pulse">{pendingApprovalsCount}</span>}
            </button>
          </div>
          {canCreate && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 text-white rounded-[10px] font-medium shadow-md flex items-center gap-2 transition-all hover:scale-105"
              style={{ backgroundColor: manifest.global.primaryColor }}
            >
              <PlusIcon /> Register New Client
            </button>
          )}
        </div>
      </div>

      <div className="relative max-w-xl group">
        <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
          <SearchIcon />
        </span>
        <input 
          type="text" 
          placeholder="Lookup by name, company, or email..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[10px] outline-none transition-all font-normal text-sm shadow-sm"
          onFocus={(e) => e.target.style.borderColor = manifest.global.primaryColor}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-normal">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Client Identity</th>
                <th className="px-8 py-6">Industry</th>
                <th className="px-8 py-6">Email / Channel</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-300 text-sm uppercase tracking-widest font-normal italic">No nodes matching your query.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group font-normal">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 min-w-0 pr-4">
                          <div 
                            className="w-10 h-10 rounded-[8px] flex items-center justify-center font-medium text-xs shrink-0"
                            style={{ backgroundColor: manifest.global.primaryColor + '15', color: manifest.global.primaryColor }}
                          >
                            {customer.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 text-sm break-words whitespace-pre-wrap">{customer.company}</p>
                            <p className="text-[10px] text-slate-400 font-normal tracking-tight uppercase break-words">{customer.name}</p>
                          </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-medium text-slate-500 uppercase tracking-widest break-words">
                      {customer.industry || 'General'}
                    </td>
                    <td className="px-8 py-6 text-sm font-normal text-slate-600 break-all">{customer.email}</td>
                    <td className="px-8 py-6">
                      {customer.accountStatus === AccountStatus.APPROVED ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: manifest.global.primaryColor }}></div>
                          <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: manifest.global.primaryColor }}>
                            AUTHORIZED
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium tracking-widest uppercase text-amber-600">PENDING AUDIT</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 shrink-0">
                        {activeRegistryTab === 'PENDING' ? (
                          <>
                            <button 
                              onClick={() => handleUpdateAccountStatus(customer.id, AccountStatus.APPROVED)}
                              className="text-[10px] font-medium text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-[8px] border border-emerald-100 uppercase tracking-widest transition-all"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleUpdateAccountStatus(customer.id, AccountStatus.REJECTED)}
                              className="text-[10px] font-medium text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-[8px] border border-rose-100 uppercase tracking-widest transition-all"
                            >
                              Deny
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              disabled={isAiLoading}
                              onClick={() => handleAiOutreach(customer)}
                              className="text-[10px] font-medium text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-[8px] border border-slate-200 uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                              <AiIcon /> AI Outreach
                            </button>
                            <button 
                              onClick={() => onViewDetails(customer.id)}
                              className="text-[10px] font-medium text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-[8px] border border-slate-200 uppercase tracking-widest transition-all"
                            >
                              Profile
                            </button>
                            {canDelete && (
                              <button 
                                onClick={() => onDelete(customer.id)}
                                className="text-[10px] font-medium text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-[8px] border border-rose-100 uppercase tracking-widest transition-all"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#262626]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[10px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
             <form onSubmit={handleAddCustomer}>
               <div className="p-8 border-b border-slate-100">
                 <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Manual Client Registration</h3>
               </div>
               <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Client Name (Wraps)</label>
                    <textarea 
                      required 
                      rows={1}
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-[10px] outline-none font-normal resize-none break-words whitespace-pre-wrap focus:ring-1 focus:ring-slate-300 transition-all" 
                      value={newCustomer.name} 
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Company Entity (Wraps)</label>
                    <textarea 
                      required 
                      rows={1}
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-[10px] outline-none font-normal resize-none break-words whitespace-pre-wrap focus:ring-1 focus:ring-slate-300 transition-all" 
                      value={newCustomer.company} 
                      onChange={e => setNewCustomer({...newCustomer, company: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                    <input required type="email" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-[10px] outline-none font-normal" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                  </div>
               </div>
               <div className="p-8 bg-slate-50 flex gap-4">
                 <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 font-medium text-slate-400 uppercase text-xs">Cancel</button>
                 <button 
                  type="submit" 
                  className="flex-1 py-4 text-white font-medium rounded-[10px] uppercase text-xs shadow-md transition-all"
                  style={{ backgroundColor: manifest.global.primaryColor }}
                 >
                   Create Profile
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const AiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

export default CRMSystem;
