
import React, { useMemo } from 'react';
import { Customer, Ticket, TicketStatus, Project, SystemManifest, AuditLog } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

interface DashboardProps {
  customers: Customer[];
  tickets: Ticket[];
  projects: Project[];
  manifest: SystemManifest;
  auditLogs: AuditLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ customers, tickets, projects, manifest, auditLogs }) => {
  const stats = useMemo(() => {
    const totalPipelineValue = projects.reduce((acc, p) => acc + p.value, 0);
    const totalVat = totalPipelineValue * 0.15;
    const totalRevenue = totalPipelineValue + totalVat;
    
    const totalCollected = projects.reduce((acc, p) => 
      acc + p.payments.reduce((sum, pay) => sum + pay.amount, 0), 0);
    
    const openTickets = tickets.filter(t => t.status !== TicketStatus.CLOSED && t.status !== TicketStatus.RESOLVED).length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    
    return [
      { 
        label: manifest.dashboard.stat1, 
        value: `${manifest.global.currency} ${totalPipelineValue.toLocaleString()}`, 
        sub: `Authorized Baseline`,
        icon: <SARIcon /> 
      },
      { 
        label: manifest.dashboard.stat2, 
        value: `${manifest.global.currency} ${totalCollected.toLocaleString()}`, 
        sub: `${((totalCollected / totalRevenue) * 100 || 0).toFixed(1)}% Realized`,
        icon: <TrendUpIcon /> 
      },
      { 
        label: manifest.dashboard.stat3, 
        value: `${openTickets} Nodes`, 
        sub: `Active Load`,
        icon: <TicketIcon /> 
      },
      { 
        label: manifest.dashboard.stat4, 
        value: `${activeProjects} Units`, 
        sub: `Operational`,
        icon: <PulseIcon /> 
      },
    ];
  }, [tickets, projects, manifest]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    // Financial Growth (Mocking some temporal data based on existing project creation or current month)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    const trendData = monthNames.slice(0, currentMonthIdx + 1).map((m, i) => {
      const monthProj = projects.filter(p => new Date(p.createdAt).getMonth() === i);
      const value = monthProj.reduce((acc, p) => acc + p.value, 0) || Math.random() * 20000; // random for visualization if empty
      return { name: m, value: Math.floor(value) };
    });

    // Support Load Pie
    const ticketCounts = [
      { name: 'Open', value: tickets.filter(t => t.status === TicketStatus.OPEN).length, color: '#10b981' },
      { name: 'Pending', value: tickets.filter(t => t.status === TicketStatus.PENDING).length, color: '#f59e0b' },
      { name: 'Active', value: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length, color: manifest.global.primaryColor },
      { name: 'Closed', value: tickets.filter(t => t.status === TicketStatus.CLOSED || t.status === TicketStatus.RESOLVED).length, color: '#94a3b8' },
    ].filter(d => d.value > 0);

    // Project Health Bar
    const projectHealth = [
      { name: 'Planning', count: projects.filter(p => p.status === 'PLANNING').length },
      { name: 'Active', count: projects.filter(p => p.status === 'ACTIVE').length },
      { name: 'On Hold', count: projects.filter(p => p.status === 'ON_HOLD').length },
      { name: 'Done', count: projects.filter(p => p.status === 'COMPLETED').length },
    ];

    return { trendData, ticketCounts, projectHealth };
  }, [projects, tickets, manifest.global.primaryColor]);

  const recentAudits = useMemo(() => auditLogs.slice(0, 5), [auditLogs]);

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-medium text-slate-900 tracking-tight">{manifest.dashboard.title}</h2>
        <p className="text-slate-500 font-normal">{manifest.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[20px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-[12px] group-hover:scale-110 transition-transform" style={{ backgroundColor: manifest.global.primaryColor + '15', color: manifest.global.primaryColor }}>
                {stat.icon}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest break-words">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 break-words leading-tight">{stat.value}</h3>
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: manifest.global.primaryColor }}></span>
               <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: manifest.global.primaryColor }}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Revenue Area Chart */}
          <div className="bg-white p-8 rounded-[25px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[450px]">
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Financial Performance</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-medium mt-1">Authorized Revenue Distribution (Current Year)</p>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-bold text-emerald-700 uppercase">Live Registry</span>
               </div>
            </div>
            <div className="flex-1 -ml-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trendData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={manifest.global.primaryColor} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={manifest.global.primaryColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={manifest.global.primaryColor} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Infrastructure Summary */}
             <div className="bg-white p-8 rounded-[25px] border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Unit Distribution</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.projectHealth}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#cbd5e1' }} />
                         <YAxis hide />
                         <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                         <Bar dataKey="count" fill={manifest.global.primaryColor} radius={[6, 6, 0, 0]} barSize={32} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total provisioned: {projects.length}</p>
                   <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">Audit Registry</button>
                </div>
             </div>

             {/* Support Pie Chart */}
             <div className="bg-white p-8 rounded-[25px] border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Support Registry Load</h3>
                <div className="flex-1 flex items-center justify-center">
                   <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                         <Pie
                           data={chartData.ticketCounts}
                           innerRadius={60}
                           outerRadius={85}
                           paddingAngle={5}
                           dataKey="value"
                         >
                           {chartData.ticketCounts.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   {chartData.ticketCounts.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                         <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{item.name}: {item.value}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8 h-full">
           {/* Recent Activity Feed */}
           <div className="bg-[#262626] p-8 rounded-[30px] shadow-2xl text-white flex flex-col h-full border border-white/5">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                 <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Protocol Registry</h3>
                 <div className="p-2 bg-white/5 rounded-full text-white/40"><AuditIconSmall /></div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                 {recentAudits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                       <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center"><LoadingPulse /></div>
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Listening for signals...</p>
                    </div>
                 ) : (
                    recentAudits.map((log, i) => (
                       <div key={i} className="flex gap-4 group animate-in slide-in-from-right duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex flex-col items-center shrink-0">
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                             <div className="flex-1 w-px bg-white/10 my-2"></div>
                          </div>
                          <div className="flex-1 pb-4 min-w-0">
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{new Date(log.action_datetime).toLocaleTimeString()}</p>
                             <p className="text-sm font-medium text-slate-100 break-words line-clamp-2 leading-relaxed">
                                {log.user_name} <span className="text-slate-400 font-normal">synchronized infrastructure manifests.</span>
                             </p>
                             <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest cursor-pointer hover:underline">Inspect Node</span>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-6">
                 <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 mb-2">Encryption Engine</h4>
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-emerald-500"></div>
                       <p className="text-2xl font-light tracking-tighter">256-AES <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest ml-2">Active</span></p>
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-400 leading-relaxed font-normal opacity-60">SX MGMT nodes are synchronized via secured regional relay clusters.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Quick Registry Table - Infrastructure Detail */}
      <div className="bg-white rounded-[25px] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
               <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Active Operational Units</h3>
               <p className="text-[10px] text-slate-400 uppercase font-medium mt-1">Infrastructure lifecycle nodes currently under management</p>
            </div>
            <div className="flex gap-2">
               <div className="px-4 py-2 bg-white rounded-[10px] border border-slate-200 text-[10px] font-bold uppercase text-slate-500">Nodes: {projects.length}</div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <tr>
                     <th className="px-8 py-5">Unit Identifier</th>
                     <th className="px-8 py-5">Lifecycle State</th>
                     <th className="px-8 py-5">Contract Logic</th>
                     <th className="px-8 py-5">Realization</th>
                     <th className="px-8 py-5 text-right">Navigation</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {projects.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-300 italic font-normal uppercase tracking-widest text-sm">No units provisioned.</td>
                     </tr>
                  ) : (
                     projects.slice(0, 5).map(p => {
                        const collected = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
                        const progress = (collected / (p.value * 1.15)) * 100;
                        return (
                           <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[12px] bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all" style={{ color: manifest.global.primaryColor }}>{p.name.charAt(0)}</div>
                                    <div className="min-w-0">
                                       <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{p.name}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.id}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border" style={{ backgroundColor: manifest.global.primaryColor + '10', color: manifest.global.primaryColor, borderColor: manifest.global.primaryColor + '20' }}>{p.status}</span>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-sm font-bold text-slate-900 leading-none">SAR {p.value.toLocaleString()}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Incl. 15% VAT Liability</p>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="flex-1 w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                       <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: manifest.global.primaryColor }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">{progress.toFixed(0)}%</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <button className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Enter Hub <ArrowRightIconSmall /></button>
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

// Internal Micro Icons
const SARIcon = () => <span className="text-[10px] font-bold tracking-tighter">SAR</span>;
const TrendUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const PulseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const AuditIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ArrowRightIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;

const LoadingPulse = () => (
   <div className="relative flex h-3 w-3">
     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-20"></span>
     <span className="relative inline-flex rounded-full h-3 w-3 bg-white/20"></span>
   </div>
);

export default Dashboard;
