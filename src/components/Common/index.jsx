import React from 'react';
import { PROJECT_STATUS } from '../../constants/projectConstants';

const STATUS_STYLES = {
    [PROJECT_STATUS.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
    [PROJECT_STATUS.PENDING]: 'bg-amber-50 text-amber-600 border-amber-200',
    [PROJECT_STATUS.REWORK]: 'bg-orange-50 text-orange-600 border-orange-200',
    [PROJECT_STATUS.ACTIVE]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    [PROJECT_STATUS.DECLINED]: 'bg-red-50 text-red-600 border-red-200',
    [PROJECT_STATUS.CLOSED]: 'bg-primary-50 text-primary-600 border-primary-200',
};

// Edge case C-09: fallback styling for unknown statuses
const FALLBACK_STYLE = 'bg-slate-50 text-slate-500 border-slate-200';

export function StatusBadge({ status }) {
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[status] || FALLBACK_STYLE}`}>
            {status || 'Unknown'}
        </span>
    );
}

// Edge case C-11/D-09: trend color logic handles neutral and negative trends properly
function getTrendColor(trend) {
    if (!trend) return '';
    if (trend.startsWith('+')) return 'text-emerald-500';
    if (trend.startsWith('-')) return 'text-red-500';
    return 'text-slate-500'; // neutral — "0%", "N/A", etc.
}

export function StatCard({ title, value, icon, trend, highlight }) {
    return (
        <div className={`glass-card p-5 rounded-2xl transition-all duration-300 hover:translate-y-[-4px] ${highlight ? 'ring-2 ring-primary-500/50' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
                    {trend && (
                        <p className={`text-[10px] font-bold mt-2 ${getTrendColor(trend)}`}>
                            {trend} <span className="text-slate-400 font-medium">vs last month</span>
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${highlight ? 'bg-primary-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

export function NavItem({ icon, label, active, onClick, count }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between group px-4 py-3.5 rounded-xl transition-all duration-200 ${active
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
        >
            <div className="flex items-center gap-3">
                <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-primary-400'} transition-colors`}>
                    {icon}
                </span>
                <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
            </div>
            {count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-primary-600 text-white'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

export function DetailItem({ label, value, icon: Icon }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 opacity-40 text-[10px] uppercase font-black tracking-widest">
                {Icon && <Icon size={10} />}
                <span>{label}</span>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">{value || 'Not Specified'}</p>
        </div>
    );
}

// Helper: safely format a number as currency string
export function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0';
    return `$${num.toLocaleString()}`;
}
