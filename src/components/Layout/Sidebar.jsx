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
    UserCircle2,
    ChevronRight
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
        admin: [allNavItems.governance, allNavItems.settings],
    };
}

export function Sidebar({ user, activeView, setView, stats, onLogout }) {
    const theme = ROLE_THEME[user?.role] || ROLE_THEME['Employee'];
    const sections = getNavSections(user?.role, stats, activeView, setView, theme);
    const initials = (user?.name || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <aside
            className="sidebar-themed fixed left-0 top-0 bottom-0 w-72 text-white hidden xl:flex flex-col p-6 z-20 shadow-2xl"
            style={{ background: theme.sidebarBg }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2 transition-transform hover:scale-105">
                <div
                    className="p-2.5 rounded-xl shadow-lg"
                    style={{ backgroundColor: theme.accentMuted, boxShadow: `0 4px 12px ${theme.accentShadow}` }}
                >
                    <Zap size={24} className="text-white fill-current" style={{ color: theme.accent }} />
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-tighter leading-none italic text-white">STRIDE</h1>
                    <p className="text-[9px] font-black tracking-[0.25em] uppercase opacity-70" style={{ color: theme.pillText }}>
                        Sync • Scope • Solve
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-4">
                    Portfolio Management
                </p>
                {sections.portfolio}

                {sections.support.length > 0 && (
                    <div className="pt-6 mt-4 border-t border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-4">Support</p>
                        {sections.support}
                    </div>
                )}

                {sections.admin.length > 0 && (
                    <div className="pt-6 mt-4 border-t border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-4">Administration</p>
                        {sections.admin}
                    </div>
                )}
            </nav>

            {/* Role Identity Card */}
            <div className="mt-auto pt-5 border-t border-white/10">
                {/* Prominent Role Badge */}
                <div
                    className="rounded-2xl p-4 mb-3 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                    {/* Role pill */}
                    <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border"
                        style={{
                            backgroundColor: theme.pillBg,
                            color: theme.pillText,
                            borderColor: `${theme.accent}30`
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: theme.dotColor }}
                        />
                        {theme.roleLabel}
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-lg"
                            style={{ background: theme.badgeBg, boxShadow: `0 4px 14px ${theme.accentShadow}` }}
                        >
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{user?.name}</p>
                            <p className="text-[9px] font-medium truncate mt-0.5" style={{ color: theme.pillText }}>
                                {theme.roleDesc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border"
                    style={{
                        backgroundColor: theme.accentMuted,
                        color: theme.pillText,
                        borderColor: `${theme.accent}30`,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = `${theme.accent}30`;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = theme.accentMuted;
                    }}
                >
                    <LogOut size={12} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
