import React from 'react';

export function NavItem({ icon, label, active, onClick, count, theme }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between group px-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden"
        >
            <div
                className={`absolute inset-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 bg-white/5'}`}
                style={active ? { background: theme.navActive } : {}}
            />
            <div className="flex items-center gap-3 relative z-10">
                <span className={`transition-colors duration-200 ${active ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>
                    {React.cloneElement(icon, { size: 18 })}
                </span>
                <span className={`text-[15px] tracking-tight transition-colors duration-200 ${active ? 'text-white font-bold' : 'text-white/70 font-medium group-hover:text-white'}`}>
                    {label}
                </span>
            </div>
            {count > 0 && (
                <span className={`relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md transition-all ${active ? 'bg-white text-[#F05A28]' : 'bg-white/10 text-white/40 group-hover:text-white'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}
