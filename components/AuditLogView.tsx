
import React, { useState } from 'react';
import { AuditLog, SystemManifest } from '../types';

interface AuditLogViewProps {
  logs: AuditLog[];
  manifest: SystemManifest;
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, manifest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(l => 
    l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.action_datetime.localeCompare(a.action_datetime));

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">System Audit Registry</h2>
          <p className="text-slate-500 font-normal">Immutable record of platform architecture changes and administrative actions.</p>
        </div>
      </div>

      <div className="relative max-w-xl group">
        <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input 
          type="text" 
          placeholder="Lookup by user or email..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[10px] outline-none transition-all font-normal text-sm shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-normal border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">Author Identity</th>
                <th className="px-8 py-6">Email Channel</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 text-sm uppercase tracking-widest font-normal italic">Protocol history is empty.</td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="px-8 py-6 font-mono text-[11px] text-slate-500">
                      {new Date(log.action_datetime).toLocaleString()}
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 text-sm">{log.user_name}</p>
                    </td>
                    <td className="px-8 py-6 text-sm font-normal text-slate-600">{log.user_email}</td>
                    <td className="px-8 py-6 text-right">
                       <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Inspect Change <ArrowRightIconSmall /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[25px] w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Protocol Audit Details</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Executed by {selectedLog.user_name} at {new Date(selectedLog.action_datetime).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><CloseIcon /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">State Before Change</h4>
                  <div className="bg-slate-50 rounded-[15px] p-6 border border-slate-200 overflow-auto font-mono text-[11px] leading-relaxed max-h-[400px]">
                     <pre className="whitespace-pre-wrap break-all text-slate-600">
                        {JSON.stringify(selectedLog.before_change, null, 2)}
                     </pre>
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">State After Change</h4>
                  <div className="bg-emerald-50/30 rounded-[15px] p-6 border border-emerald-100 overflow-auto font-mono text-[11px] leading-relaxed max-h-[400px]">
                     <pre className="whitespace-pre-wrap break-all text-emerald-700">
                        {JSON.stringify(selectedLog.after_change, null, 2)}
                     </pre>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => setSelectedLog(null)} className="px-12 py-3 bg-slate-900 text-white rounded-[12px] font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg">Close Audit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ArrowRightIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;

export default AuditLogView;
