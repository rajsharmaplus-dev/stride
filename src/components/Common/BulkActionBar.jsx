import React from 'react';
import { Download, X } from 'lucide-react';

export function BulkActionBar({
    count,
    onExport, onDelete, onApprove, onDecline, onClose, onSubmit, onReassign,
    isLoading  = false,
    showDelete   = false,
    showApproval = false,
    showClosing  = false,
    showSubmit   = false,
    showReassign = false,
}) {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in w-full max-w-4xl px-6">
            <div className="bg-slate-900 shadow-2xl border border-white/10 p-2 rounded-2xl flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-4 px-4">
                    <div className="flex flex-col">
                        <span className="text-[12px] font-black uppercase tracking-widest text-[#F05A28]">Bulk Selection</span>
                        <span className="text-white text-sm font-bold">{count} Initiatives selected</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {showSubmit   && <button onClick={onSubmit}   disabled={isLoading} className="btn-primary">Submit Batch</button>}
                    {showApproval && (
                        <div className="flex gap-1.5 mr-2 pr-2 border-r border-white/10">
                            <button onClick={onApprove} disabled={isLoading} className="btn-primary !bg-[#F05A28]">Approve</button>
                            <button onClick={onDecline} disabled={isLoading} className="btn-primary !bg-red-600">Decline</button>
                        </div>
                    )}
                    {showReassign && <button onClick={onReassign} disabled={isLoading} className="btn-secondary !bg-transparent !text-white !border-white/20">Reassign</button>}
                    {showClosing  && <button onClick={onClose}    disabled={isLoading} className="btn-primary !bg-slate-900">Close Out</button>}
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
