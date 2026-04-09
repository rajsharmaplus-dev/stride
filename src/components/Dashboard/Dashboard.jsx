import React from 'react';
import { LayoutDashboard, TrendingUp, AlertCircle, DollarSign, PlusCircle, ArrowUpRight, Layout, ClipboardCheck, Target, ChevronRight } from 'lucide-react';
import { StatCard, StatusBadge } from '../Common';
import { formatCurrency } from '../../utils/format';
import { ProjectTable } from './ProjectTable';
import { ROLE_THEME } from '../../constants/projectConstants';

const ROLE_GREETINGS = {
    Employee: { segment: '01', label: 'PORTFOLIO OVERVIEW', sub: 'Track and manage your project pipeline', watermark: Layout },
    Manager: { segment: '01', label: 'PORTFOLIO OVERVIEW', sub: 'Team initiatives and portfolio health', watermark: Layout },
    Admin: { segment: '01', label: 'PORTFOLIO OVERVIEW', sub: 'Enterprise-wide initiative landscape', watermark: Layout },
};

const VIEW_CONTEXT = {
    review: {
        segment: '02',
        label: 'REVIEW PIPELINE',
        sub: (count) => `${count} initiative${count !== 1 ? 's' : ''} awaiting your baseline approval`,
        watermark: ClipboardCheck
    },
    closure: {
        segment: '03',
        label: 'EXECUTION PIPELINE',
        sub: (count) => `${count} active project${count !== 1 ? 's' : ''} in execution`,
        watermark: Target
    },
};

