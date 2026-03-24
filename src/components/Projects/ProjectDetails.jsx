import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Lock,
    ExternalLink,
    History,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Clock,
    Calendar,
    Layers,
    Activity,
    User,
    MessageSquare,
    Target,
    DollarSign,
    RefreshCw,
    Printer,
    Send
} from 'lucide-react';


import { StatusBadge, DetailItem } from '../Common';
import { formatCurrency } from '../../utils/format';
import { PROJECT_STATUS, ROLE_THEME } from '../../constants/projectConstants';
import { MOCK_USERS } from '../../data/mockData';

export function ProjectDetails({ project: p, user, users = [], onBack, onUpdateStatus, onCloseProject, onEditAndResubmit, fetchComments, addComment }) {
    const [comment, setComment] = useState('');
    const [closureData, setClosureData] = useState({ investment: '', roi: '' });
    const [closureErrors, setClosureErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    const loadComments = useCallback(async () => {
        setIsLoadingComments(true);
        if (typeof fetchComments === 'function') {
            const result = await fetchComments(p.id);
            if (result?.isNotFound) {
                setComments([]);
                // The parent app will likely handle the 404, but we can set a local state if needed
            } else {
                setComments(Array.isArray(result) ? result : []);
            }
        }
        setIsLoadingComments(false);
    }, [p.id, fetchComments]);

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
                const result = await addComment(p.id, newComment);
                if (result?.success) {
                    setNewComment('');
                    loadComments();
                } else if (result?.isNotFound) {
                    // Handled by return to dashboard
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
                const result = await onUpdateStatus(p.id, status, note);
                if (result?.isNotFound) {
                    // Handled by parent
                }
                setComment(''); // Assuming comment is related to status update form
            }
        } catch (e) {
            console.error("Failed to update status:", e);
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
                const result = await onCloseProject(p.id, closureData.investment, closureData.roi);
                if (result?.isNotFound) {
                    // Handled by parent
                }
            }
        } catch (e) {
            console.error("Failed to close project:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!p) return null;

    const theme = ROLE_THEME[user?.role] || ROLE_THEME['Employee'];
    const isOwner = p?.submitterId === user?.id;
    const isManager = p?.managerId === user?.id;
    const isLocked = [PROJECT_STATUS.ACTIVE, PROJECT_STATUS.CLOSED, PROJECT_STATUS.DECLINED].includes(p?.status);

    // Edge case PD-51: guard against missing history array
    const history = Array.isArray(p?.history) ? p.history : [];

    // Edge case PD-52: fallback for unknown submitter - use dynamic users list
    const submitterName = users.find(u => u.id === p?.submitterId)?.name || 'Unknown User';

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Return to Portfolio
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Content Card */}
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-10 space-y-12">
                        <header className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={p?.status} />
                                    <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">REF: {p?.id?.toUpperCase() || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isLocked && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest no-print">
                                            <Lock size={12} /> Read-Only
                                        </div>
                                    )}
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg no-print"
                                    >
                                        <Printer size={14} /> Export Charter
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{p?.title || 'Untitled Initiative'}</h2>
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">Lead Submitter</p>
                                            <p className="text-sm font-semibold text-slate-800">{submitterName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Created On</p>
                                            <p className="text-sm font-bold text-slate-800">{p?.createdAt || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                            <DetailItem label="Process" value={p?.process} icon={Layers} />
                            <DetailItem label="Category" value={p?.type} icon={Activity} />
                            <DetailItem label="Methodology" value={p?.methodology} icon={Target} />
                            <DetailItem label="Target Date" value={p?.targetDate} icon={Clock} />
                        </div>

                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Executive Summary
                            </h3>
                            <div className="text-slate-700 leading-relaxed text-sm bg-white p-6 rounded-3xl border border-slate-100 shadow-sm font-medium">
                                {p?.summary || <span className="text-slate-400 italic">No summary provided.</span>}
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Value Definition</h3>
                                <div className="p-8 rounded-[2rem] text-white relative overflow-hidden group" style={{ background: theme.sidebarBg }}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: theme.pillText }}>Estimated Annual Benefit</p>
                                    <p className="text-4xl font-black tracking-tighter text-white">
                                        {formatCurrency(p?.estimatedBenefit)}
                                    </p>
                                    <DollarSign className="absolute right-[-10px] bottom-[-10px] w-24 h-24 rotate-12 group-hover:rotate-0 transition-transform duration-500" style={{ color: `${theme.accent}20` }} />
                                </div>
                            </div>

                            {(p?.status === PROJECT_STATUS.ACTIVE || p?.status === PROJECT_STATUS.CLOSED) && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Realized Value</h3>
                                    <div className={`p-8 rounded-[2rem] border-2 transition-all min-h-[140px] flex flex-col justify-center ${p?.status === PROJECT_STATUS.CLOSED ? 'bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-500/5' : 'bg-slate-50 border-slate-100'}`}>
                                        {p?.status === PROJECT_STATUS.CLOSED ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Investment</p>
                                                    <p className="text-xl font-black text-emerald-950">{formatCurrency(p?.actualInvestment)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Actual ROI</p>
                                                    <p className="text-xl font-black text-emerald-950">{formatCurrency(p?.actualRoi)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-slate-300 py-4 italic">
                                                <Activity size={24} className="animate-pulse" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Execution Completion</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        {p?.docLink && (
                            <footer className="border-t border-slate-100 pt-10 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect with Resources</span>
                                </div>
                                <a href={p.docLink} target="_blank" rel="noreferrer" className="btn-secondary py-2 flex items-center gap-2">
                                    <ExternalLink size={14} />
                                </a>
                            </footer>
                        )}

                        {/* Phase 4: Threaded Comments */}
                        <section className="border-t border-slate-100 pt-12 space-y-8 no-print">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                    <MessageSquare size={14} /> Collaboration Thread
                                </h3>
                                <span className="text-[10px] font-semibold text-slate-400">{comments.length} Messages</span>
                            </div>

                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {comments.length > 0 ? (
                                    comments.map((c, i) => (
                                        <div key={i} className={`flex gap-4 ${c?.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${c?.user_id === user?.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {c?.user_name?.charAt(0) || '?'}
                                            </div>
                                            <div className={`space-y-1.5 max-w-[80%] ${c?.user_id === user?.id ? 'items-end' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{c?.user_name || 'Anonymous'}</span>
                                                    <span className="text-[9px] text-slate-300 font-bold">{c?.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                                </div>
                                                <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${c?.user_id === user?.id ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                                    {c?.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center space-y-3 opacity-30">
                                        <MessageSquare size={32} className="mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Start the conversation</p>
                                    </div>
                                )}
                            </div>

                            <div className="relative group">
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 pr-16 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 resize-none font-medium h-24"
                                    placeholder="Add a comment or mention @team..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    className={`absolute right-3 bottom-3 p-3 bg-slate-900 text-white rounded-2xl transition-all shadow-xl ${isSubmitting || !newComment.trim() ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Action & Sidebar Panel */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Manager Action Block */}
                    {isManager && p?.status === PROJECT_STATUS.PENDING && (
                        <div className="bg-white rounded-[2rem] shadow-2xl shadow-amber-500/10 border-t-8 border-amber-400 p-8 space-y-8 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-50 p-3 rounded-2xl">
                                    <AlertCircle size={28} className="text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg leading-tight">Review Decision</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Governance Queue</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={12} /> Review Comments
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:bg-white focus:border-amber-400 outline-none transition-all placeholder:text-slate-300 resize-none font-medium h-32 shadow-inner"
                                        placeholder="Enter approval or rework details..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleUpdateStatus(PROJECT_STATUS.ACTIVE, comment || 'Baseline Approved')}
                                        disabled={isSubmitting}
                                        className={`w-full bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700 shadow-emerald-500/20 active:scale-95'}`}
                                    >
                                        <CheckCircle2 size={18} /> {isSubmitting ? 'Processing...' : 'Approve Baseline'}
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleUpdateStatus(PROJECT_STATUS.REWORK, comment || 'Rework requested')}
                                            disabled={isSubmitting}
                                            className={`border border-slate-200 text-slate-700 bg-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 active:scale-95'}`}
                                        >
                                            Rework
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(PROJECT_STATUS.DECLINED, comment || 'Declined by reviewer')}
                                            disabled={isSubmitting}
                                            className={`border border-red-100 text-red-500 bg-red-50 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100 active:scale-95'}`}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rework Resubmit Panel (B-02) */}
                    {isOwner && p?.status === PROJECT_STATUS.REWORK && (
                        <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-500/10 border-t-8 border-orange-400 p-8 space-y-6 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-50 p-3 rounded-2xl">
                                    <RefreshCw size={28} className="text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg leading-tight">Rework Required</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Action Needed</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">Your manager has requested changes to this initiative. Review the feedback in the governance log below and resubmit.</p>
                            <button
                                onClick={() => onEditAndResubmit(p)}
                                className="w-full bg-orange-500 text-white py-4 rounded-2xl hover:bg-orange-600 font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                            >
                                <RefreshCw size={18} /> Edit & Resubmit
                            </button>
                        </div>
                    )}

                    {/* Closure Tracking */}
                    {isOwner && p?.status === PROJECT_STATUS.ACTIVE && (
                        <div className="bg-white rounded-[2rem] shadow-2xl p-8 space-y-6 animate-fade-in border-t-8" style={{ borderTopColor: theme.accent, boxShadow: `0 20px 40px ${theme.accentShadow}` }}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl" style={{ backgroundColor: theme.accentMuted }}>
                                    <TrendingUp size={28} style={{ color: theme.accent }} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg leading-tight">Record Results</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Closure Submittal</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Final Investment ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className={`w-full bg-slate-50 border rounded-2xl p-4 focus:ring-2 focus:ring-primary-500/20 outline-none font-black text-slate-900 shadow-inner ${closureErrors.investment ? 'border-red-300 bg-red-50/50' : 'border-slate-100'}`}
                                        value={closureData.investment}
                                        onChange={(e) => {
                                            setClosureData({ ...closureData, investment: e.target.value });
                                            if (closureErrors.investment) setClosureErrors(prev => ({ ...prev, investment: '' }));
                                        }}
                                    />
                                    {closureErrors.investment && <p className="text-[10px] text-red-500 font-bold ml-1">{closureErrors.investment}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Realized ROI ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className={`w-full bg-slate-50 border rounded-2xl p-4 focus:ring-2 focus:ring-primary-500/20 outline-none font-black text-slate-900 shadow-inner ${closureErrors.roi ? 'border-red-300 bg-red-50/50' : 'border-slate-100'}`}
                                        value={closureData.roi}
                                        onChange={(e) => {
                                            setClosureData({ ...closureData, roi: e.target.value });
                                            if (closureErrors.roi) setClosureErrors(prev => ({ ...prev, roi: '' }));
                                        }}
                                    />
                                    {closureErrors.roi && <p className="text-[10px] text-red-500 font-bold ml-1">{closureErrors.roi}</p>}
                                </div>
                                <button
                                    disabled={!closureData.investment || !closureData.roi || isSubmitting}
                                    onClick={handleCloseProject}
                                    className={`w-full text-white py-4 rounded-2xl font-black transition-all shadow-lg ${isSubmitting || (!closureData.investment || !closureData.roi) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}`}
                                    style={{ background: theme.badgeBg, boxShadow: isSubmitting ? 'none' : `0 8px 24px ${theme.accentShadow}` }}
                                >
                                    {isSubmitting ? 'Finalizing...' : 'Finalize Record'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Audit Trail */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 text-center">
                            <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2">
                                <History size={14} className="text-slate-400" /> System Governance Log
                            </h3>
                        </div>
                        <div className="p-8">
                            {history.length > 0 ? (
                                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                    {history.map((log, i) => (
                                        <div key={i} className="flex gap-5 relative opacity-100 group">
                                            <div className={`mt-1.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110 ${log?.action === 'Approved' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' :
                                                log?.action === 'Closed' ? 'bg-primary-500 shadow-lg shadow-primary-500/20' : 'bg-slate-200 shadow-inner'
                                                }`}>
                                                {log?.action === 'Approved' && <CheckCircle2 size={12} className="text-white" />}
                                                {log?.action === 'Closed' && <TrendingUp size={12} className="text-white" />}
                                                {!['Approved', 'Closed'].includes(log?.action) && <Clock size={12} className="text-slate-400" />}
                                            </div>
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">{log?.action}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold">{log?.date || '—'}</p>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">{log?.user || 'System'}</p>
                                                {log?.note && <p className="text-slate-600 mt-3 text-xs italic bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50 leading-relaxed font-semibold">"{log.note}"</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 flex flex-col items-center gap-4 opacity-40">
                                    <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                                        <Clock size={20} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em] leading-tight text-center">Awaiting Governance<br />Actions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
