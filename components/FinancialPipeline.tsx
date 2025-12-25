
import React, { useMemo, useState } from 'react';
import { Project, Customer, SystemManifest } from '../types';

interface FinancialPipelineProps {
  projects: Project[];
  customers: Customer[];
  manifest: SystemManifest;
}

const FinancialPipeline: React.FC<FinancialPipelineProps> = ({ projects, customers, manifest }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Derive available years from existing data
  const availableYears = useMemo(() => {
    const years = projects.map(p => new Date(p.startDate || p.createdAt).getFullYear());
    years.push(currentYear);
    return Array.from(new Set(years)).sort((a: number, b: number) => b - a);
  }, [projects, currentYear]);

  const getClientName = (id: string) => customers.find(c => c.id === id)?.company || 'Unknown Client';

  // Calculations isolated per financial cycle
  const { filteredProjects, accountingTotals, quarterlyVat } = useMemo(() => {
    const filtered = projects.filter(p => new Date(p.startDate || p.createdAt).getFullYear() === selectedYear);
    
    const initialQuarterly = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

    const totals = filtered.reduce((acc, proj: Project) => {
      const projValue = Number(proj.value);
      const projTaxRate = Number(proj.taxRate || 0.15); // Default to 15% if not set
      const vat = projValue * projTaxRate;
      const totalPayable = projValue + vat;
      const collected = proj.payments.reduce((sum: number, p) => sum + Number(p.amount), 0);
      const outstanding = totalPayable - collected;
      
      // Determine Quarter
      const date = new Date(proj.startDate || proj.createdAt);
      const month = date.getMonth();
      let qKey: keyof typeof initialQuarterly = 'Q1';
      if (month >= 0 && month <= 2) qKey = 'Q1';
      else if (month >= 3 && month <= 5) qKey = 'Q2';
      else if (month >= 6 && month <= 8) qKey = 'Q3';
      else if (month >= 9 && month <= 11) qKey = 'Q4';

      acc.qVat[qKey] += vat;

      return {
        dealValue: acc.dealValue + projValue,
        vatLiability: acc.vatLiability + vat,
        collected: acc.collected + collected,
        outstanding: acc.outstanding + outstanding,
        qVat: acc.qVat
      };
    }, { dealValue: 0, vatLiability: 0, collected: 0, outstanding: 0, qVat: initialQuarterly });

    return { filteredProjects: filtered, accountingTotals: totals, quarterlyVat: totals.qVat };
  }, [projects, selectedYear]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Financial Pipeline</h2>
          <p className="text-slate-500 font-normal">Annualized fiscal management for {selectedYear} independently.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-[12px] border border-slate-200">
           {availableYears.map(year => (
             <button 
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-6 py-2 rounded-[10px] text-[10px] font-bold uppercase tracking-widest transition-all ${selectedYear === year ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                style={selectedYear === year ? { color: manifest.global.primaryColor } : {}}
             >
               FY {year}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[10px] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-[8px] font-bold uppercase tracking-widest">Cycle: {selectedYear}</div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Cycle Receivables</p>
          <h3 className="text-2xl font-medium text-slate-900">SAR {(accountingTotals.dealValue + accountingTotals.vatLiability).toLocaleString()}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-normal">FY {selectedYear} Aggregate</p>
        </div>
        <div 
          className="p-6 rounded-[10px] border shadow-sm"
          style={{ backgroundColor: manifest.global.primaryColor + '10', borderColor: manifest.global.primaryColor + '20' }}
        >
          <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: manifest.global.primaryColor }}>Cycle Realized</p>
          <h3 className="text-2xl font-medium" style={{ color: manifest.global.primaryColor }}>SAR {accountingTotals.collected.toLocaleString()}</h3>
          <div className="w-full bg-white/50 h-1.5 rounded-full mt-3 overflow-hidden">
             <div 
               className="h-full rounded-full transition-all duration-1000" 
               style={{ 
                 width: `${((accountingTotals.collected / (accountingTotals.dealValue + accountingTotals.vatLiability)) * 100) || 0}%`,
                 backgroundColor: manifest.global.primaryColor
               }}
             ></div>
          </div>
        </div>
        <div className="bg-rose-50 p-6 rounded-[10px] border border-rose-100 shadow-sm">
          <p className="text-[10px] font-medium text-rose-600 uppercase tracking-widest mb-2">Cycle Outstanding</p>
          <h3 className="text-2xl font-medium text-rose-600">SAR {accountingTotals.outstanding.toLocaleString()}</h3>
          <p className="text-[10px] text-rose-400 mt-2 font-normal">Pending Realization</p>
        </div>
        <div className="bg-[#262626] p-6 rounded-[10px] shadow-xl text-white">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2">VAT Provision (15%)</p>
          <h3 className="text-2xl font-medium text-white">SAR {accountingTotals.vatLiability.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-500 mt-2 font-normal">Liability Identified</p>
        </div>
      </div>

      {/* QUARTERLY VAT SECTION */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">Quarterly Tax Liability Registry</h3>
           <div className="flex-1 h-px bg-slate-200"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
           {[
             { id: 'Q1', label: '1st Quarter', range: 'Jan - Mar' },
             { id: 'Q2', label: '2nd Quarter', range: 'Apr - Jun' },
             { id: 'Q3', label: '3rd Quarter', range: 'Jul - Sep' },
             { id: 'Q4', label: '4th Quarter', range: 'Oct - Dec' }
           ].map(q => (
             <div key={q.id} className="bg-white p-6 rounded-[15px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-tighter">{q.id}</span>
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{q.range}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Provisioned VAT</p>
                <h4 className="text-lg font-bold text-slate-900 leading-none">SAR {quarterlyVat[q.id as keyof typeof quarterlyVat].toLocaleString()}</h4>
                <div className="mt-4 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Audit Status: Ready</p>
                   </div>
                </div>
             </div>
           ))}
           <div className="bg-slate-900 p-6 rounded-[15px] shadow-2xl text-white flex flex-col justify-between border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-1">End of Q4 Total</p>
                <h4 className="text-xl font-bold text-white leading-none">SAR {accountingTotals.vatLiability.toLocaleString()}</h4>
              </div>
              <div className="pt-6">
                 <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest border-t border-white/10 pt-4">Consolidated Audit {selectedYear}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-medium text-slate-900 uppercase tracking-widest text-xs">Fiscal Ledger: {selectedYear}</h4>
          <span className="text-[10px] font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
            {filteredProjects.length} PROJECTS IN CYCLE
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-normal border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Project identifier</th>
                <th className="px-8 py-6">Base (SAR)</th>
                <th className="px-8 py-6">VAT (15%)</th>
                <th className="px-8 py-6">Cycle Total</th>
                <th className="px-8 py-6">Realized</th>
                <th className="px-8 py-6 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center font-normal">
                    <p className="text-sm font-normal text-slate-300 uppercase tracking-widest italic">Registry clear for FY {selectedYear}.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const vat = Number(proj.value) * Number(proj.taxRate || 0.15);
                  const totalPayable = Number(proj.value) + vat;
                  const collected = proj.payments.reduce((sum: number, p) => sum + Number(p.amount), 0);
                  const outstanding = totalPayable - collected;
                  const collectionPercent = (collected / totalPayable) * 100;

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-medium text-slate-900 text-sm group-hover:text-slate-700 transition-colors break-words whitespace-pre-wrap">{proj.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal tracking-tight uppercase break-words">{getClientName(proj.clientId)}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-normal text-slate-600 text-sm italic">SAR {proj.value.toLocaleString()}</td>
                      <td className="px-8 py-6 font-medium text-xs" style={{ color: manifest.global.primaryColor }}>SAR {vat.toLocaleString()}</td>
                      <td className="px-8 py-6 font-medium text-slate-900 text-sm">SAR {totalPayable.toLocaleString()}</td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="font-medium text-sm" style={{ color: manifest.global.primaryColor }}>SAR {collected.toLocaleString()}</p>
                          <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                             <div className="h-full" style={{ width: `${collectionPercent}%`, backgroundColor: manifest.global.primaryColor }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`font-medium text-sm ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {outstanding <= 0 ? 'AUDIT CLEARED' : `SAR ${outstanding.toLocaleString()}`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialPipeline;
