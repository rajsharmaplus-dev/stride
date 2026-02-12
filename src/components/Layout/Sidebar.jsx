import React from 'react';
import {
    BarChart3,
    LayoutDashboard,
    PlusCircle,
    Clock,
    TrendingUp,
    Settings,
    ShieldCheck,
    LogOut,
    Zap
} from 'lucide-react';
import { NavItem } from '../Common';
import { HelpCircle } from 'lucide-react';


export function Sidebar({ user, activeView, setView, stats, onSwitchUser }) {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#0f172a] text-white hidden xl:flex flex-col p-6 z-20 shadow-2xl">
            <div className="flex items-center gap-3 mb-10 px-2 transition-transform hover:scale-105">
                <div className="bg-primary-500 p-2.5 rounded-xl shadow-lg shadow-primary-500/20">
                    <Zap size={24} className="text-white fill-current" />
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-tighter leading-none italic">STRIDE</h1>
                    <p className="text-[9px] font-black text-primary-400 tracking-[0.25em] uppercase opacity-80">Sync • Scope • Solve</p>
                </div>
            </div>

            <nav className="flex-1 flex flex-col space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Portfolio Management</p>
                <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setView('dashboard')} />
                <NavItem icon={<PlusCircle size={18} />} label="New Submission" active={activeView === 'submit'} onClick={() => setView('submit')} />
                <NavItem icon={<Clock size={18} />} label="Review Queue" active={activeView === 'review'} count={stats.pending} onClick={() => setView('review')} />
                <NavItem icon={<TrendingUp size={18} />} label="Closure" active={activeView === 'closure'} onClick={() => setView('closure')} />

                <div className="pt-8 mt-8 border-t border-slate-800/60 flex flex-col space-y-1.5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Support</p>
                    <NavItem icon={<HelpCircle size={18} />} label="User Guide" active={activeView === 'guide'} onClick={() => setView('guide')} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4 mt-6">Administration</p>
                    <NavItem icon={<ShieldCheck size={18} />} label="Governance" onClick={() => { }} />
                    <NavItem icon={<Settings size={18} />} label="System Settings" onClick={() => { }} />
                </div>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-800/80">
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800 shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-400 font-black">
                            {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black truncate text-white">{user.name}</p>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'Manager' ? 'bg-amber-400' : 'bg-primary-400'}`} />
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.role}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onSwitchUser}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-700"
                    >
                        <LogOut size={12} /> Switch Session
                    </button>
                </div>
            </div>
        </aside>
    );
}
