import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ArrowLeft,
    Save,
    Send,
    User,
    FileText,
    Calendar,
    DollarSign,
    Target,
    ChevronDown,
    Link,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    CloudUpload
} from 'lucide-react';
import { PROCESSES, PROJECT_TYPES, METHODOLOGIES, ROLE_THEME } from '../../constants/projectConstants';

const AUTOSAVE_KEY = 'stride_form_autosave';
const AUTOSAVE_DELAY_MS = 1200;

// Required fields contribute to field precision score
const REQUIRED_FIELDS = ['title', 'process', 'type', 'methodology', 'summary', 'targetDate', 'managerId'];
const OPTIONAL_FIELDS = ['estimatedBenefit', 'docLink'];

export function SubmissionForm({ user, users = [], onSubmit, onBack, initialData }) {
    const isRework = Boolean(initialData);
    const autosaveTimer = useRef(null);
    const [autosaveStatus, setAutosaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

    // On mount: restore from autosave if no initialData (new form)
    const getInitialFormData = () => {
        if (!initialData) {
            try {
                const saved = localStorage.getItem(AUTOSAVE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Only restore if it's for the same user
                    if (parsed._userId === user?.id) return parsed;
                }
            } catch (_) {}
        }
        return {
            title: initialData?.title || '',
            process: initialData?.process || '',
            type: initialData?.type || '',
            methodology: initialData?.methodology || '',
            summary: initialData?.summary || '',
            targetDate: initialData?.targetDate || '',
            estimatedBenefit: initialData?.estimatedBenefit || '',
            managerId: initialData?.managerId || user?.managerId || '',
            docLink: initialData?.docLink || ''
        };
    };

    const [formData, setFormData] = useState(getInitialFormData);
    const [errors, setErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate real field precision (0–100)
    const fieldPrecision = (() => {
        const reqFilled = REQUIRED_FIELDS.filter(f => String(formData[f] || '').trim() !== '').length;
        const optFilled = OPTIONAL_FIELDS.filter(f => String(formData[f] || '').trim() !== '').length;
        const reqWeight = 85;
        const optWeight = 15;
        return Math.round(
            (reqFilled / REQUIRED_FIELDS.length) * reqWeight +
            (optFilled / OPTIONAL_FIELDS.length) * optWeight
        );
    })();

    // Autosave to localStorage with debounce (skip for rework — editing existing project)
    const triggerAutosave = useCallback((data) => {
        if (isRework) return;
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        setAutosaveStatus('saving');
        autosaveTimer.current = setTimeout(() => {
            try {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ ...data, _userId: user?.id }));
                setAutosaveStatus('saved');
                setTimeout(() => setAutosaveStatus('idle'), 2000);
            } catch (_) {
                setAutosaveStatus('idle');
            }
        }, AUTOSAVE_DELAY_MS);
    }, [isRework, user?.id]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = { ...formData, [name]: value };
        setFormData(next);
        triggerAutosave(next);
        if (errors[name]) {
            setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
    };

    const validate = () => {
        const errs = {};
        if (!formData.title.trim()) errs.title = 'Title required';
        if (!formData.process) errs.process = 'Process required';
        if (!formData.type) errs.type = 'Category required';
        if (!formData.methodology) errs.methodology = 'Methodology required';
        if (!formData.summary.trim()) errs.summary = 'Summary required';
        if (!formData.targetDate) errs.targetDate = 'Date required';
        if (!formData.managerId) errs.managerId = 'Manager required';
        return errs;
    };

    const handleSubmit = async (isDraft) => {
        if (isDraft) {
            setIsSubmitting(true);
            try {
                await onSubmit(formData, true);
                // Keep autosave for draft — user might come back
            } finally { setIsSubmitting(false); }
            return;
        }
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); setShowErrors(true); return; }
        setIsSubmitting(true);
        try {
            await onSubmit(formData, false);
            // Clear autosave on successful launch
            localStorage.removeItem(AUTOSAVE_KEY);
        } catch (e) { setIsSubmitting(false); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-[9px] font-black">
                    <ArrowLeft size={14} /> Back to Inventory
                </button>
                <div className="flex gap-2">
                    <button onClick={() => handleSubmit(true)} disabled={isSubmitting} className="btn-secondary !py-1">
                        <Save size={14} /> Save Draft
                    </button>
                    <button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="btn-primary !py-1">
                        <Send size={14} /> {isRework ? 'Resubmit' : 'Launch'}
                    </button>
                </div>
            </div>

            <div className="gl-card overflow-hidden">
                {/* Visual Header */}
                <div className="bg-slate-900 p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-[#F05A28]/20 border border-[#F05A28]/30 text-[#F05A28] text-[8px] font-black uppercase tracking-widest mb-3">
                            {isRework ? 'Resubmission' : 'New Initiative'}
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase font-display select-none leading-none">
                            Drafting: <span className="text-[#F05A28]/80">{formData.title || 'Untitled Initiative'}</span>
                        </h1>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-md">
                            Establish the baseline parameters for the project charter and financial projections.
                        </p>
                    </div>
                    {/* Brand Accent */}
                    <div className="absolute top-0 right-0 p-8">
                        <Sparkles size={60} className="text-white/5" />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Error Summary */}
                    {showErrors && Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Validation Errors Detected</p>
                        </div>
                    )}

                    {/* Section: Core Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-6">
                         <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F05A28] border-b border-slate-100 pb-2">01. Identity</h3>
                            <FormInput label="Initiative Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Q4 Logistics Optimization" required error={errors.title} />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormSelect label="Business Process" name="process" value={formData.process} onChange={handleChange} options={PROCESSES.map(p => ({ value: p, label: p }))} required />
                                <FormSelect label="Category" name="type" value={formData.type} onChange={handleChange} options={PROJECT_TYPES.map(p => ({ value: p, label: p }))} required />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormSelect label="Methodology" name="methodology" value={formData.methodology} onChange={handleChange} options={METHODOLOGIES.map(p => ({ value: p, label: p }))} required />
                                <FormInput label="Target Date" name="targetDate" type="date" value={formData.targetDate} onChange={handleChange} required error={errors.targetDate} />
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F05A28] border-b border-slate-100 pb-2">02. Value & Governance</h3>
                            
                            <div className="space-y-1.5">
                                <label className="label-compact">Executive Summary <span className="text-[#F05A28]">*</span></label>
                                <textarea name="summary" rows={4} placeholder="Core problem statement and proposed solution..."
                                    className="input-compact !py-3 resize-none" value={formData.summary} onChange={handleChange} />
                                {errors.summary && <p className="text-[9px] text-red-500 font-bold uppercase">{errors.summary}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput label="Estimated Benefit ($)" name="estimatedBenefit" type="number" value={formData.estimatedBenefit} onChange={handleChange} placeholder="ROI in USD" />
                                <FormSelect label="Reporting Manager" name="managerId" value={formData.managerId} onChange={handleChange} options={users.filter(u => u.role !== 'Employee').map(m => ({ value: m.id, label: m.name }))} required error={errors.managerId} />
                            </div>

                            <FormInput label="Technical Resource Link" name="docLink" value={formData.docLink} onChange={handleChange} placeholder="https://sharepoint.com/..." icon={<Link size={14} />} error={errors.docLink} />
                         </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {autosaveStatus === 'saving' && (
                            <>
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Saving...</span>
                            </>
                        )}
                        {autosaveStatus === 'saved' && (
                            <>
                                <CloudUpload size={11} className="text-emerald-500" />
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Draft saved locally</span>
                            </>
                        )}
                        {autosaveStatus === 'idle' && !isRework && (
                            <>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Autosave enabled</span>
                            </>
                        )}
                        {isRework && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Editing existing record</span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{
                                color: fieldPrecision === 100 ? '#10b981' : fieldPrecision >= 70 ? '#F05A28' : '#94a3b8'
                            }}>{fieldPrecision}%</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Field Precision</span>
                            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                        width: `${fieldPrecision}%`,
                                        background: fieldPrecision === 100
                                            ? '#10b981'
                                            : fieldPrecision >= 70
                                            ? '#F05A28'
                                            : '#94a3b8'
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, name, value, onChange, placeholder, type = 'text', required, icon, error }) {
    return (
        <div className="space-y-1.5">
            <label className="label-compact">
                {label} {required && <span className="text-[#F05A28]">*</span>}
            </label>
            <div className="relative group">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F05A28] transition-colors">{icon}</div>}
                <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
                    className={`input-compact ${icon ? '!pl-9' : ''} ${error ? '!border-red-300 !bg-red-50' : ''}`} />
            </div>
            {error && <p className="text-[9px] text-red-500 font-bold uppercase">{error}</p>}
        </div>
    );
}

function FormSelect({ label, name, value, onChange, options, required, error }) {
    return (
        <div className="space-y-1.5">
            <label className="label-compact">
                {label} {required && <span className="text-[#F05A28]">*</span>}
            </label>
            <div className="relative">
                <select name={name} value={value} onChange={onChange}
                    className={`input-compact appearance-none cursor-pointer ${error ? '!border-red-300 !bg-red-50' : ''}`}>
                    <option value="">Select Option</option>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {error && <p className="text-[9px] text-red-500 font-bold uppercase">{error}</p>}
        </div>
    );
}
