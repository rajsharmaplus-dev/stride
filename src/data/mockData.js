import { PROJECT_STATUS } from '../constants/projectConstants';

export const MOCK_USERS = [
    { id: 'u1', name: 'Alex Submitter', email: 'alex@company.com', role: 'Employee', managerId: 'u2' },
    { id: 'u2', name: 'Sarah Manager', email: 'sarah@company.com', role: 'Manager', managerId: 'u3' },
    { id: 'u3', name: 'David Business Head', email: 'david@company.com', role: 'Admin', managerId: null },
];

export const INITIAL_PROJECTS = [
    {
        id: 'p1',
        title: 'Automated Invoice Processing',
        submitterId: 'u1',
        managerId: 'u2',
        process: 'Finance',
        type: 'Cost Reduction',
        methodology: 'Lean',
        summary: 'Current manual entry takes 40 hours/week. Automation will reduce this to 5 hours.',
        targetDate: '2024-12-31',
        estimatedBenefit: 50000,
        status: PROJECT_STATUS.ACTIVE,
        docLink: 'https://sharepoint.com/project1',
        createdAt: '2024-01-15',
        actualInvestment: null,
        actualRoi: null,
        history: [{ date: '2024-01-15', user: 'Sarah Manager', action: 'Approved', note: 'Strong business case.' }]
    },
    {
        id: 'p2',
        title: 'Q3 Sales Training Program',
        submitterId: 'u1',
        managerId: 'u2',
        process: 'Sales',
        type: 'Revenue Generation',
        methodology: 'Agile',
        summary: 'Upskilling sales team on new CRM features.',
        targetDate: '2024-09-15',
        estimatedBenefit: 120000,
        status: PROJECT_STATUS.PENDING,
        docLink: '',
        createdAt: '2024-03-10',
        history: []
    },
    {
        id: 'p3',
        title: 'Legacy System Upgrade',
        submitterId: 'u1',
        managerId: 'u2',
        process: 'IT',
        type: 'Compliance',
        methodology: 'Waterfall',
        summary: 'Updating servers to meet new security protocols.',
        targetDate: '2024-06-01',
        estimatedBenefit: 30000,
        status: PROJECT_STATUS.CLOSED,
        docLink: '',
        createdAt: '2023-11-20',
        actualInvestment: 12000,
        actualRoi: 45000,
        history: [
            { date: '2024-01-05', user: 'Alex Submitter', action: 'Closed', note: 'Project completed successfully.' },
            { date: '2023-12-01', user: 'Sarah Manager', action: 'Approved', note: 'Mandatory compliance item.' }
        ]
    }
];
