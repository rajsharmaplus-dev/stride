import React from 'react';

export function StatCard({ title, value, icon, color = 'default', trend, onClick }) {
    const isAccent = color === 'accent';

    const colorStyles = {
        default: 'text-slate-500 bg-slate-50 group-hover:bg-slate-100',
        emerald: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100/80',
        amber:   'text-amber-600 bg-amber-50 group-hover:bg-amber-100/80',
        accent:  'text-white bg-white/20',
    };

    return (
        <div
            onClick={onClick}
            className={`relative group overflow-hidden rounded-3xl border transition-all duration-300 ${
                isAccent
                    ? 'border-transparent shadow-xl hover:shadow-2xl hover:-translate-y-1'
                    : 'border-slate-100 bg-white hover:border-primary-500/30 hover:shadow-lg hover:-translate-y-1'
            } ${onClick ? 'cursor-pointer' : ''}`}
            style={isAccent ? { background: 'linear-gradient(135deg, #F05A28 0%, #d94e1f 100%)' } : {}}
        >
            <div className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-2xl transition-colors duration-300 ${colorStyles[color] || colorStyles.default}`}>
                        {React.cloneElement(icon, { size: 18, strokeWidth: 2.5 })}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${isAccent ? 'bg-white/10 text-white/60' : 'bg-slate-50 text-slate-400'}`}>
                            <span className={trend.startsWith('+') ? 'text-emerald-500' : trend.startsWith('-') ? 'text-red-400' : ''}>
                                {trend.startsWith('+') ? '↑' : trend.startsWith('-') ? '↓' : ''}
                            </span>
                            {trend.replace(/[+-]/, '')}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className={`text-[11px] font-black uppercase tracking-[0.15em] ${isAccent ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
                    <p className={`text-3xl font-black font-display tracking-tighter leading-none ${isAccent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                </div>
            </div>

            {isAccent && (
                <div className="absolute right-[-20%] bottom-[-20%] opacity-10 select-none pointer-events-none rotate-12">
                    {React.cloneElement(icon, { size: 120, strokeWidth: 1 })}
                </div>
            )}
            <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ${isAccent ? 'bg-white/20' : 'bg-primary-500'}`} />
        </div>
    );
}
