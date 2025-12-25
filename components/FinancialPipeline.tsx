
import React, { useMemo } from 'react';
import { Project, Customer, SystemManifest } from '../types';

interface FinancialPipelineProps {
  projects: Project[];
  customers: Customer[];
  manifest: SystemManifest;
}

const FinancialPipeline: React.FC<FinancialPipelineProps> = ({ projects, customers, manifest }) => {
  const getClientName = (id: string) => customers.find(c => c.id === id)?.company || 'Unknown Client';

  const accountingTotals = useMemo(() => {
    return projects.reduce((acc, proj) => {
      const vat = proj.value * proj.taxRate;
      const totalPayable = proj.value + vat;
      const collected = proj.payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = totalPayable - collected;
      
      return {
        dealValue: acc.dealValue + proj.value,
        vatLiability: acc.vatLiability + vat,
        collected: acc.collected + collected,
        outstanding: acc.outstanding + outstanding,
      };
    }, { dealValue: 0, vatLiability: 0, collected: 0, outstanding: 0 });
  }, [projects]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans font-normal">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Financial Pipeline</h2>
        <p className="text-slate-500 font-normal">Consolidated accounting based on project lifecycles and audited payments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[10px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Total Receivables</p>
          <h3 className="text-2xl font-medium text-slate-900">SAR {(accountingTotals.dealValue + accountingTotals.vatLiability).toLocaleString()}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-normal">Incl. 15% VAT: SAR {accountingTotals.vatLiability.toLocaleString()}</p>
        </div>
        <div 
          className="p-6 rounded-[10px] border shadow-sm"
          style={{ backgroundColor: manifest.global.primaryColor + '10', borderColor: manifest.global.primaryColor + '20' }}
        >
          <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: manifest.global.primaryColor }}>Total Collected</p>
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
          <p className="text-[10px] font-medium text-rose-600 uppercase tracking-widest mb-2">Outstanding Balance</p>
          <h3 className="text-2xl font-medium text-rose-600">SAR {accountingTotals.outstanding.toLocaleString()}</h3>
          <p className="text-[10px] text-rose-400 mt-2 font-normal">Realizable revenue</p>
        </div>
        <div className="bg-[#262626] p-6 rounded-[10px] shadow-xl">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2">VAT Provision</p>
          <h3 className="text-2xl font-medium text-white">SAR {accountingTotals.vatLiability.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-500 mt-2 font-normal">SAR {accountingTotals.vatLiability.toLocaleString()} Due</p>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-medium text-slate-900 uppercase tracking-widest text-xs">Project Receivables Ledger</h4>
          <span className="text-[10px] font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
            {projects.length} ACTIVE PROJECTS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-normal">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Project / Client</th>
                <th className="px-8 py-6">Base Value</th>
                <th className="px-8 py-6">VAT (15%)</th>
                <th className="px-8 py-6">Total Payable</th>
                <th className="px-8 py-6">Collected</th>
                <th className="px-8 py-6 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center font-normal">
                    <p className="text-sm font-normal text-slate-300 uppercase tracking-widest italic">No financial data found in project pipeline</p>
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const vat = proj.value * proj.taxRate;
                  const totalPayable = proj.value + vat;
                  const collected = proj.payments.reduce((sum, p) => sum + p.amount, 0);
                  const outstanding = totalPayable - collected;
                  const collectionPercent = (collected / totalPayable) * 100;

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-medium text-slate-900 text-sm group-hover:text-slate-700 transition-colors">{proj.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal tracking-tight uppercase">{getClientName(proj.clientId)}</p>
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
                          {outstanding <= 0 ? 'CLEARED' : `SAR ${outstanding.toLocaleString()}`}
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
