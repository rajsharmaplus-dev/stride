import React from 'react';

export function DetailItem({ label, value, icon: Icon }) {
    return (
        <div className="space-y-2 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-500/20 transition-all group">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-500/5 transition-colors">
                    {Icon && <Icon size={14} strokeWidth={2.5} />}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</span>
            </div>
            <p className="text-[14px] font-black text-slate-800 leading-none">{value || '—'}</p>
        </div>
    );
}
