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
        label: 'EXECUTION CLOSURE',
        sub: (count) => `${count} project${count !== 1 ? 's' : ''} targeting final completion`,
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
        <div className="space-y-12 animate-fade-in pr-6 relative overflow-hidden font-sans">
            {/* Context Watermark */}
            {WatermarkIcon && (
                <div className="absolute top-[-40px] right-[-40px] opacity-[0.08] select-none pointer-events-none">
                    <WatermarkIcon size={320} strokeWidth={1} />
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 border-b border-slate-100 pb-12">
                <div className="space-y-5">
                    {!isSubView && (
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 font-sans">
                           {greeting}, {user?.name?.split(' ')[0]}
                        </p>
                    )}
                    <div className="flex items-center gap-5">
                        <span className="text-6xl font-black text-[#FF5F2D] italic opacity-10 font-display select-none">{ctx.segment}</span>
                        <div className="w-1.5 h-12 bg-[#FF5F2D] rounded-full" />
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none font-display">
                            {ctx.label}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                            {ctx.segment} Context
                        </div>
                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.25em] font-sans">
                            {typeof ctx?.sub === 'function' ? ctx.sub(projects?.length || 0) : (ctx?.sub || '—')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {(!isSplitView && !isClosureView) ? (
                /* 01 - Portfolio Grid */
                <div className="space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <StatCard
                            title="Total Initiatives"
                            value={stats?.total || 0}
                            icon={<LayoutDashboard size={20} />}
                            theme={theme}
                            color="default"
                            onClick={() => onCardClick?.('dashboard')}
                        />
                        <StatCard
                            title="Active Projects"
                            value={stats?.active || 0}
                            icon={<TrendingUp size={20} />}
                            theme={theme}
                            color="emerald"
                            onClick={() => onCardClick?.('closure')}
                        />
                        <StatCard
                            title="Needs Review"
                            value={stats?.pending || 0}
                            icon={<AlertCircle size={20} />}
                            highlight={(stats?.pending || 0) > 0}
                            theme={theme}
                            color="amber"
                            onClick={() => onCardClick?.('review')}
                        />
                        <StatCard
                            title="Realized ROI"
                            value={formatCurrency(stats?.roi)}
                            icon={<DollarSign size={20} />}
                            theme={theme}
                            color="accent"
                        />
                    </div>
                    <ProjectTable 
                        projects={projects} totalCount={totalCount} onLoadMore={onLoadMore}
                        onSelectProject={onSelectProject} onEditProject={onEditProject}
                        onSelectionChange={onSelectionChange} selectedIds={selectedIds}
                        theme={theme} currentUser={user}
                    />
                </div>
            ) : isSplitView ? (
                /* 02 - Review Master-Detail (Implemented previously) */
                <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 h-[calc(100vh-320px)] relative z-10 transition-all duration-500">
                    {/* Master: List */}
                    <div className="bg-white border border-slate-100 rounded-none shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Approvals</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-px custom-scrollbar">
                            {projects.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setPreviewProject(p)}
                                    className={`w-full text-left p-5 transition-all relative group border-b border-slate-50 ${previewProject?.id === p.id ? 'bg-[#FF5F2D]/5' : 'hover:bg-slate-50'}`}
                                >
                                    {previewProject?.id === p.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5F2D]" />
                                    )}
                                    <div className="space-y-1">
                                        <p className={`text-sm font-black tracking-tight ${previewProject?.id === p.id ? 'text-black' : 'text-slate-700'}`}>
                                            {p.title}
                                        </p>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <span>{p.process}</span>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span>{formatCurrency(p.estimatedBenefit)}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-all ${previewProject?.id === p.id ? 'translate-x-1 text-[#FF5F2D]' : 'group-hover:translate-x-1'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Detail: Preview */}
                    <div className="bg-white border border-slate-100 rounded-none shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                        {previewProject ? (
                            <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                                <div className="space-y-4">
                                    <StatusBadge status={previewProject.status} />
                                    <h2 className="text-4xl font-black text-black tracking-tighter font-display leading-tight">{previewProject.title}</h2>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Process</p>
                                            <p className="text-sm font-bold text-slate-900">{previewProject.process}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target ROI</p>
                                            <p className="text-sm font-bold text-slate-900">{formatCurrency(previewProject.estimatedBenefit)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Business Context</p>
                                    <p className="text-slate-600 leading-relaxed text-sm">{previewProject.description || 'No description provided.'}</p>
                                </div>
                                <div className="pt-6 border-t border-slate-100 flex gap-4">
                                    <button 
                                        onClick={() => onSelectProject(previewProject)}
                                        className="px-8 py-4 bg-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Open Full Review
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12">
                                < ClipboardCheck size={64} strokeWidth={1} className="mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Select an initiative to begin review</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* 03 - Execution Closure (Linear Timeline View) */
                <div className="space-y-6 relative z-10">
                    {projects.map((p, idx) => (
                        <div key={p.id} className="group relative flex items-center gap-12 p-8 bg-white border border-slate-100 hover:border-[#FF5F2D]/30 transition-all hover:shadow-xl rounded-none">
                             {/* Progressive Timeline Marker */}
                             <div className="flex flex-col items-center">
                                <div className="text-[11px] font-black text-slate-400 mb-2 font-display">{idx + 1}</div>
                                <div className="w-px h-12 bg-slate-100" />
                                <div className="w-12 h-12 rounded-full border-2 border-slate-100 bg-white flex items-center justify-center text-[#FF5F2D] group-hover:border-[#FF5F2D] transition-colors">
                                    <Target size={20} />
                                </div>
                                <div className="w-px h-12 bg-slate-100" />
                             </div>

                             <div className="flex-1 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] items-center gap-8">
                                <div>
                                    <h3 className="text-2xl font-black text-black tracking-tight mb-2 group-hover:text-[#FF5F2D] transition-colors font-display">
                                        {p.title}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.process} · {p.submitterName}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Execution Status</p>
                                    <StatusBadge status={p.status} />
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Benefit</p>
                                    <p className="text-xl font-black text-black font-display tracking-tighter">{formatCurrency(p.estimatedBenefit)}</p>
                                </div>

                                <div className="text-right">
                                    <button 
                                        onClick={() => onSelectProject(p)}
                                        className="px-6 py-3 border-2 border-black text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-black/5 font-display"
                                    >
                                        Execute Closure
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 opacity-60">
                             <Target size={48} strokeWidth={1} className="mb-4 text-[#FF5F2D]" />
                             <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-display">No initiatives currently in execution phase</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
