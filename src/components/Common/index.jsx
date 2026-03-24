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
            className={`relative bg-white rounded-2xl p-5 border transition-all duration-300 overflow-hidden group
            ${isAccent ? 'border-transparent shadow-lg' : 'border-slate-100 shadow-sm'}
            ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''}
        `}
            style={isAccent
                ? { background: theme?.badgeBg || '#0f172a', boxShadow: `0 8px 24px ${theme?.accentShadow || 'rgba(0,0,0,0.2)'}` }
                : highlight ? { ringColor: theme?.accent } : {}
            }
        >
            {/* Subtle glow on hover for accent card */}
            {isAccent && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
            )}

            <div className="flex items-start justify-between mb-4">
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isAccent ? 'text-white/60' : 'text-slate-400'}`}>{title}</p>
                <div
                    className={`p-2.5 rounded-xl ${c.iconBg || ''}`}
                    style={isAccent ? { backgroundColor: 'rgba(255,255,255,0.15)' } : highlight ? { backgroundColor: `${theme?.accentMuted}` } : {}}
                >
                    <span className={c.iconText} style={highlight && !isAccent ? { color: theme?.accent } : {}}>
                        {icon}
                    </span>
                </div>
            </div>

            <p className={`text-3xl font-extrabold tracking-tight ${isAccent ? 'text-white' : c.valueShadow}`}>
                {value}
            </p>

            {trend && (
                <p className={`text-[10px] font-semibold mt-1.5 ${isAccent ? 'text-white/50' : 'text-slate-400'}`}>{trend}</p>
            )}

        </div>
    );
}

export function NavItem({ icon, label, active, onClick, count, theme }) {
    const activeStyle = theme
        ? { backgroundColor: theme.accent, boxShadow: `0 4px 14px ${theme.accentShadow}` }
        : {};
    const countStyle = theme
        ? { backgroundColor: active ? 'rgba(255,255,255,0.2)' : theme.accent }
        : {};

    return (
        <button
            onClick={onClick}
            style={active ? activeStyle : {}}
            className={`w-full flex items-center justify-between group px-4 py-3.5 rounded-xl transition-all duration-200 ${active
                ? 'text-white shadow-lg'
                : `text-slate-400 hover:text-white ${theme ? 'hover:bg-white/5' : 'hover:bg-slate-800'}`
                }`}
        >
            <div className="flex items-center gap-3">
                <span className={`${active ? 'text-white' : `text-slate-500 ${theme?.navIconHover || 'group-hover:text-primary-400'}`} transition-colors`}>
                    {icon}
                </span>
                <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
            </div>
            {count > 0 && (
                <span
                    style={countStyle}
                    className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
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
  onSubmit,
  onReassign,
  theme, 
  isLoading = false,
  showDelete = false,
  showApproval = false,
  showClosing = false,
  showSubmit = false,
  showReassign = false
}) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 min-w-fit whitespace-nowrap">
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg"
            style={{ backgroundColor: theme?.accent }}
          >
            {count}
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Selected</p>
            <p className="text-sm text-white font-black mt-1">Initiatives</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onExport}
            disabled={isLoading}
            title="Export to CSV"
            className={`flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all ${isLoading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10'}`}
          >
            <Download size={14} className="text-slate-400" />
            {isLoading ? 'Wait...' : 'Export'}
          </button>
          
          {showSubmit && (
            <button 
              onClick={onSubmit}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 bg-primary-500/10 border border-primary-500/20 rounded-xl text-primary-400 text-xs font-black uppercase tracking-wider transition-all ${isLoading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary-500/20'}`}
            >
              <Send size={14} />
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          )}

          {showApproval && (
            <>
              <button 
                onClick={onApprove}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-black uppercase tracking-wider transition-all ${isLoading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-emerald-500/20'}`}
              >
                {isLoading ? 'Processing...' : 'Approve'}
              </button>
              <button 
                onClick={onDecline}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-xs font-black uppercase tracking-wider transition-all ${isLoading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-orange-500/20'}`}
              >
                {isLoading ? 'Wait...' : 'Decline'}
              </button>
            </>
          )}

          {showReassign && (
            <button 
              onClick={onReassign}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-black uppercase tracking-wider transition-all ${isLoading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-amber-500/20'}`}
            >
              <UserPlus size={14} />
              {isLoading ? 'Reassigning...' : 'Reassign'}
            </button>
          )}

          {showClosing && (
            <button 
              onClick={onClose}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-xs font-black uppercase tracking-wider transition-all ${isLoading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-indigo-500/20'}`}
            >
              {isLoading ? 'Closing...' : 'Close'}
            </button>
          )}
          
          {showDelete && (
            <button 
              onClick={onDelete}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-black uppercase tracking-wider transition-all group ${isLoading ? 'opacity-20 cursor-not-allowed' : 'hover:bg-rose-500/20'}`}
            >
              <X size={14} className="group-hover:scale-110 transition-transform" />
              {isLoading ? 'Deleting...' : 'Delete'}
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
    success: 'bg-emerald-600 text-white shadow-emerald-500/20',
    error: 'bg-rose-600 text-white shadow-rose-500/20',
    info: 'bg-indigo-600 text-white shadow-indigo-500/20'
  };

  return (
    <div className={`fixed bottom-24 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-fade-in ${styles[type]}`}>
      <div className="bg-white/20 p-1.5 rounded-xl">
        {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      </div>
      <span className="text-sm font-black tracking-tight">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2">
        <X size={14} />
      </button>
    </div>
  );
}
