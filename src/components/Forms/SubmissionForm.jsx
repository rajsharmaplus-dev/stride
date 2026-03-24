import React, { useState } from 'react';
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
    Sparkles
} from 'lucide-react';
import { MOCK_USERS } from '../../data/mockData';
import { PROCESSES, PROJECT_TYPES, METHODOLOGIES, ROLE_THEME } from '../../constants/projectConstants';

export function SubmissionForm({ user, onSubmit, onBack, initialData }) {
    const theme = ROLE_THEME[user?.role] || ROLE_THEME['Employee'];
    const isRework = Boolean(initialData);

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        process: initialData?.process || '',
        type: initialData?.type || '',
        methodology: initialData?.methodology || '',
        summary: initialData?.summary || '',
        targetDate: initialData?.targetDate || '',
        estimatedBenefit: initialData?.estimatedBenefit || '',
        managerId: initialData?.managerId || user.managerId || '',
        docLink: initialData?.docLink || ''
    });
    const [errors, setErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
        }
    };

    const validate = () => {
        const errs = {};
        if (!formData.title.trim()) errs.title = 'Initiative title is required';
        else if (formData.title.trim().length > 120) errs.title = 'Title must be 120 characters or fewer';
        if (!formData.process) errs.process = 'Business process is required';
        if (!formData.type) errs.type = 'Project category is required';
        if (!formData.methodology) errs.methodology = 'Methodology is required';
        if (!formData.summary.trim()) errs.summary = 'Executive summary is required';
        if (!formData.targetDate) errs.targetDate = 'Target date is required';
        else {
            const today = new Date().toISOString().split('T')[0];
            if (formData.targetDate < today) errs.targetDate = 'Target date cannot be in the past';
        }
        if (!formData.managerId) errs.managerId = 'Reporting manager is required';
        if (formData.estimatedBenefit && parseFloat(formData.estimatedBenefit) < 0) errs.estimatedBenefit = 'Benefit cannot be negative';
        if (formData.docLink && formData.docLink.trim()) {
            try { new URL(formData.docLink); } catch { errs.docLink = 'Please enter a valid URL'; }
        }
        return errs;
    };

    const handleSubmit = async (isDraft) => {
        if (isDraft) {
            setIsSubmitting(true);
            try {
                await onSubmit(formData, true);
            } finally {
                setIsSubmitting(false);
            }
            return;
        }
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); setShowErrors(true); return; }
        
        setIsSubmitting(true);
        try {
            await onSubmit(formData, false);
        } catch (e) {
            setIsSubmitting(false);
        }
    };

    const completedFields = Object.values(formData).filter(v => v !== '').length;
    const totalFields = Object.keys(formData).length;
    const progress = Math.round((completedFields / totalFields) * 100);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Return to Dashboard
            </button>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                {/* Hero Header */}
                <div className="relative px-10 py-12 text-white overflow-hidden" style={{ background: theme.sidebarBg }}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                                style={{ backgroundColor: theme.pillBg, color: theme.pillText, borderColor: `${theme.accent}30` }}>
                                {isRework ? '↩ Rework Resubmission' : '✦ New Baseline'}
                            </div>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">
                            {isRework ? 'Edit & Resubmit' : 'Initiative Baseline'}
                        </h2>
                        <p className="text-white/50 text-sm mt-2 max-w-lg font-medium">
                            {isRework
                                ? 'Apply the requested changes and resubmit for approval.'
                                : 'Record the project scope and estimated benefits for executive review.'}
                        </p>

                        {/* Progress */}
                        <div className="mt-6 flex items-center gap-4">
                            <div className="flex-1 h-1 rounded-full bg-white/10">
                                <div
                                    className="h-1 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%`, backgroundColor: theme.accent }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{progress}% complete</span>
                        </div>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-[-30%] right-[-5%] w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: `${theme.accent}20` }} />
                    <div className="absolute bottom-[-20%] right-[20%] w-40 h-40 rounded-full blur-2xl" style={{ backgroundColor: `${theme.accent}10` }} />
                </div>

                <div className="p-10 space-y-12">
                    {/* Error Banner */}
                    {showErrors && Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-700">Please fix the following before submitting:</p>
                                <ul className="mt-2 space-y-1">
                                    {Object.values(errors).map((err, i) => (
                                        <li key={i} className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{err}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Section: Ownership */}
                    <FormSection icon={<Target size={14} />} title="Ownership" description="Specify the organizational baseline and reporting structure." theme={theme}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormGroup label="Submitter" value={user.name} disabled icon={<User size={15} />} />
                            <FormSelect label="Reporting Manager" name="managerId" value={formData.managerId} onChange={handleChange}
                                options={MOCK_USERS.filter(u => u.role !== 'Employee').map(m => ({ value: m.id, label: m.name }))} required theme={theme} />
                            <FormSelect label="Business Process" name="process" value={formData.process} onChange={handleChange}
                                options={PROCESSES.map(p => ({ value: p, label: p }))} required theme={theme} />
                            <FormSelect label="Project Category" name="type" value={formData.type} onChange={handleChange}
                                options={PROJECT_TYPES.map(p => ({ value: p, label: p }))} required theme={theme} />
                        </div>
                    </FormSection>

                    <div className="h-px bg-slate-100" />

                    {/* Section: Project Scope */}
                    <FormSection icon={<FileText size={14} />} title="Project Scope" description="Describe the problem statement and technical methodology." theme={theme}>
                        <div className="space-y-6">
                            <FormInput label="Initiative Title" name="title" placeholder="e.g. Q3 Regional Logistics Optimization"
                                value={formData.title} onChange={handleChange} required maxLength={120} error={errors.title} theme={theme} />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                    <span>Executive Summary / Problem Statement <span className="text-red-400">*</span></span>
                                    <span className={`font-bold ${formData.summary.length > 450 ? 'text-red-500' : 'text-slate-300'}`}>
                                        {formData.summary.length}/500
                                    </span>
                                </label>
                                <textarea
                                    name="summary" rows={5} maxLength={500}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 focus:bg-white outline-none transition-all font-medium text-sm resize-none placeholder:text-slate-300"
                                    style={{ ['--tw-ring-color']: theme?.accentMuted }}
                                    placeholder="Clearly articulate the current pain points and the proposed outcome..."
                                    value={formData.summary} onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormSelect label="Methodology" name="methodology" value={formData.methodology} onChange={handleChange}
                                    options={METHODOLOGIES.map(p => ({ value: p, label: p }))} required theme={theme} />
                                <FormInput label="Target Date" name="targetDate" type="date" value={formData.targetDate}
                                    onChange={handleChange} required min={new Date().toISOString().split('T')[0]} error={errors.targetDate} theme={theme} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estimated Benefit</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">$</span>
                                        <input type="number" name="estimatedBenefit" min="0"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-3.5 focus:bg-white outline-none transition-all font-black text-slate-900"
                                            value={formData.estimatedBenefit} onChange={handleChange} />
                                    </div>
                                    {errors.estimatedBenefit && <p className="text-xs text-red-500 font-bold">{errors.estimatedBenefit}</p>}
                                </div>
                            </div>

                            <FormInput label="Document / Resource Link" name="docLink" placeholder="https://sharepoint.com/project-docs"
                                value={formData.docLink} onChange={handleChange} icon={<Link size={15} />} error={errors.docLink} theme={theme} />
                        </div>
                    </FormSection>
                </div>

                {/* Action Footer */}
                <div className="px-10 py-6 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                    <button 
                        onClick={() => handleSubmit(true)}
                        disabled={isSubmitting}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-xs uppercase tracking-widest transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 active:scale-95'}`}
                    >
                        <Save size={15} className="text-slate-400" />
                        {isSubmitting ? 'Processing...' : 'Save Draft'}
                    </button>
                    <button 
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting}
                        className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                        style={{ background: theme.badgeBg, boxShadow: isSubmitting ? 'none' : `0 6px 20px ${theme.accentShadow}` }}>
                        <Send size={15} />
                        {isSubmitting ? 'Submitting...' : (isRework ? 'Resubmit for Baseline' : 'Submit for Baseline')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Section Wrapper ---
function FormSection({ icon, title, description, children, theme }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: theme?.accent }}>
                    {icon} {title}
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{description}</p>
            </div>
            <div className="lg:col-span-2">{children}</div>
        </div>
    );
}

// --- Internal Helper Components ---
function FormGroup({ label, value, disabled, icon }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${disabled ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-slate-900'}`}>
                <span className="text-slate-300">{icon}</span>
                <span className="text-sm font-semibold">{value}</span>
            </div>
        </div>
    );
}

function FormInput({ label, name, value, onChange, placeholder, type = 'text', required, icon, maxLength, min, error }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative group">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-500 transition-colors">{icon}</div>}
                <input type={type} name={name}
                    className={`w-full bg-slate-50 border rounded-2xl ${icon ? 'pl-11' : 'px-5'} py-3.5 focus:bg-white outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-300 focus:border-slate-200 ${error ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}
                    placeholder={placeholder} value={value} onChange={onChange} maxLength={maxLength} min={min}
                />
            </div>
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
        </div>
    );
}

function FormSelect({ label, name, value, onChange, options, required }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                <select name={name}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:bg-white focus:border-slate-200 outline-none transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                    value={value} onChange={onChange}
                >
                    <option value="">Select option…</option>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}
