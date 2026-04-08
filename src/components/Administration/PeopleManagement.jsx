import React, { useState } from 'react';
import { Users, Shield, User, Briefcase, ChevronRight, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROLE_THEME } from '../../constants/projectConstants';

export function PeopleManagement({ currentUser, users, onUpdateRole }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [message, setMessage] = useState(null);

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRoleChange = async (userId, newRole) => {
        setUpdatingUserId(userId);
        const result = await onUpdateRole(userId, newRole);
        setUpdatingUserId(null);
        
        if (result.success) {
            setMessage({ text: 'Role updated successfully', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ text: result.error || 'Failed to update role', type: 'error' });
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Admin': return <Shield size={14} />;
            case 'Manager': return <Briefcase size={14} />;
            default: return <User size={14} />;
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pr-6 relative overflow-hidden font-sans">
            {/* Context Watermark */}
            <div className="absolute top-[-40px] right-[-40px] opacity-[0.05] select-none pointer-events-none text-slate-900">
                <Users size={320} strokeWidth={1} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 border-b border-slate-100 pb-12">
                <div className="space-y-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 font-sans">
                        System Administration
                    </p>
                    <div className="flex items-center gap-5">
                        <span className="text-6xl font-black text-[#FF5F2D] italic opacity-10 font-display select-none">04</span>
                        <div className="w-1.5 h-12 bg-[#FF5F2D] rounded-full" />
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none font-display">
                            PEOPLE
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                            Governance Mode
                        </div>
                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.25em] font-sans">
                            Manage user privileges and organization roles
                        </p>
                    </div>
                </div>

                {message && (
                    <div className={`px-6 py-3 rounded-xl flex items-center gap-3 animate-slide-up border ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                    </div>
                )}
            </div>

            <div className="relative z-10 space-y-6">
                {/* Search & Actions */}
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 border border-slate-100">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF5F2D] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY NAME OR EMAIL..."
                            className="w-full bg-slate-50 border-none pl-12 pr-6 py-4 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-[#FF5F2D]/20 outline-none transition-all placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-slate-100 overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Account Type</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Privilege Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map(u => {
                                const theme = ROLE_THEME[u.role] || ROLE_THEME['Employee'];
                                const isSelf = u.id === currentUser?.id;
                                
                                return (
                                    <tr key={u.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-lg"
                                                    style={{ background: theme.badgeBg }}
                                                >
                                                    {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">
                                                        {u.name} {isSelf && <span className="text-[10px] font-black text-[#FF5F2D] uppercase ml-2">(You)</span>}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div 
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                                                style={{ backgroundColor: theme.pillBg, color: theme.pillText, borderColor: `${theme.accent}30` }}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.dotColor }} />
                                                {getRoleIcon(u.role)}
                                                {u.role}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {isSelf ? (
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Protected Admin Account</p>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        disabled={updatingUserId === u.id}
                                                        className="bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg focus:ring-2 focus:ring-[#FF5F2D]/20 outline-none cursor-pointer disabled:opacity-50"
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    >
                                                        <option value="Employee">Employee</option>
                                                        <option value="Manager">Manager</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                    {updatingUserId === u.id && (
                                                        <div className="w-4 h-4 border-2 border-[#FF5F2D] border-t-transparent rounded-full animate-spin" />
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {filteredUsers.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                            <Search size={48} strokeWidth={1} className="mb-4 opacity-50" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em]">No users found matching your search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
