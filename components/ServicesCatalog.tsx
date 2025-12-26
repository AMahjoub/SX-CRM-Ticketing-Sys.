
import React, { useState } from 'react';
import { Service, SystemManifest } from '../types';

interface ServicesCatalogProps {
  services: Service[];
  onAdd: (srv: Service) => void;
  onUpdate: (id: string, updates: Partial<Service>) => void;
  onDelete: (id: string) => void;
  manifest: SystemManifest;
}

const ServicesCatalog: React.FC<ServicesCatalogProps> = ({ services, onAdd, onUpdate, onDelete, manifest }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', basePrice: 0 });

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', basePrice: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setFormData({ name: srv.name, description: srv.description, basePrice: srv.basePrice });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      onUpdate(editingService.id, formData);
    } else {
      onAdd({ id: `srv-${Date.now()}`, ...formData });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex justify-between items-center">
        <div className="min-w-0 flex-1 pr-4">
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Services Catalog</h2>
          <p className="text-slate-500 font-normal break-words">Define and manage your infrastructure offerings.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="px-6 py-3 text-white rounded-[10px] font-medium shadow-md transition-all hover:brightness-110 active:scale-95 flex items-center gap-2 shrink-0" 
          style={{ backgroundColor: manifest.global.primaryColor }}
        >
          <PlusIcon /> New Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map(srv => (
          <div key={srv.id} className="bg-white p-8 rounded-[10px] border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all group min-w-0">
            <div className="flex justify-between items-start mb-2 min-w-0">
              <h3 className="text-xl font-medium text-slate-900 break-words whitespace-pre-wrap flex-1 pr-2">{srv.name}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button 
                  onClick={() => handleOpenEdit(srv)} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
                  title="Edit Service"
                >
                  <EditIconSmall />
                </button>
                <button 
                  onClick={() => { if(confirm('Delete this service offering?')) onDelete(srv.id); }} 
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                  title="Delete Service"
                >
                  <TrashIconSmall />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500 font-normal mb-8 flex-1 leading-relaxed line-clamp-3 break-words">{srv.description}</p>
            <div className="pt-6 border-t border-slate-50 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Rate</span>
              <span className="text-lg font-bold text-slate-900 break-all">{manifest.global.currency} {srv.basePrice.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[15px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
             <form onSubmit={handleSubmit}>
               <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                 <h3 className="text-2xl font-medium text-slate-900 tracking-tight">
                   {editingService ? 'Configure Service offering' : 'Initialize New Offering'}
                 </h3>
               </div>
               <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Service Identifier (Wraps)</label>
                    <textarea 
                      required 
                      rows={1}
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-medium focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all resize-none break-words whitespace-pre-wrap" 
                      placeholder="e.g. Infrastructure Audit" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contextual Description</label>
                    <textarea 
                      rows={3} 
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-[12px] outline-none text-sm font-normal resize-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all break-words whitespace-pre-wrap" 
                      placeholder="Detail the scope of this offering..." 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Standard Base Price ({manifest.global.currency})</label>
                    <input required type="number" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-[12px] outline-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all" placeholder="0" value={formData.basePrice || ''} onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})} />
                  </div>
               </div>
               <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Abort</button>
                 <button 
                   type="submit" 
                   className="flex-1 py-4 text-white font-bold rounded-[10px] uppercase text-[10px] tracking-widest shadow-lg transition-all hover:brightness-110 active:scale-[0.98]" 
                   style={{ backgroundColor: manifest.global.primaryColor }}
                 >
                   {editingService ? 'Deploy Updates' : 'Authorize Offering'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const EditIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default ServicesCatalog;
