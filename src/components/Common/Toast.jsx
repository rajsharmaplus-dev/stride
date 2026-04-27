import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const STYLES = {
    success: 'border-emerald-500/20 bg-emerald-50 text-emerald-700',
    error:   'border-red-500/20 bg-red-50 text-red-700',
    info:    'border-blue-500/20 bg-blue-50 text-blue-700',
};

export function Toast({ message, type = 'success', onClose }) {
    // Auto-dismiss after 4 seconds
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-xl border animate-fade-in ${STYLES[type]}`}>
            {type === 'success' && <CheckCircle size={16} />}
            {(type === 'error' || type === 'info') && <AlertCircle size={16} />}
            <span className="text-xs font-black uppercase tracking-widest">{message}</span>
            <button onClick={onClose} className="ml-4 opacity-40 hover:opacity-100">
                <X size={14} />
            </button>
        </div>
    );
}
