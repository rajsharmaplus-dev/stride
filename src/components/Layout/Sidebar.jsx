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
    Zap,
    HelpCircle,
    UserCircle2
} from 'lucide-react';
import { NavItem } from '../Common';
import { ROLE_THEME } from '../../constants/projectConstants';

// Role-filtered nav config:
// Employee: Dashboard, New Submission, Closure
// Manager:  Dashboard, Review Queue
// Admin:    Dashboard, Review Queue, Closure, Governance
function getNavSections(role, stats, activeView, setView, theme) {
    const allNavItems = {
        dashboard: (
            <NavItem
                key="dashboard"
                theme={theme}
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                active={activeView === 'dashboard'}
                onClick={() => setView('dashboard')}
            />
        ),
        submit: (
            <NavItem
                key="submit"
                theme={theme}
                icon={<PlusCircle size={18} />}
                label="New Submission"
                active={activeView === 'submit'}
                onClick={() => setView('submit')}
            />
        ),
        review: (
            <NavItem
                key="review"
                theme={theme}
                icon={<Clock size={18} />}
                label="Review Queue"
                active={activeView === 'review'}
                count={stats.pending}
                onClick={() => setView('review')}
            />
        ),
        closure: (
            <NavItem
                key="closure"
                theme={theme}
                icon={<TrendingUp size={18} />}
                label="Closure"
                active={activeView === 'closure'}
                onClick={() => setView('closure')}
            />
        ),
        guide: (
            <NavItem
                key="guide"
                theme={theme}
                icon={<HelpCircle size={18} />}
                label="User Guide"
                active={activeView === 'guide'}
                onClick={() => setView('guide')}
            />
        ),
        people: (
            <NavItem
                key="people"
                theme={theme}
                icon={<UserCircle2 size={18} />}
                label="People & Roles"
                active={activeView === 'people'}
                onClick={() => setView('people')}
            />
        ),
        governance: (
            <NavItem
                key="governance"
                theme={theme}
                icon={<ShieldCheck size={18} />}
                label="Governance"
                active={activeView === 'governance'}
                onClick={() => setView('governance')}
            />
        ),
        settings: (
            <NavItem
                key="settings"
                theme={theme}
                icon={<Settings size={18} />}
                label="System Settings"
                onClick={() => { }}
            />
        ),
    };

    if (role === 'Employee') {
        return {
            portfolio: [allNavItems.dashboard, allNavItems.submit, allNavItems.closure],
            support: [allNavItems.guide],
            admin: [],
        };
    }
    if (role === 'Manager') {
        return {
            portfolio: [allNavItems.dashboard, allNavItems.review],
            support: [allNavItems.guide],
            admin: [],
        };
    }
    // Admin
    return {
        portfolio: [allNavItems.dashboard, allNavItems.review, allNavItems.closure],
        support: [allNavItems.guide],
        admin: [allNavItems.people, allNavItems.governance, allNavItems.settings],
    };
}

export function Sidebar({ user, activeView, setView, stats, onLogout }) {
    const theme = ROLE_THEME[user?.role] || ROLE_THEME['Employee'];
    const sections = getNavSections(user?.role, stats, activeView, setView, theme);

    return (
        <aside className="w-64 h-full flex flex-col sidebar-themed shadow-2xl overflow-hidden border-r border-white/5"
            style={{ background: theme.sidebarBg }}>
            
            {/* Branding Accent */}
            <div className="h-0.5 w-full bg-[#F05A28]" />

            {/* Logo Section */}
            <div className="p-5 pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-[#F05A28]/20 transition-colors">
                        <img src="/logo.png" alt="Stride" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter italic leading-none select-none text-white">STRIDE</h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#F05A28] mt-1.5 opacity-90">Governance Platform</p>
                    </div>
                </div>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
                {/* Core Portfolio */}
                <div className="space-y-1">
                    <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em] mb-2 px-3">
                        01 — Portfolio
                    </p>
                    <div className="space-y-0.5">
                        {sections.portfolio}
                    </div>
                </div>

                {/* Admin/Governance Section */}
                {sections.admin.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em] mb-2 px-3">
                            02 — Governance
                        </p>
                        <div className="space-y-0.5">
                            {sections.admin}
                        </div>
                    </div>
                )}

                {/* Support Section */}
                <div className="space-y-1">
                    <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em] mb-2 px-3">
                        03 — Support
                    </p>
                    <div className="space-y-0.5">
                        {sections.support}
                    </div>
                </div>
            </nav>

            {/* User Profile Footer */}
            <div className="p-3 bg-black/20 border-t border-white/5 space-y-3">
                <div className="rounded-xl p-3 border border-white/5 bg-white/5 space-y-3">
                    {/* Role pill */}
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest"
                             style={{ color: theme.pillText }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.dotColor }} />
                            {theme.roleLabel}
                        </div>
                        <Zap size={10} className="text-[#F05A28] opacity-50" />
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 shadow-lg"
                            style={{ background: theme.badgeBg }}>
                            {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] font-black text-white truncate leading-none">{user?.name}</p>
                            <p className="text-[11px] font-bold truncate mt-1.5 uppercase tracking-tight opacity-70">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/10 hover:bg-white/5 hover:text-white text-white/60"
                >
                    <LogOut size={14} />
                    System Exit
                </button>
            </div>
        </aside>
    );
}
