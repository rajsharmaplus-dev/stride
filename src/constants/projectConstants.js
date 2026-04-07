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
// Role-based theming: each role gets a distinct professional palette aligned with GlobalLogic
export const ROLE_THEME = {
    Employee: {
        // GlobalLogic Orange — vibrant, initiative-taking, high energy
        sidebarBg: 'linear-gradient(160deg, #1b1b1d 0%, #000000 100%)',
        accent: '#FF5F2D',          // GL Orange
        accentHover: '#e55529',
        accentLight: '#fff5f2',
        accentMuted: 'rgba(255,95,45,0.15)',
        accentShadow: 'rgba(255,95,45,0.3)',
        badgeBg: 'linear-gradient(135deg, #FF5F2D, #ff8c66)',
        badgeLabel: 'bg-black/60 text-orange-200 border-orange-900/40',
        navActive: 'bg-[#FF5F2D] shadow-orange-500/30',
        navHover: 'hover:bg-white/10 hover:text-white',
        navIconHover: 'group-hover:text-[#FF5F2D]',
        roleLabel: 'Team Member',
        roleDesc: 'Submit & Track Projects',
        pillBg: 'rgba(255,95,45,0.2)',
        pillText: '#ff8c66',
        dotColor: '#FF5F2D',
    },
    Manager: {
        // Unified GlobalLogic Orange
        sidebarBg: 'linear-gradient(160deg, #1b1b1d 0%, #000000 100%)',
        accent: '#FF5F2D',
        accentHover: '#e55529',
        accentLight: '#fff5f2',
        accentMuted: 'rgba(255,95,45,0.15)',
        accentShadow: 'rgba(255,95,45,0.3)',
        badgeBg: 'linear-gradient(135deg, #FF5F2D, #ff8c66)',
        badgeLabel: 'bg-black/60 text-orange-200 border-orange-900/40',
        navActive: 'bg-[#FF5F2D] shadow-orange-500/30',
        navHover: 'hover:bg-white/10 hover:text-white',
        navIconHover: 'group-hover:text-[#FF5F2D]',
        roleLabel: 'Manager',
        roleDesc: 'Review & Approve Initiatives',
        pillBg: 'rgba(255,95,45,0.2)',
        pillText: '#ff8c66',
        dotColor: '#FF5F2D',
    },
    Admin: {
        // Unified GlobalLogic Orange
        sidebarBg: 'linear-gradient(160deg, #1b1b1d 0%, #000000 100%)',
        accent: '#FF5F2D',
        accentHover: '#e55529',
        accentLight: '#fff5f2',
        accentMuted: 'rgba(255,95,45,0.15)',
        accentShadow: 'rgba(255,95,45,0.3)',
        badgeBg: 'linear-gradient(135deg, #FF5F2D, #ff8c66)',
        badgeLabel: 'bg-black/60 text-orange-200 border-orange-900/40',
        navActive: 'bg-[#FF5F2D] shadow-orange-500/30',
        navHover: 'hover:bg-white/10 hover:text-white',
        navIconHover: 'group-hover:text-[#FF5F2D]',
        roleLabel: 'Business Head',
        roleDesc: 'Full Portfolio Governance',
        pillBg: 'rgba(255,95,45,0.2)',
        pillText: '#ff8c66',
        dotColor: '#FF5F2D',
    },
};
