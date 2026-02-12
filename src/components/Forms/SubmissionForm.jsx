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
    AlertTriangle
} from 'lucide-react';
import { MOCK_USERS } from '../../data/mockData';
import { PROCESSES, PROJECT_TYPES, METHODOLOGIES } from '../../constants/projectConstants';

export function SubmissionForm({ user, onSubmit, onBack, initialData }) {
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

    const handleSubmit = (isDraft) => {
        if (isDraft) {
            onSubmit(formData, true);
            return;
        }
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            setShowErrors(true);
            return;
        }
        onSubmit(formData, false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Return to Dashboard
            </button>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 px-10 py-12 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black tracking-tight">Initiative Baseline</h2>
                        <p className="text-slate-400 text-sm mt-3 max-w-lg font-medium">Record the project scope and estimated benefits for executive review and portfolio alignment.</p>
                    </div>
                    <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
                </div>

                <div className="p-10 space-y-12">
                    {/* Section: Governance */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Target size={14} className="text-primary-500" /> Ownership
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Specify the organizational baseline and reporting structure.</p>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormGroup label="Submitter" value={user.name} disabled icon={<User size={16} />} />

                            <FormSelect
                                label="Reporting Manager"
                                name="managerId"
                                value={formData.managerId}
                                onChange={handleChange}
                                options={MOCK_USERS.filter(u => u.role !== 'Employee').map(m => ({ value: m.id, label: m.name }))}
                                required
                            />

                            <FormSelect
                                label="Business Process"
                                name="process"
                                value={formData.process}
                                onChange={handleChange}
                                options={PROCESSES.map(p => ({ value: p, label: p }))}
                                required
                            />

                            <FormSelect
                                label="Project Category"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                options={PROJECT_TYPES.map(p => ({ value: p, label: p }))}
                                required
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {showErrors && Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-700">Please fix the following before submitting:</p>
                                <ul className="mt-2 space-y-1">
                                    {Object.values(errors).map((err, i) => (
                                        <li key={i} className="text-xs text-red-600 font-medium">• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Section: Project Scope */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FileText size={14} className="text-primary-500" /> Project Scope
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Describe the problem statement and technical methodology.</p>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <FormInput
                                label="Initiative Title"
                                name="title"
                                placeholder="e.g. Q3 Regional Logistics Optimization"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                maxLength={120}
                                error={errors.title}
                            />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                    <span>Executive Summary / Problem Statement</span>
                                    <span className={`${formData.summary.length > 450 ? 'text-red-500' : 'text-slate-300'}`}>
                                        {formData.summary.length}/500
                                    </span>
                                </label>
                                <textarea
                                    name="summary"
                                    rows={5}
                                    maxLength={500}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 focus:ring-2 focus:ring-primary-500/20 focus:bg-white outline-none transition-all font-medium text-sm resize-none"
                                    placeholder="Clearly articulate the current pain points and the proposed outcome..."
                                    value={formData.summary}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormSelect
                                    label="Methodology"
                                    name="methodology"
                                    value={formData.methodology}
                                    onChange={handleChange}
                                    options={METHODOLOGIES.map(p => ({ value: p, label: p }))}
                                    required
                                />

                                <FormInput
                                    label="Target Date"
                                    name="targetDate"
                                    type="date"
                                    value={formData.targetDate}
                                    onChange={handleChange}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    error={errors.targetDate}
                                />

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Estimated Benefit</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">$</span>
                                        <input
                                            type="number"
                                            name="estimatedBenefit"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-3.5 focus:ring-2 focus:ring-primary-500/20 focus:bg-white outline-none transition-all font-black text-slate-900"
                                            value={formData.estimatedBenefit}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {errors.estimatedBenefit && <p className="text-xs text-red-500 font-bold mt-1 ml-1">{errors.estimatedBenefit}</p>}
                                </div>
                            </div>

                            <div className="md:col-span-3">
                                <FormInput
                                    label="Document / Resource Link"
                                    name="docLink"
                                    placeholder="https://sharepoint.com/project-docs"
                                    value={formData.docLink}
                                    onChange={handleChange}
                                    icon={<Link size={16} />}
                                    error={errors.docLink}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
                    <button
                        onClick={() => handleSubmit(true)}
                        className="btn-secondary group"
                    >
                        <div className="flex items-center gap-2">
                            <Save size={18} className="text-slate-400 group-hover:text-slate-900" />
                            <span>Save Draft</span>
                        </div>
                    </button>
                    <button
                        onClick={() => handleSubmit(false)}
                        className="btn-primary"
                    >
                        <div className="flex items-center gap-2">
                            <Send size={18} />
                            <span>{initialData ? 'Resubmit for Baseline' : 'Submit for Baseline'}</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Internal Helper Components ---

function FormGroup({ label, value, disabled, icon }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${disabled ? 'bg-slate-50 border-slate-100 text-slate-400 font-bold' : 'bg-white border-slate-200 text-slate-900'}`}>
                {icon}
                <span className="text-sm">{value}</span>
            </div>
        </div>
    );
}

function FormInput({ label, name, value, onChange, placeholder, type = "text", required, icon, maxLength, min, error }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative group">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">{icon}</div>}
                <input
                    type={type}
                    name={name}
                    className={`w-full bg-slate-50 border rounded-2xl ${icon ? 'pl-11' : 'px-5'} py-3.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 focus:bg-white outline-none transition-all font-semibold text-sm text-slate-900 placeholder:text-slate-300 placeholder:font-medium ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-100'}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    maxLength={maxLength}
                    min={min}
                />
            </div>
            {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
        </div>
    );
}

function FormSelect({ label, name, value, onChange, options, required }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                <select
                    name={name}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 focus:bg-white outline-none transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                    value={value}
                    onChange={onChange}
                >
                    <option value="">Select Option</option>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}
