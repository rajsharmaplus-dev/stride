import React, { useState } from 'react';
import { Users, Shield, User, Briefcase, ChevronRight, Search, CheckCircle2, AlertCircle, Ban, Trash2 } from 'lucide-react';
import { ROLE_THEME } from '../../constants/projectConstants';
import { StatusBadge } from '../Common';

export function PeopleManagement({ currentUser, users, onUpdateRole, onUpdateStatus, onDeleteUser }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [message, setMessage] = useState(null);

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = async (userId, actionName, actionPromise) => {
        setUpdatingUserId(userId);
        const result = await actionPromise;
        setUpdatingUserId(null);
        
        if (result.success) {
            setMessage({ text: `${actionName} Successful`, type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ text: result.error || `${actionName} Failed`, type: 'error' });
        }
    };

    const handleRoleChange = (userId, newRole) => handleAction(userId, 'Role Update', onUpdateRole(userId, newRole));
    
    // Fallback locally until user refresh populates `status` column
    const getStatus = (u) => u.status || 'Active';

    return (
        <div className="space-y-6 animate-fade-in pr-6 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-[#F05A28]/10 text-[#F05A28]">
                        <Users size={16} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            Identity Governance
                        </h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            System Access Control & Privilege Management · {users.length} Total Users
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {message && (
                        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 animate-slide-up border ${
                            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                        }`}>
                            <CheckCircle2 size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{message.text}</span>
                        </div>
                    )}
                    <div className="relative group w-full md:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#F05A28] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find User..."
                            className="input-compact !pl-9 !text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="gl-card overflow-hidden">
                <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">User Profile</th>
                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Current Rank</th>
                                <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Access Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map(u => {
                                const isSelf = u.id === currentUser?.id;
                                
                                return (
                                    <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                                                    {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                        {u.name}
                                                        {isSelf && <span className="text-[8px] bg-[#F05A28]/10 text-[#F05A28] px-1.5 py-0.5 rounded font-black uppercase">Me</span>}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-md border ${
                                                getStatus(u) === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {getStatus(u)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={u.role} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {isSelf ? (
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-2 py-1 rounded-md border border-dashed border-slate-200">Full System Root</span>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                                    <select
                                                        disabled={updatingUserId === u.id}
                                                        className="input-compact !w-auto !py-1 !px-2 !text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:opacity-50"
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    >
                                                        <option value="Employee">Employee</option>
                                                        <option value="Manager">Manager</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                    
                                                    {/* Security Actions */}
                                                    <button 
                                                        title={getStatus(u) === 'Active' ? 'Suspend User' : 'Reactivate User'}
                                                        disabled={updatingUserId === u.id}
                                                        onClick={() => handleAction(u.id, 'Status Update', onUpdateStatus(u.id, getStatus(u) === 'Active' ? 'Suspended' : 'Active'))}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg hover:text-slate-900 transition-colors disabled:opacity-50"
                                                    >
                                                        <Ban size={14} className={getStatus(u) === 'Suspended' ? 'text-red-500' : ''} />
                                                    </button>
                                                    <button 
                                                        title="Permanently Remove User"
                                                        disabled={updatingUserId === u.id}
                                                        onClick={() => {
                                                            if (confirm('Are you certain? This will delete the user entirely if they have no active projects.')) {
                                                                handleAction(u.id, 'Deletion', onDeleteUser(u.id));
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg hover:text-red-600 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {filteredUsers.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                        <Search size={32} strokeWidth={1.5} className="mb-3 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity Not Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
