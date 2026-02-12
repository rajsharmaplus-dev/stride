import React from 'react';
import { LayoutDashboard, TrendingUp, AlertCircle, DollarSign, PlusCircle } from 'lucide-react';
import { StatCard, formatCurrency } from '../Common';
import { ProjectTable } from './ProjectTable';

export function Dashboard({ user, stats, projects, onSelectProject, setView }) {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Initiative Overview</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-slate-500 font-medium">Monitoring portfolio for </span>
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-md text-xs font-black uppercase tracking-widest">{user.name}</span>
                    </div>
                </div>
                <button
                    onClick={() => setView('submit')}
                    className="btn-primary flex items-center gap-2"
                >
                    <PlusCircle size={20} />
                    <span>Launch New Initiative</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Initiatives"
                    value={stats.total}
                    icon={<LayoutDashboard size={20} />}
                />
                <StatCard
                    title="Active Projects"
                    value={stats.active}
                    icon={<TrendingUp size={20} />}
                />
                <StatCard
                    title="Needs Review"
                    value={stats.pending}
                    icon={<AlertCircle size={20} />}
                    highlight={stats.pending > 0}
                />
                <StatCard
                    title="Realized ROI"
                    value={formatCurrency(stats.roi)}
                    icon={<DollarSign size={20} />}
                />
            </div>

            <ProjectTable
                projects={projects}
                onSelectProject={onSelectProject}
            />
        </div>
    );
}
