import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    ChevronLeft, Edit2, Play, AlertTriangle, ShieldX, CheckSquare, MessageSquare, Plus, Loader2, ArrowRight,
    ArrowLeft, Lock, Printer, Layers, Activity, Target, Clock, DollarSign, Send, AlertCircle, RefreshCw, History
} from 'lucide-react';
import { StatusBadge, DetailItem } from '../Common';
import { ROLE_THEME, PROJECT_STATUS } from '../../constants/projectConstants';
import { formatCurrency } from '../../utils/format';

export function ProjectDetails({ project: p, user, users = [], onBack, onUpdateStatus, onCloseProject, onEditAndResubmit, fetchComments, addComment }) {
    const [comment, setComment] = useState('');
    const [closureData, setClosureData] = useState({ investment: '', roi: '' });
    const [closureErrors, setClosureErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    const loadComments = useCallback(async () => {
        if (!p?.id) return;
        setIsLoadingComments(true);
        if (typeof fetchComments === 'function') {
            const result = await fetchComments(p?.id);
            if (result?.isNotFound) {
                setComments([]);
            } else {
                setComments(Array.isArray(result) ? result : []);
            }
        }
        setIsLoadingComments(false);
    }, [p?.id, fetchComments]);

    useEffect(() => {
        if (p?.id) {
            loadComments();
        }
    }, [p?.id, loadComments]);

    const handleAddComment = async () => {
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (typeof addComment === 'function') {
                const result = await addComment(p?.id, newComment);
                if (result?.success) {
                    setNewComment('');
                    loadComments();
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (status, note) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (typeof onUpdateStatus === 'function') {
                await onUpdateStatus(p?.id, status, note);
                setComment('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseProject = async () => {
        if (!closureData.investment || !closureData.roi || isSubmitting) return;

        const errs = {};
        if (parseFloat(closureData.investment) < 0) errs.investment = 'Investment cannot be negative';
        if (parseFloat(closureData.roi) < 0) errs.roi = 'ROI cannot be negative';
        if (Object.keys(errs).length > 0) { setClosureErrors(errs); return; }

        setIsSubmitting(true);
        try {
            if (typeof onCloseProject === 'function') {
                await onCloseProject(p?.id, closureData.investment, closureData.roi);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!p) return null;

    const theme = ROLE_THEME[user?.role] || ROLE_THEME['Employee'];
    const isOwner = p?.submitterId === user?.id;
    const isManager = p?.managerId === user?.id;
    const isLocked = [PROJECT_STATUS.ACTIVE, PROJECT_STATUS.CLOSED, PROJECT_STATUS.DECLINED].includes(p?.status);

    const history = Array.isArray(p?.history) ? p.history : [];
    const submitterName = p?.submitterName || users.find(u => u.id === p?.submitterId)?.name || 'Unknown User';
    const managerName = p?.managerName || users.find(u => u.id === p?.managerId)?.name || 'Assigned Manager';

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10 font-sans pr-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[9px] uppercase tracking-[0.3em] transition-all group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Portfolio
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Content Card */}
                <div className="lg:col-span-8 gl-card bg-white overflow-hidden shadow-2xl shadow-slate-200">
                    <div className="p-6 space-y-8">
                        <header className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={p?.status} />
                                    <span className="text-[9px] text-[#F05A28] bg-[#F05A28]/5 px-2 py-0.5 rounded font-black tracking-widest uppercase">REF: {p?.id?.toUpperCase() || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isLocked && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest no-print">
                                            <Lock size={10} /> Read-Only
                                        </div>
                                    )}
                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 no-print"
                                    >
                                        <Printer size={12} /> Export Charter
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight font-display">{p?.title || 'Untitled Initiative'}</h1>
                                <div className="flex flex-wrap items-center gap-y-4 gap-x-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Submission By</p>
                                            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">{submitterName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F05A28]/40" />
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-[#F05A28]/60 uppercase tracking-widest">Reporting Manager</p>
                                            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">{managerName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Identity Timeline</p>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Est. {p?.createdAt || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2 bg-slate-50/30 rounded-3xl border border-slate-100">
                            <DetailItem label="Process" value={p?.process} icon={Layers} />
                            <DetailItem label="Category" value={p?.type} icon={Activity} />
                            <DetailItem label="Methodology" value={p?.methodology} icon={Target} />
                            <DetailItem label="Target Date" value={p?.targetDate} icon={Clock} />
                        </div>

                        <section className="space-y-3">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1 h-3 bg-[#F05A28] rounded-full" />
                                Executive Charter
                            </h3>
                            <div className="text-slate-700 leading-relaxed text-[15px] bg-white p-6 rounded-2xl border border-slate-100 font-medium">
                                {p?.summary || <span className="text-slate-400 italic">No summary provided.</span>}
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Expected Outcome</h3>
                                <div className="p-6 rounded-3xl text-white relative overflow-hidden group shadow-xl" style={{ background: theme.sidebarBg }}>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Estimated Annual Benefit</p>
                                    <p className="text-3xl font-black tracking-tighter text-white">
                                        {formatCurrency(p?.estimatedBenefit)}
                                    </p>
                                    <DollarSign className="absolute right-[-10px] bottom-[-10px] w-20 h-20 rotate-12 group-hover:rotate-0 transition-transform duration-500 text-white/5" />
                                </div>
                            </div>

                            {(p?.status === PROJECT_STATUS.ACTIVE || p?.status === PROJECT_STATUS.CLOSED) && (
                                <div className="space-y-3">
                                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Financial Performance</h3>
                                    <div className={`p-6 rounded-3xl border-2 transition-all min-h-[100px] flex flex-col justify-center ${p?.status === PROJECT_STATUS.CLOSED ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 border-dashed'}`}>
                                        {p?.status === PROJECT_STATUS.CLOSED ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Investment</p>
                                                    <p className="text-xl font-black text-slate-900">{formatCurrency(p?.actualInvestment)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Net Realized ROI</p>
                                                    <p className="text-xl font-black text-slate-900">{formatCurrency(p?.actualRoi)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-300 italic">
                                                <Activity size={18} className="animate-pulse" />
                                                <p className="text-[11px] font-black uppercase tracking-widest">Awaiting Value Milestone</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Collaboration */}
                        <section className="border-t border-slate-100 pt-8 space-y-6 no-print">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={12} /> Discussion
                            </h3>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {comments.length > 0 ? (
                                    comments.map((c, i) => (
                                        <div key={i} className={`flex gap-3 ${c?.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${c?.user_id === user?.id ? 'bg-[#F05A28] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {c?.user_name?.charAt(0) || '?'}
                                            </div>
                                            <div className={`space-y-1 max-w-[85%] ${c?.user_id === user?.id ? 'items-end' : ''}`}>
                                                <div className={`p-3 rounded-2xl text-[13px] font-medium leading-tight ${c?.user_id === user?.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                                    {c?.text}
                                                </div>
                                                <div className="flex items-center gap-2 px-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">{c?.user_name}</span>
                                                    <span className="text-[8px] text-slate-300 font-bold">{c?.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center opacity-20">
                                        <MessageSquare size={24} className="mx-auto mb-2" />
                                        <p className="text-[8px] font-black uppercase tracking-widest">No signals recorded</p>
                                    </div>
                                )}
                            </div>

                            <div className="relative group">
                                <textarea
                                    className="input-compact !h-auto !py-3 !rounded-2xl resize-none !text-[13px]"
                                    placeholder="Add a comment..."
                                    rows="2"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    className={`absolute right-2 bottom-2 p-2 bg-slate-900 text-white rounded-xl transition-all ${isSubmitting || !newComment.trim() ? 'opacity-20' : 'hover:scale-105 active:scale-95'}`}
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Sidebar Panel */}
                <div className="lg:col-span-4 space-y-6">
                    {(isManager || user?.role === 'Admin') && p?.status === PROJECT_STATUS.PENDING && (
                        <div className="bg-white rounded-3xl shadow-xl shadow-amber-500/5 border border-amber-100 p-6 space-y-6 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#F05A28]/5 p-2 rounded-xl">
                                    <ShieldX size={20} className="text-[#F05A28]" />
                                </div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Governance Review</h3>
                            </div>

                            <textarea
                                className="input-compact !h-24 resize-none !py-3 !text-[13px]"
                                placeholder="Decision rationale..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <div className="space-y-2">
                                <button
                                    onClick={() => handleUpdateStatus(PROJECT_STATUS.ACTIVE, comment || 'Baseline Approved')}
                                    disabled={isSubmitting}
                                    className="btn-primary w-full !py-3 !text-[10px] font-black uppercase !bg-[#F05A28] border-none shadow-[#F05A28]/20"
                                >
                                    Approve Baseline
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus(PROJECT_STATUS.REWORK, comment || 'Rework requested')}
                                        disabled={isSubmitting}
                                        className="btn-secondary w-full !py-2.5 !text-[9px] font-black uppercase"
                                    >
                                        Request Rework
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(PROJECT_STATUS.DECLINED, comment || 'Declined')}
                                        disabled={isSubmitting}
                                        className="btn-secondary w-full !py-2.5 !text-[9px] font-black uppercase !text-red-500 !border-red-100"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isOwner && p?.status === PROJECT_STATUS.REWORK && (
                        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-6 space-y-4 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 p-2 rounded-xl text-orange-500">
                                    <RefreshCw size={20} />
                                </div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Action Required</h3>
                            </div>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-loose">Correction requested in latest baseline review.</p>
                            <button
                                onClick={() => onEditAndResubmit(p)}
                                className="btn-primary w-full !py-3 !text-[10px] font-black uppercase !bg-orange-500 border-none"
                            >
                                Edit & Resubmit
                            </button>
                        </div>
                    )}

                    {/* Closure Portal */}
                    {(isOwner || user?.role === 'Admin') && p?.status === PROJECT_STATUS.ACTIVE && (
                        <div className="gl-card p-6 space-y-6 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#F05A28]/5">
                                    <Target size={20} className="text-[#F05A28]" />
                                </div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Project Closure</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Final Investment</label>
                                    <input
                                        type="number"
                                        className="input-compact !text-[13px] !font-black"
                                        value={closureData.investment}
                                        onChange={(e) => setClosureData({ ...closureData, investment: e.target.value })}
                                    />
                                    {closureErrors.investment && <p className="text-[10px] text-red-500 p-1">{closureErrors.investment}</p>}
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Net ROI Realized</label>
                                    <input
                                        type="number"
                                        className="input-compact !text-[13px] !font-black"
                                        value={closureData.roi}
                                        onChange={(e) => setClosureData({ ...closureData, roi: e.target.value })}
                                    />
                                    {closureErrors.roi && <p className="text-[10px] text-red-500 p-1">{closureErrors.roi}</p>}
                                </div>
                                <button
                                    onClick={handleCloseProject}
                                    disabled={!closureData.investment || !closureData.roi || isSubmitting}
                                    className="btn-primary w-full !py-3 !text-[10px] font-black uppercase"
                                >
                                    Finalize Engagement
                                </button>
                            </div>
                        </div>
                    )}

                    {/* History Log */}
                    <div className="gl-card p-6 space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                             <History size={14} />
                             <h3 className="text-[9px] font-black uppercase tracking-widest">Audit Trail</h3>
                        </div>
                        <div className="space-y-6">
                            {history.length > 0 ? history.map((log, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ring-4 ring-offset-2 ${log?.action === 'Approved' ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-200 ring-slate-50'}`} />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{log?.action}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{log?.date || '—'}</p>
                                        {log?.note && <p className="text-[10px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">"{log.note}"</p>}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-[9px] font-black text-slate-300 uppercase italic py-4 text-center">Empty Journal</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
