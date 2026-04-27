import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

export function ReassignModal({ users, onConfirm, onCancel }) {
    const [selectedId, setSelectedId] = useState('');
    const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#F05A28]">Reassign Reviewer</p>
                    <p className="text-slate-500 text-xs font-semibold">Select a manager to assign the selected projects to.</p>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                    {managers.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedId(m.id)}
                            className={`w-full text-left px-4 py-3 rounded-2xl border transition-all text-sm font-bold
                                ${selectedId === m.id
                                    ? 'border-[#F05A28] bg-orange-50 text-[#F05A28]'
                                    : 'border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-0.5">{m.role}</span>
                            {m.name}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                    <button
                        onClick={() => selectedId && onConfirm(selectedId)}
                        disabled={!selectedId}
                        className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <UserPlus size={14} className="inline mr-1.5" />
                        Reassign
                    </button>
                </div>
            </div>
        </div>
    );
}
