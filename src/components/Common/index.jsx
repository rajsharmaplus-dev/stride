import React from 'react';
import { Download, X, Send, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { PROJECT_STATUS } from '../../constants/projectConstants';

const STATUS_STYLES = {
    [PROJECT_STATUS.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
    [PROJECT_STATUS.PENDING]: 'bg-amber-50 text-amber-600 border-amber-200',
    [PROJECT_STATUS.REWORK]: 'bg-orange-50 text-orange-600 border-orange-200',
    [PROJECT_STATUS.ACTIVE]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    [PROJECT_STATUS.DECLINED]: 'bg-red-50 text-red-600 border-red-200',
    [PROJECT_STATUS.CLOSED]: 'bg-indigo-50 text-indigo-600 border-indigo-200',
};

const STATUS_DOT = {
    [PROJECT_STATUS.DRAFT]: 'bg-slate-400',
    [PROJECT_STATUS.PENDING]: 'bg-amber-400',
    [PROJECT_STATUS.REWORK]: 'bg-orange-400',
    [PROJECT_STATUS.ACTIVE]: 'bg-emerald-400',
    [PROJECT_STATUS.DECLINED]: 'bg-red-400',
    [PROJECT_STATUS.CLOSED]: 'bg-indigo-400',
};

const FALLBACK_STYLE = 'bg-slate-50 text-slate-500 border-slate-200';

export function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[status] || FALLBACK_STYLE}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-400'}`} />
            {status || 'Unknown'}
        </span>
    );
}

// Color config per stat card variant
const STAT_COLORS = {
    default: {
        iconBg: 'bg-slate-50',
        iconText: 'text-slate-400',
        valueShadow: 'text-slate-900',
    },
    emerald: {
        iconBg: 'bg-emerald-50',
        iconText: 'text-emerald-500',
        valueShadow: 'text-slate-900',
    },
    amber: {
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-500',
        valueShadow: 'text-slate-900',
    },
    accent: {
        iconBg: null, // uses theme accent
        iconText: 'text-white',
        valueShadow: null,
    },
};

export function StatCard({ title, value, icon, highlight, theme, color = 'default', trend, onClick }) {
    const c = STAT_COLORS[color] || STAT_COLORS.default;
    const isAccent = color === 'accent';

    return (
        <div 
            onClick={onClick}
            className={`relative bg-white rounded-none p-6 border transition-all duration-300 overflow-hidden group
            ${isAccent ? 'border-transparent shadow-xl' : 'border-slate-100 shadow-sm'}
            ${onClick ? 'cursor-pointer hover:shadow-2xl' : ''}
        `}
            style={isAccent
                ? { background: theme?.badgeBg || '#0f172a', boxShadow: `0 8px 32px ${theme?.accentShadow || 'rgba(0,0,0,0.2)'}` }
                : highlight ? { ringColor: theme?.accent } : {}
            }
        >
            {/* ... Glow logic ... */}

            <div className="flex items-start justify-between mb-6">
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isAccent ? 'text-white/60' : 'text-slate-400'}`}>{title}</p>
                <div
                    className={`p-2.5 rounded-none ${c.iconBg || ''}`}
                    style={isAccent ? { backgroundColor: 'rgba(255,255,255,0.15)' } : highlight ? { backgroundColor: `${theme?.accentMuted}` } : {}}
                >
                    <span className={c.iconText} style={highlight && !isAccent ? { color: theme?.accent } : {}}>
                        {icon}
                    </span>
                </div>
            </div>

            <p className={`text-4xl font-black tracking-tighter font-display ${isAccent ? 'text-white' : c.valueShadow}`}>
                {value}
            </p>

            {trend && (
                <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${isAccent ? 'text-white/50' : 'text-slate-400'}`}>{trend}</p>
            )}

        </div>
    );
}

export function NavItem({ icon, label, active, onClick, count, theme }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between group px-6 py-5 relative transition-all duration-200 ${active
                ? 'text-white bg-white/5'
                : `text-[#BCBEC0] hover:text-white hover:bg-white/5`
                }`}
        >
            {/* Active Vertical Marker */}
            {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF5F2D] shadow-[2px_0_15px_rgba(255,95,45,0.5)]" />
            )}

            <div className="flex items-center gap-4">
                <span className={`${active ? 'text-[#FF5F2D]' : `text-[#BCBEC0] group-hover:text-[#FF5F2D]`} transition-colors`}>
                    {icon}
                </span>
                <span className={`text-[11px] uppercase tracking-[0.25em] ${active ? 'font-black' : 'font-bold'}`}>
                    {label}
                </span>
            </div>
            {count > 0 && (
                <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-none text-white ${active ? 'bg-[#FF5F2D]' : 'bg-white/10'}`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

export function DetailItem({ label, value, icon: Icon }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {Icon && <Icon size={12} className="text-slate-400" />}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{value || '—'}</p>
        </div>
    );
}


export function BulkActionBar({ 
  count, 
  onExport, 
  onDelete, 
  onApprove, 
  onDecline, 
  onClose,
  theme, 
  isLoading = false,
  showDelete = false,
  showApproval = false,
  showClosing = false
}) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in translate-y-0">
      <div className="bg-black/95 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-none shadow-2xl flex items-center gap-8 min-w-fit whitespace-nowrap">
        <div className="flex items-center gap-4 pr-8 border-r border-white/10">
          <div 
            className="w-10 h-10 rounded-none flex items-center justify-center text-white text-xs font-black"
            style={{ backgroundColor: theme?.accent }}
          >
            {count}
          </div>
          <div className="text-left">
            <p className="text-[10px] text-[#BCBEC0] font-black uppercase tracking-[0.2em] leading-none">Selected</p>
            <p className="text-xs text-white font-black uppercase tracking-widest mt-1.5">Initiatives</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onExport}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/5 rounded-none text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white hover:text-black"
          >
            <Download size={14} />
            {isLoading ? '...' : 'Export'}
          </button>
          
          {showApproval && (
            <>
              <button 
                onClick={onApprove}
                disabled={isLoading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-none text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
              >
                Approve
              </button>
              <button 
                onClick={onDecline}
                disabled={isLoading}
                className="px-6 py-3 bg-red-600 text-white rounded-none text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
              >
                Decline
              </button>
            </>
          )}

          {showClosing && (
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 bg-[#4442E3] text-white rounded-none text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 shadow-lg shadow-blue-500/20"
            >
              Close
            </button>
          )}
          
          {showDelete && (
            <button 
              onClick={onDelete}
              disabled={isLoading}
              className="px-4 py-3 bg-red-600/10 border border-red-600/20 text-red-500 rounded-none text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-600 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-[#FF5F2D] text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-[#4442E3] text-white'
  };

  return (
    <div className={`fixed top-8 right-8 z-[100] flex items-center justify-between min-w-[320px] px-8 py-5 rounded-none shadow-2xl animate-fade-in ${styles[type]}`}>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{message}</span>
      </div>
      <button onClick={onClose} className="hover:scale-110 transition-transform">
        <X size={14} />
      </button>
    </div>
  );
}
