export const PROJECT_STATUS = {
    DRAFT: 'Draft',
    PENDING: 'Pending Approval',
    REWORK: 'Pending Rework',
    ACTIVE: 'Active',
    DECLINED: 'Declined',
    CLOSED: 'Closed'
};

export const PROCESSES = ['Sales', 'HR', 'Finance', 'Operations', 'IT', 'Supply Chain'];
export const PROJECT_TYPES = ['Cost Reduction', 'Revenue Generation', 'Compliance', 'Quality Improvement', 'Process Efficiency'];
export const METHODOLOGIES = ['Six Sigma', 'Lean', 'Agile', 'Waterfall', 'Quick Win'];

// Role-based theming: each role gets a distinct professional palette
export const ROLE_THEME = {
    Employee: {
        // Indigo — focused, trustworthy, collaborative
        sidebarBg: 'linear-gradient(160deg, #1e1b4b 0%, #1a1a3e 60%, #0f0f2d 100%)',
        accent: '#6366f1',          // indigo-500
        accentHover: '#4f46e5',     // indigo-600
        accentLight: '#e0e7ff',     // indigo-100
        accentMuted: 'rgba(99,102,241,0.15)',
        accentShadow: 'rgba(99,102,241,0.35)',
        badgeBg: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        badgeLabel: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/40',
        navActive: 'bg-indigo-600 shadow-indigo-500/30',
        navHover: 'hover:bg-indigo-950/60 hover:text-white',
        navIconHover: 'group-hover:text-indigo-400',
        roleLabel: 'Team Member',
        roleDesc: 'Submit & Track Projects',
        pillBg: 'rgba(99,102,241,0.2)',
        pillText: '#a5b4fc',
        dotColor: '#6366f1',
    },
    Manager: {
        // Teal — calm authority, decisive, operational
        sidebarBg: 'linear-gradient(160deg, #042f2e 0%, #0d2b2a 60%, #031f1e 100%)',
        accent: '#14b8a6',          // teal-500
        accentHover: '#0d9488',     // teal-600
        accentLight: '#ccfbf1',     // teal-100
        accentMuted: 'rgba(20,184,166,0.15)',
        accentShadow: 'rgba(20,184,166,0.35)',
        badgeBg: 'linear-gradient(135deg, #0d9488, #0891b2)',
        badgeLabel: 'bg-teal-950/60 text-teal-300 border-teal-700/40',
        navActive: 'bg-teal-700 shadow-teal-500/30',
        navHover: 'hover:bg-teal-950/60 hover:text-white',
        navIconHover: 'group-hover:text-teal-400',
        roleLabel: 'Manager',
        roleDesc: 'Review & Approve Initiatives',
        pillBg: 'rgba(20,184,166,0.2)',
        pillText: '#5eead4',
        dotColor: '#14b8a6',
    },
    Admin: {
        // Violet — executive, strategic, elevated oversight
        sidebarBg: 'linear-gradient(160deg, #2e1065 0%, #1e0a4a 60%, #150730 100%)',
        accent: '#8b5cf6',          // violet-500
        accentHover: '#7c3aed',     // violet-600
        accentLight: '#ede9fe',     // violet-100
        accentMuted: 'rgba(139,92,246,0.15)',
        accentShadow: 'rgba(139,92,246,0.35)',
        badgeBg: 'linear-gradient(135deg, #7c3aed, #db2777)',
        badgeLabel: 'bg-violet-950/60 text-violet-300 border-violet-700/40',
        navActive: 'bg-violet-700 shadow-violet-500/30',
        navHover: 'hover:bg-violet-950/60 hover:text-white',
        navIconHover: 'group-hover:text-violet-400',
        roleLabel: 'Business Head',
        roleDesc: 'Full Portfolio Governance',
        pillBg: 'rgba(139,92,246,0.2)',
        pillText: '#c4b5fd',
        dotColor: '#8b5cf6',
    },
};
