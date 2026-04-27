import React from 'react';

export function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Confirm Action</p>
                    <p className="text-slate-800 font-bold text-sm leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                    <button
                        onClick={onConfirm}
                        className={`btn-primary flex-1 border-none ${danger ? '!bg-red-600' : '!bg-[#F05A28]'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
