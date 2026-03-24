import React from 'react';
import {
    ShieldCheck,
    History,
    FileCheck,
    AlertCircle,
    CheckCircle2,
    Users,
    ArrowRight,
    Search
} from 'lucide-react';
import { StatusBadge } from '../Common';

export function Governance({ projects, onSelectProject }) {
    // Generate some mock audit events based on projects
    const auditEvents = (projects || []).flatMap(p => {
        // Safely find a user name from history or use a fallback
        const submitterName = p?.history?.find(h => h.action === 'Submitted')?.user || 'Alex Submitter';

        const events = [
            {
                id: `sub-${p?.id || Math.random()}`,
                type: 'Submission',
                project: p?.title || 'Untitled Initiative',
                user: submitterName,
                date: p?.createdAt || '2026-02-10',
                status: 'COMPLETED',
                detail: 'Initial baseline submitted'
            }
        ];
        if (p?.status === 'ACTIVE' || p?.status === 'CLOSED') {
            events.push({
                id: `app-${p?.id || Math.random()}`,
                type: 'Approval',
                project: p?.title || 'Untitled Initiative',
                user: 'Sarah Manager',
                date: '2026-02-11',
                status: 'COMPLETED',
                detail: 'Strategic alignment verified'
            });
        }
        return events;
    }).sort((a, b) => (b?.id || '').localeCompare(a?.id || ''));

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Governance Control</h1>
                    </div>
                    <p className="text-slate-500 font-medium tracking-tight">System-wide audit trail and portfolio compliance monitoring.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search audit logs..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all w-64"
                        />
                    </div>
                    <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                        Export Report
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={<FileCheck className="text-emerald-500" />}
                    label="Compliance Rate"
                    value="98.2%"
                    trend="+2.1%"
                />
                <StatCard
                    icon={<History className="text-blue-500" />}
                    label="Audit Events"
                    value={auditEvents.length}
                    trend="Last 30 days"
                />
                <StatCard
                    icon={<Users className="text-purple-500" />}
                    label="Active Reviewers"
                    value="12"
                    trend="Across 4 Depts"
                />
                <StatCard
                    icon={<AlertCircle className="text-amber-500" />}
                    label="Policy Breaches"
                    value="0"
                    trend="All clear"
                />
            </div>

            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                        <History size={16} className="text-primary-500" />
                        System Audit Trail
                    </h3>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500">ALL EVENTS</span>
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500">CRITICAL ONLY</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Type</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiative</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actioned By</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {auditEvents.map(event => (
                                <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${event.type === 'Approval' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {event.type === 'Approval' ? <CheckCircle2 size={14} /> : <History size={14} />}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{event.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{event.project}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                {event.user?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">{event.user || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{event.date}</td>
                                    <td className="px-8 py-5">
                                        <StatusBadge status={event.status} />
                                    </td>
                                    <td className="px-8 py-5">
                                        <button 
                                            onClick={() => {
                                                const project = projects.find(p => p.title === event.project);
                                                if (project) onSelectProject(project);
                                            }}
                                            className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-primary-600 transition-all group-hover:translate-x-1"
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {auditEvents.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <History size={32} />
                        </div>
                        <p className="text-slate-400 font-medium">No audit events recorded yet.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

function StatCard({ icon, label, value, trend }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {trend}
                </span>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
}
