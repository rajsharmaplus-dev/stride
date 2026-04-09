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
        sidebarBg: 'linear-gradient(160deg, #53565A 0%, #313336 100%)',
        accent: '#F05A28',
        accentHover: '#d94e1f',
        accentLight: '#fef2f2',
        accentMuted: 'rgba(240, 90, 40, 0.1)',
        accentShadow: 'rgba(240, 90, 40, 0.2)',
        badgeBg: 'linear-gradient(135deg, #F05A28, #ff7e54)',
        badgeLabel: 'bg-slate-900/60 text-orange-200 border-orange-900/40',
        navActive: 'bg-[#F05A28] shadow-orange-500/20',
        navHover: 'hover:bg-white/5 hover:text-white',
        navIconHover: 'group-hover:text-[#F05A28]',
        roleLabel: 'Employee',
        roleDesc: 'Innovator',
        pillBg: 'rgba(240, 90, 40, 0.1)',
        pillText: '#F05A28',
        dotColor: '#F05A28',
    },
    Manager: {
        sidebarBg: 'linear-gradient(160deg, #53565A 0%, #313336 100%)',
        accent: '#F05A28',
        accentHover: '#d94e1f',
        accentLight: '#fef2f2',
        accentMuted: 'rgba(240, 90, 40, 0.1)',
        accentShadow: 'rgba(240, 90, 40, 0.2)',
        badgeBg: 'linear-gradient(135deg, #F05A28, #ff7e54)',
        badgeLabel: 'bg-slate-900/60 text-orange-200 border-orange-900/40',
        navActive: 'bg-[#F05A28] shadow-orange-500/20',
        navHover: 'hover:bg-white/5 hover:text-white',
        navIconHover: 'group-hover:text-[#F05A28]',
        roleLabel: 'Manager',
        roleDesc: 'Team Lead',
        pillBg: 'rgba(240, 90, 40, 0.1)',
        pillText: '#F05A28',
        dotColor: '#F05A28',
    },
    Admin: {
        sidebarBg: 'linear-gradient(160deg, #53565A 0%, #313336 100%)',
        accent: '#F05A28',
        accentHover: '#d94e1f',
        accentLight: '#fef2f2',
        accentMuted: 'rgba(240, 90, 40, 0.1)',
        accentShadow: 'rgba(240, 90, 40, 0.2)',
        badgeBg: 'linear-gradient(135deg, #F05A28, #ff7e54)',
        badgeLabel: 'bg-slate-900/60 text-orange-200 border-orange-900/40',
        navActive: 'bg-[#F05A28] shadow-orange-500/20',
        navHover: 'hover:bg-white/5 hover:text-white',
        navIconHover: 'group-hover:text-[#F05A28]',
        roleLabel: 'Business Head',
        roleDesc: 'Executive',
        pillBg: 'rgba(240, 90, 40, 0.1)',
        pillText: '#F05A28',
        dotColor: '#F05A28',
    },
};