export function Dashboard({ user, stats, projects, totalCount, onLoadMore, onSelectProject, onEditProject, onCardClick, onSelectionChange, selectedIds, setView, viewContext }) {
    const theme = ROLE_THEME[user?.role] || ROLE_THEME['Employee'];
    const ctx = VIEW_CONTEXT[viewContext] || ROLE_GREETINGS[user?.role] || ROLE_GREETINGS['Employee'];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const isSubView = Boolean(viewContext);
    const WatermarkIcon = ctx.watermark;

    const [previewProject, setPreviewProject] = React.useState(null);

    // Auto-select first project for Master-Detail if in Review
    React.useEffect(() => {
        if (viewContext === 'review' && projects?.length > 0 && !previewProject) {
            setPreviewProject(projects[0]);
        }
    }, [viewContext, projects, previewProject]);

    const isSplitView = viewContext === 'review';
    const isClosureView = viewContext === 'closure';

    return (
        <div className="space-y-6 animate-fade-in pr-2 relative overflow-hidden font-sans pt-2 border-t border-slate-100/50">
            {/* Context Watermark */}
            {WatermarkIcon && (
                <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] select-none pointer-events-none">
                    <WatermarkIcon size={240} strokeWidth={1} />
                </div>
            )}

            <div className="flex justify-between items-start md:items-end gap-4 relative z-10 border-b border-slate-100 pb-6">
                <div className="space-y-3">
                    {!isSubView && (
                        <div className="flex items-center gap-2">
                             <div className="w-1 h-3 bg-[#F05A28]/30 rounded-full" />
                             <p className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-500">
                                {greeting}, {user?.name?.split(' ')[0]}
                             </p>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-black text-[#F05A28] italic opacity-20 font-display select-none leading-none">{ctx.segment}</span>
                        <div className="w-1 h-8 bg-[#F05A28] rounded-full" />
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none font-display uppercase">
                            {ctx.label}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-md">
                            {ctx.segment}
                        </div>
                        <p className="text-[14px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                            {typeof ctx?.sub === 'function' ? ctx.sub(projects?.length || 0) : (ctx?.sub || '—')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {(!isSplitView && !isClosureView) ? (
                /* 01 - Portfolio Grid */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Initiatives"
                            value={stats?.total || 0}
                            trend="+4% vs last mo"
                            icon={<LayoutDashboard size={20} />}
                            theme={theme}
                            color="default"
                            onClick={() => onCardClick?.('dashboard')}
                        />
                        <StatCard
                            title="Active Projects"
                            value={stats?.active || 0}
                            trend="+12%"
                            icon={<TrendingUp size={20} />}
                            theme={theme}
                            color="emerald"
                            onClick={() => onCardClick?.('closure')}
                        />
                        <StatCard
                            title="Needs Review"
                            value={stats?.pending || 0}
                            trend={(stats?.pending || 0) > 0 ? `${stats.pending} action items` : 'Clean slate'}
                            icon={<AlertCircle size={20} />}
                            highlight={(stats?.pending || 0) > 0}
                            theme={theme}
                            color="amber"
                            onClick={() => onCardClick?.('review')}
                        />
                        <StatCard
                            title="Realized ROI"
                            value={formatCurrency(stats?.roi)}
                            trend="+24% YoY"
                            icon={<DollarSign size={20} />}
                            theme={theme}
                            color="accent"
                        />
                    </div>
                    <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 scrollbar-none">
                        <ProjectTable 
                            projects={projects} totalCount={totalCount} onLoadMore={onLoadMore}
                            onSelectProject={onSelectProject} onEditProject={onEditProject}
                            onSelectionChange={onSelectionChange} selectedIds={selectedIds}
                            theme={theme} currentUser={user}
                        />
                    </div>
                </div>
            ) : isSplitView ? (
                /* 02 - Review Master-Detail */
                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:h-[calc(100vh-280px)] relative z-10 transition-all duration-500">
                    {/* Master: List */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-[13px] font-black uppercase tracking-widest text-slate-500">Review Pipeline</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-px custom-scrollbar p-1">
                            {projects.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setPreviewProject(p)}
                                    className={`w-full text-left p-4 transition-all relative group rounded-xl ${previewProject?.id === p.id ? 'bg-[#F05A28]/5' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="space-y-1">
                                        <p className={`text-[15px] font-bold tracking-tight ${previewProject?.id === p.id ? 'text-[#F05A28]' : 'text-slate-700'}`}>
                                            {p.title}
                                        </p>
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                                            <span>{p.process}</span>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-slate-600">{formatCurrency(p.estimatedBenefit)}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-all ${previewProject?.id === p.id ? 'translate-x-1 text-[#F05A28]' : 'group-hover:translate-x-1'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Detail: Preview */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                        {previewProject ? (
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                                <div className="space-y-4">
                                    <StatusBadge status={previewProject.status} />
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter font-display leading-tight">{previewProject.title}</h2>
                                    <div className="flex flex-wrap gap-6 py-6 border-y border-slate-100">
                                        <div className="min-w-[120px]">
                                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-1">Process Area</p>
                                            <p className="text-[14px] font-bold text-slate-800">{previewProject.process}</p>
                                        </div>
                                        <div className="min-w-[120px]">
                                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-1">Strategic Goal</p>
                                            <p className="text-[14px] font-bold text-slate-800">{previewProject.strategicGoal || '—'}</p>
                                        </div>
                                        <div className="min-w-[120px]">
                                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated ROI</p>
                                            <p className="text-[14px] font-bold text-emerald-600">{formatCurrency(previewProject.estimatedBenefit)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Executive Summary</p>
                                    <p className="text-slate-600 leading-relaxed text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                                        "{previewProject.description || 'No description provided.'}"
                                    </p>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button 
                                        onClick={() => onSelectProject(previewProject)}
                                        className="btn-primary !px-8 !py-3 !text-xs"
                                    >
                                        Proceed to Full Review
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12">
                                < ClipboardCheck size={48} strokeWidth={1} className="mb-4 opacity-20" />
                                <p className="text-[13px] font-black uppercase tracking-widest">Select an initiative to begin</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* 03 - Execution Closure (Compact Timeline) */
                <div className="space-y-3 relative z-10">
                    {projects.map((p, idx) => (
                        <div key={p.id} className="group relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 bg-white border border-slate-100 hover:border-[#F05A28]/30 transition-all hover:shadow-md rounded-xl">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#F05A28] transition-colors border border-slate-100 flex-shrink-0">
                                 <Target size={18} />
                             </div>

                             <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 sm:gap-6">
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-bold text-slate-900 tracking-tight truncate group-hover:text-[#F05A28] transition-colors">
                                        {p.title}
                                    </h3>
                                    <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest">
                                        {p.process} <span className="mx-1 opacity-30">•</span> {p.submitterName}
                                    </p>
                                </div>

                                <div className="sm:text-center md:text-left">
                                    <StatusBadge status={p.status} />
                                </div>

                                <div className="hidden md:block">
                                    <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Target Value</p>
                                    <p className="text-[15px] font-black text-slate-900 tracking-tight">{formatCurrency(p.estimatedBenefit)}</p>
                                </div>

                                <div className="text-right">
                                    <button 
                                        onClick={() => onSelectProject(p)}
                                        className="btn-secondary hover:!bg-slate-900 hover:!text-white hover:!border-slate-900 w-full sm:w-auto"
                                    >
                                        Manage
                                        <ChevronRight size={12} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                             <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/50 mb-6 group-hover:scale-110 transition-transform">
                                <Target size={48} strokeWidth={1} className="text-[#F05A28]" />
                             </div>
                             <div className="text-center space-y-2 mb-8">
                                <p className="text-[15px] font-black uppercase tracking-widest text-slate-900">Precision Pipeline is Empty</p>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No active initiatives in execution state.<br/>Begin a new strategic motion now.</p>
                             </div>
                             {(!viewContext || viewContext === 'closure') && (
                                <button
                                    onClick={() => setView?.('submit')}
                                    className="btn-primary !px-8 !py-4 !text-[11px] !rounded-2xl shadow-xl shadow-[#F05A28]/20"
                                >
                                    <PlusCircle size={16} />
                                    Launch New Initiative
                                </button>
                             )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
