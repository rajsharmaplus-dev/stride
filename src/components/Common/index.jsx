import React from 'react';
import { Download, X, Send, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { PROJECT_STATUS } from '../../constants/projectConstants';

const STATUS_STYLES = {
    [PROJECT_STATUS.DRAFT]: 'bg-slate-50 text-slate-500 border-slate-200',
    [PROJECT_STATUS.PENDING]: 'bg-amber-50 text-amber-600 border-amber-100',
    [PROJECT_STATUS.REWORK]: 'bg-orange-50 text-orange-600 border-orange-100',
    [PROJECT_STATUS.ACTIVE]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [PROJECT_STATUS.DECLINED]: 'bg-red-50 text-red-600 border-red-100',
    [PROJECT_STATUS.CLOSED]: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_DOT = {
    [PROJECT_STATUS.DRAFT]: 'bg-slate-300',
    [PROJECT_STATUS.PENDING]: 'bg-amber-400',
    [PROJECT_STATUS.REWORK]: 'bg-orange-400',
    [PROJECT_STATUS.ACTIVE]: 'bg-emerald-400',
    [PROJECT_STATUS.DECLINED]: 'bg-red-400',
    [PROJECT_STATUS.CLOSED]: 'bg-slate-400',
};

export function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest border transition-colors ${STATUS_STYLES[status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-300'}`} />
            {status || 'Unknown'}
        </span>
    );
}

export function StatCard({ title, value, icon, highlight, theme, color = 'default', trend, onClick }) {
    const isAccent = color === 'accent';
    
    const colorStyles = {
        default: 'text-slate-500 bg-slate-50 group-hover:bg-slate-100',
        emerald: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100/80',
        amber: 'text-amber-600 bg-amber-50 group-hover:bg-amber-100/80',
        accent: 'text-white bg-white/20'
    };

    const trendStyles = {
        up: 'text-emerald-600',
        down: 'text-red-500',
        neutral: 'text-slate-400'
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
                    <p className={`text-[11px] font-black uppercase tracking-[0.15em] ${isAccent ? 'text-white/70' : 'text-slate-400'}`}>
                        {title}
                    </p>
                    <p className={`text-3xl font-black font-display tracking-tighter leading-none ${isAccent ? 'text-white' : 'text-slate-900'}`}>
                        {value}
                    </p>
                </div>
            </div>

            {/* Subtle decorative pattern for accent card */}
            {isAccent && (
                <div className="absolute right-[-20%] bottom-[-20%] opacity-10 select-none pointer-events-none rotate-12">
                    {React.cloneElement(icon, { size: 120, strokeWidth: 1 })}
                </div>
            )}
            
            {/* Background accent line or glow */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ${isAccent ? 'bg-white/20' : 'bg-primary-500'}`} />
        </div>
    );
}

export function NavItem({ icon, label, active, onClick, count, theme }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between group px-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden"
        >
            {/* Background Hover Effect */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 bg-white/5'}`}
                 style={active ? { background: theme.navActive } : {}} />
            
            <div className="flex items-center gap-3 relative z-10">
                <span className={`transition-colors duration-200 ${active ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>
                    {React.cloneElement(icon, { size: 18 })}
                </span>
                <span className={`text-[15px] tracking-tight transition-colors duration-200 ${active ? 'text-white font-bold' : 'text-white/70 font-medium group-hover:text-white'}`}>
                    {label}
                </span>
            </div>
            
            {count > 0 && (
                <span className={`relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md transition-all ${
                    active ? 'bg-white text-[#F05A28]' : 'bg-white/10 text-white/40 group-hover:text-white'
                }`}>
                    {count}
                </span>
            )}
        </button>
    );
}

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in translate-y-0 w-full max-w-4xl px-6">
      <div className="bg-slate-900 shadow-2xl border border-white/10 p-2 rounded-2xl flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4 px-4">
          <div className="flex flex-col">
            <span className="text-[12px] font-black uppercase tracking-widest text-[#F05A28]">Bulk Selection</span>
            <span className="text-white text-sm font-bold">{count} Initiatives selected</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSubmit && (
             <button onClick={onSubmit} disabled={isLoading} className="btn-primary">Submit Batch</button>
          )}
          {showApproval && (
            <div className="flex gap-1.5 mr-2 pr-2 border-r border-white/10">
              <button onClick={onApprove} disabled={isLoading} className="btn-primary !bg-[#F05A28]">Approve</button>
              <button onClick={onDecline} disabled={isLoading} className="btn-primary !bg-red-600">Decline</button>
            </div>
          )}
          {showReassign && (
             <button onClick={onReassign} disabled={isLoading} className="btn-secondary !bg-transparent !text-white !border-white/20">Reassign</button>
          )}
          {showClosing && (
             <button onClick={onClose} disabled={isLoading} className="btn-primary !bg-slate-900">Close Out</button>
          )}
          <button onClick={onExport} disabled={isLoading} className="p-2 text-white/60 hover:text-white transition-colors">
            <Download size={18} />
          </button>
          {showDelete && (
            <button onClick={onDelete} disabled={isLoading} className="p-2 text-red-400 hover:text-red-300 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: 'border-emerald-500/20 bg-emerald-50 text-emerald-700',
    error: 'border-red-500/20 bg-red-50 text-red-700',
    info: 'border-blue-500/20 bg-blue-50 text-blue-700'
  };

  // UX-01: Auto-dismiss after 4 seconds
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-xl border animate-fade-in ${styles[type]}`}>
      {type === 'success' && <CheckCircle size={16} />}
      {type === 'error' && <AlertCircle size={16} />}
      {type === 'info' && <AlertCircle size={16} />}
      <span className="text-xs font-black uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-40 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

