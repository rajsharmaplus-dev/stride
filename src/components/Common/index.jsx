import React from 'react';
import { Download, X, Send, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { PROJECT_STATUS } from '../../constants/projectConstants';

const STATUS_STYLES = {
    [PROJECT_STATUS.DRAFT]: 'bg-slate-50 text-slate-500 border-slate-200',
    [PROJECT_STATUS.PENDING]: 'bg-amber-50 text-amber-600 border-amber-100',
    [PROJECT_STATUS.REWORK]: 'bg-orange-50 text-orange-600 border-orange-100',
    [PROJECT_STATUS.ACTIVE]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [PROJECT_STATUS.DECLINED]: 'bg-red-50 text-red-600 border-red-100',
    [PROJECT_STATUS.CLOSED]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

const STATUS_DOT = {
    [PROJECT_STATUS.DRAFT]: 'bg-slate-300',
    [PROJECT_STATUS.PENDING]: 'bg-amber-400',
    [PROJECT_STATUS.REWORK]: 'bg-orange-400',
    [PROJECT_STATUS.ACTIVE]: 'bg-emerald-400',
    [PROJECT_STATUS.DECLINED]: 'bg-red-400',
    [PROJECT_STATUS.CLOSED]: 'bg-indigo-400',
};

export function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${STATUS_STYLES[status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <span className={`w-1 h-1 rounded-full ${STATUS_DOT[status] || 'bg-slate-300'}`} />
            {status || 'Unknown'}
        </span>
    );
}

export function StatCard({ title, value, icon, highlight, theme, color = 'default', trend, onClick }) {
    const isAccent = color === 'accent';

    return (
        <div 
            onClick={onClick}
            className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${
                isAccent 
                ? 'border-transparent shadow-lg hover:shadow-xl' 
                : 'border-slate-100 bg-white hover:border-primary-500/30'
            } ${onClick ? 'cursor-pointer' : ''}`}
            style={isAccent ? { background: 'linear-gradient(135deg, #F05A28 0%, #d94e1f 100%)' } : {}}
        >
            <div className="p-4 relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isAccent ? 'text-white/60' : 'text-slate-400'}`}>
                        {title}
                    </p>
                    <div className={`p-1.5 rounded-lg ${isAccent ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-primary-500'}`}>
                        {React.cloneElement(icon, { size: 14 })}
                    </div>
                </div>
                <div className="flex items-end gap-2">
                    <p className={`text-2xl font-black font-display tracking-tight leading-none ${isAccent ? 'text-white' : 'text-slate-900'}`}>
                        {value}
                    </p>
                    {trend && (
                        <span className={`text-[9px] font-bold mb-0.5 ${isAccent ? 'text-white/40' : 'text-slate-300'}`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
            {/* Background accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isAccent ? 'bg-white/30' : 'bg-primary-500'}`} />
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
                <span className={`transition-colors duration-200 ${active ? 'text-white' : 'text-white/30 group-hover:text-white'}`}>
                    {React.cloneElement(icon, { size: 16 })}
                </span>
                <span className={`text-xs tracking-tight transition-colors duration-200 ${active ? 'text-white font-bold' : 'text-white/60 font-medium group-hover:text-white'}`}>
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
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
            <div className="flex items-center gap-2">
                {Icon && <Icon size={12} className="text-slate-300" />}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-bold text-slate-800 leading-tight">{value || '—'}</p>
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
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F05A28]">Bulk Selection</span>
            <span className="text-white text-xs font-bold">{count} Initiatives selected</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSubmit && (
             <button onClick={onSubmit} disabled={isLoading} className="btn-primary">Submit Batch</button>
          )}
          {showApproval && (
            <div className="flex gap-1.5 mr-2 pr-2 border-r border-white/10">
              <button onClick={onApprove} disabled={isLoading} className="btn-primary !bg-emerald-600">Approve</button>
              <button onClick={onDecline} disabled={isLoading} className="btn-primary !bg-red-600">Decline</button>
            </div>
          )}
          {showReassign && (
             <button onClick={onReassign} disabled={isLoading} className="btn-secondary !bg-transparent !text-white !border-white/20">Reassign</button>
          )}
          {showClosing && (
             <button onClick={onClose} disabled={isLoading} className="btn-primary !bg-indigo-600">Close Out</button>
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

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-xl border animate-fade-in ${styles[type]}`}>
      {type === 'success' && <CheckCircle size={16} />}
      {type === 'error' && <AlertCircle size={16} />}
      <span className="text-xs font-black uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-40 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
