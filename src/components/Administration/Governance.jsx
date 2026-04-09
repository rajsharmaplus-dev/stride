import React from 'react';
import { Search, FileCheck, History, Users, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export function Governance({ projects, onSelectProject }) {
    const auditEvents = (projects || []).flatMap(p => {
        const history = Array.isArray(p.history) ? p.history : [];
        return history.map(h => ({
            id: `${p.id}-${h.id || Math.random()}`,
            type: h.action,
            project: p.title,
            user: h.user,
            date: h.date,
            status: 'COMPLETED',
            detail: h.note || 'No additional details'
        }));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-8 animate-fade-in pb-20 font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#F05A28]/30 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Governance Portal</p>
                    </div>
                    <div className="flex items-center gap-4">
                         <span className="text-4xl font-black text-[#F05A28] italic opacity-20 font-display select-none leading-none">04</span>
                         <div className="w-1 h-8 bg-[#F05A28] rounded-full" />
                         <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none font-display uppercase">Audit Control</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Find record..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#F05A28]/20 focus:bg-white transition-all w-48 font-bold placeholder:font-medium shadow-sm"
                        />
                    </div>
                    <button className="bg-[#F05A28] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#D94E1F] transition-all active:scale-95 shadow-lg shadow-[#F05A28]/20">
                        Export Report
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GovStat icon={<FileCheck size={18} className="text-emerald-500" />} label="Compliance" value="98.2%" status="On Track" />
                <GovStat icon={<History size={18} className="text-[#F05A28]" />} label="Events" value={auditEvents.length} status="30d Window" />
                <GovStat icon={<Users size={18} className="text-slate-900" />} label="Reviewers" value="12" status="+2 YoY" />
                <GovStat icon={<AlertCircle size={18} className="text-amber-500" />} label="Breaches" value="0" status="Perfect" />
            </div>

            <section className="gl-card overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-[9px] flex items-center gap-2">
                        <History size={14} className="text-[#F05A28]" />
                        System Audit Trail
                    </h3>
                    <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-white border border-slate-100 rounded text-[8px] font-black text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">ALL LOGS</span>
                        <span className="px-2 py-0.5 bg-white border border-slate-100 rounded text-[8px] font-black text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">SECURITY</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20">
                                <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Reference</th>
                                <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                                <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {auditEvents.map(event => (
                                <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.type === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'}`}>
                                                {event.type === 'Approved' ? <CheckCircle2 size={14} /> : <History size={14} />}
                                            </div>
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{event.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-600">{event.project}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                                {event.user?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{event.user || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-400 tabular-nums">{event.date}</td>
                                    <td className="px-8 py-4 text-right">
                                        <button 
                                            onClick={() => {
                                                const project = projects.find(p => p.title === event.project);
                                                if (project) onSelectProject(project);
                                            }}
                                            className="p-1.5 hover:bg-white hover:shadow-md rounded-lg text-slate-300 hover:text-[#F05A28] transition-all group-hover:translate-x-1"
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {auditEvents.length === 0 && (
                    <div className="p-16 text-center">
                        <History size={32} className="mx-auto mb-3 text-slate-200 opacity-20" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No signals detected</p>
                    </div>
                )}
            </section>
        </div>
    );
}

function GovStat({ icon, label, value, status }) {
    return (
        <div className="gl-card p-5 group hover:border-[#F05A28]/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-50 rounded-xl group-hover:rotate-12 transition-transform">{icon}</div>
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">{status}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums leading-none mb-1">{value}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
    );
}
