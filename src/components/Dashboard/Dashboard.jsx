import React from 'react';
import { LayoutDashboard, TrendingUp, AlertCircle, DollarSign, PlusCircle, ArrowUpRight } from 'lucide-react';
import { StatCard } from '../Common';
import { formatCurrency } from '../../utils/format';
import { ProjectTable } from './ProjectTable';
import { ROLE_THEME } from '../../constants/projectConstants';

const ROLE_GREETINGS = {
    Employee: { label: 'Your Submissions', sub: 'Track and manage your project pipeline' },
    Manager: { label: 'Review Hub', sub: 'Pending approvals and team initiatives' },
    Admin: { label: 'Executive Overview', sub: 'Full portfolio governance and compliance' },
};

const VIEW_CONTEXT = {
    review: {
        label: 'Review Queue',
        sub: (count) => `${count} initiative${count !== 1 ? 's' : ''} awaiting your baseline approval`,
    },
    closure: {
        label: 'Active Closure',
        sub: (count) => `${count} project${count !== 1 ? 's' : ''} targeting execution completion`,
    },
};

export function Dashboard({ user, stats, projects, onSelectProject, onEditProject, onCardClick, onSelectionChange, selectedIds, setView, viewContext }) {
    const theme = ROLE_THEME[user?.role] || ROLE_THEME['Employee'];
    const ctx = VIEW_CONTEXT[viewContext] || ROLE_GREETINGS[user?.role] || ROLE_GREETINGS['Employee'];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const isSubView = Boolean(viewContext);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    {!isSubView && (
                        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: theme.accent }}>
                            {greeting}, {user?.name?.split(' ')[0]}
                        </p>
                    )}
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        {isSubView ? ctx.label : ctx.label}
                    </h1>
                    <p className="text-sm text-slate-400 font-medium mt-1.5">
                        {typeof ctx.sub === 'function' ? ctx.sub(projects.length) : ctx.sub}
                    </p>
                </div>
                </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    title="Total Initiatives"
                    value={stats.total}
                    icon={<LayoutDashboard size={20} />}
                    theme={theme}
                    color="default"
                    onClick={() => onCardClick?.('dashboard')}
                />
                <StatCard
                    title="Active Projects"
                    value={stats.active}
                    icon={<TrendingUp size={20} />}
                    theme={theme}
                    color="emerald"
                    onClick={() => onCardClick?.('closure')}
                />
                <StatCard
                    title="Needs Review"
                    value={stats.pending}
                    icon={<AlertCircle size={20} />}
                    highlight={stats.pending > 0}
                    theme={theme}
                    color="amber"
                    onClick={() => onCardClick?.('review')}
                />
                <StatCard
                    title="Realized ROI"
                    value={formatCurrency(stats.roi)}
                    icon={<DollarSign size={20} />}
                    theme={theme}
                    color="accent"
                />
            </div>

            <ProjectTable 
                projects={projects} 
                onSelectProject={onSelectProject} 
                onEditProject={onEditProject}
                onSelectionChange={onSelectionChange}
                selectedIds={selectedIds}
                theme={theme} 
                currentUser={user}
            />
        </div>
    );
}
