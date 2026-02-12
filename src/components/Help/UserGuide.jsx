import React from 'react';
import {
    BookOpen,
    Users,
    ArrowRightCircle,
    ShieldCheck,
    HelpCircle,
    CheckCircle2,
    TrendingUp,
    Clock,
    RotateCcw,
    XCircle,
    Info,
    Zap
} from 'lucide-react';

export function UserGuide() {
    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-500 p-3 rounded-2xl shadow-lg shadow-primary-500/20 text-white">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">User Guide</h1>
                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">Governance & Workflow Manual</p>
                    </div>
                </div>
                <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                    Welcome to Stride. This guide provides a comprehensive overview of the platform's roles, workflows, and governance lifecycle.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GuideCard
                    title="Employee"
                    role="Submitter"
                    icon={<Users className="text-blue-500" />}
                    items={[
                        "Launch New Initiatives via the baseline form.",
                        "Track real-time status of your portfolio.",
                        "Edit and Resubmit based on manager feedback.",
                        "Finalize records by submitting ROI at completion."
                    ]}
                />
                <GuideCard
                    title="Manager"
                    role="Reviewer"
                    icon={<ShieldCheck className="text-amber-500" />}
                    items={[
                        "Access the Review Queue for direct reports.",
                        "Approve initiatives to start execution.",
                        "Request Rework for scope adjustments.",
                        "Decline initiatives that lack strategic alignment."
                    ]}
                />
                <GuideCard
                    title="Admin"
                    role="Portfolio Lead"
                    icon={<ArrowRightCircle className="text-emerald-500" />}
                    items={[
                        "Full visibility across the corporate portfolio.",
                        "Monitor end-to-end governance lifecycle.",
                        "Analyze total ROI and portfolio value metrics.",
                        "Audit system logs and decision records."
                    ]}
                />
            </div>

            <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-10 text-white">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                        <RotateCcw className="text-primary-400" />
                        Initiative Lifecycle
                    </h3>
                    <p className="text-slate-400 mt-2 text-sm font-medium">The standard governance path from baseline to realized value.</p>
                </div>
                <div className="p-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        <StatusStep status="Draft" desc="Saved but not yet submitted for review." icon={<Info size={16} />} color="slate" />
                        <StatusStep status="Pending" desc="Awaiting Manager baseline approval." icon={<Clock size={16} />} color="amber" />
                        <StatusStep status="Active" desc="In execution. Targeted for result capture." icon={<CheckCircle2 size={16} />} color="emerald" />
                        <StatusStep status="Rework" desc="Requires specific changes by the owner." icon={<RotateCcw size={16} />} color="orange" />
                        <StatusStep status="Closed" desc="Completed with final ROI recorded." icon={<TrendingUp size={16} />} color="primary" />
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FeatureHighlight
                    title="Strategic Tagging"
                    icon={<HelpCircle className="text-primary-500" />}
                    description="Every initiative is classified by Process (e.g. Finance, IT), Category (e.g. Cost Reduction), and Methodology (e.g. Lean, Agile) to ensure high-fidelity reporting."
                />
                <FeatureHighlight
                    title="Verified Audit Trail"
                    icon={<ShieldCheck className="text-primary-500" />}
                    description="Every decision is recorded in a tamper-proof Governance Log. History includes the action, the reviewer, the date, and detailed feedback notes."
                />
            </div>

            <footer className="bg-primary-50 rounded-[2rem] p-8 flex items-center justify-between border border-primary-100">
                <div className="flex items-center gap-4">
                    <div className="bg-primary-500 text-white p-2 rounded-xl">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Demo Preparation</p>
                        <p className="text-xs text-slate-500 font-medium">Ready to present Stride to your stakeholders.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-primary-200 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                    Version 1.1 Live
                </div>
            </footer>
        </div>
    );
}

function GuideCard({ title, role, icon, items }) {
    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
                <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role}</p>
                </div>
            </div>
            <ul className="space-y-4">
                {items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 font-medium leading-relaxed">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function StatusStep({ status, desc, icon, color }) {
    const colors = {
        slate: 'bg-slate-50 border-slate-100 text-slate-600',
        amber: 'bg-amber-50 border-amber-100 text-amber-600',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        orange: 'bg-orange-50 border-orange-100 text-orange-600',
        primary: 'bg-primary-50 border-primary-100 text-primary-600',
    };

    return (
        <div className={`p-6 rounded-3xl border ${colors[color]} space-y-3`}>
            <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                {icon}
                {status}
            </div>
            <p className="text-xs font-medium leading-relaxed opacity-80">{desc}</p>
        </div>
    );
}

function FeatureHighlight({ title, icon, description }) {
    return (
        <div className="flex gap-6 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="mt-1">{icon}</div>
            <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">{title}</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
