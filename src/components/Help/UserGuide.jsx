import React from 'react';
import {
    BookOpen,
    Users,
    ShieldCheck,
    CheckCircle2,
    TrendingUp,
    Clock,
    RotateCcw,
    Info,
    Zap,
    Send,
    Eye,
    Edit3,
    Target,
    ClipboardList,
    Search
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

            <section className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Operating Manual</h2>
                    <p className="text-slate-500 font-medium">Step-by-step instructions for a seamless experience.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Users size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">For Submitters</h3>
                        </div>
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-100">
                            <Step
                                num="1"
                                title="Launch Submission"
                                icon={<Send size={16} />}
                                desc="Navigate to 'New Submission' and fill in the initiative baseline: title, process, and estimated ROI."
                            />
                            <Step
                                num="2"
                                title="Track Status"
                                icon={<Eye size={16} />}
                                desc="Monitor the 'Dashboard'. A status of 'Pending' means it's awaiting manager review."
                            />
                            <Step
                                num="3"
                                title="Address Feedback"
                                icon={<Edit3 size={16} />}
                                desc="If you see 'Rework', view the record to read feedback, then use 'Edit & Resubmit' to update."
                            />
                            <Step
                                num="4"
                                title="Realize Value"
                                icon={<Target size={16} />}
                                desc="Once execution is done, locate your 'Active' project and submit actual financials to 'Close' it."
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">For Reviewers</h3>
                        </div>
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-100">
                            <Step
                                num="1"
                                title="Audit Queue"
                                icon={<ClipboardList size={16} />}
                                desc="Check the 'Review Queue' regularly or click the 'Needs Review' card on the dashboard."
                            />
                            <Step
                                num="2"
                                title="Batch Approval"
                                icon={<Zap size={16} />}
                                desc="Select multiple 'Pending' projects using checkboxes to approve or decline them all at once."
                            />
                            <Step
                                num="3"
                                title="Decision Action"
                                icon={<CheckCircle2 size={16} />}
                                desc="Choose 'Approve' to activate or 'Request Rework' with clear instructions for the owner."
                            />
                            <Step
                                num="4"
                                title="Govern Portfolio"
                                icon={<TrendingUp size={16} />}
                                desc="Use 'Governance' to see the audit trail. Click any audit row to jump directly to project details."
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200/60">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                        <Zap size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Advanced Operations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureBox 
                        title="Bulk Export" 
                        desc="Select any number of initiatives and click 'Export' in the bulk action bar to download a CSV report." 
                    />
                    <FeatureBox 
                        title="Quick Navigation" 
                        desc="Stat cards on the dashboard are now interactive. Click them to jump to filtered project lists." 
                    />
                    <FeatureBox 
                        title="Multi-Project Actions" 
                        desc="Delete drafts or close active projects in bulk by selecting them on the dashboard." 
                    />
                </div>
            </section>


            <footer className="bg-primary-50 rounded-[2rem] p-8 flex items-center justify-between border border-primary-100">
                <div className="flex items-center gap-4">
                    <div className="bg-primary-500 text-white p-2 rounded-xl">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">System Status</p>
                        <p className="text-xs text-slate-500 font-medium">Bulk operations and interactive governance active.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-primary-200 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                    Version 1.2 Enhanced
                </div>
            </footer>
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


function Step({ num, title, icon, desc }) {
    return (
        <div className="flex gap-6 relative z-10">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-sm font-black text-slate-400 group-hover:border-primary-500 transition-colors">
                {num}
            </div>
            <div className="space-y-1.5 pt-1.5 flex-1">
                <h4 className="flex items-center gap-2 font-black text-slate-900 leading-none">
                    <span className="text-primary-500">{icon}</span>
                    {title}
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {desc}
                </p>
            </div>
        </div>
    );
}

function FeatureBox({ title, desc }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">{title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}
