import { useState, useMemo } from 'react';
import { INITIAL_PROJECTS, MOCK_USERS } from '../data/mockData';
import { PROJECT_STATUS } from '../constants/projectConstants';

export function useProjectData() {
    const [user, setUser] = useState(MOCK_USERS[0]);
    const [projects, setProjects] = useState(INITIAL_PROJECTS);

    const stats = useMemo(() => {
        const relevant = projects.filter(p => p.submitterId === user.id || p.managerId === user.id || user.role === 'Admin');
        return {
            total: relevant.length,
            active: relevant.filter(p => p.status === PROJECT_STATUS.ACTIVE).length,
            pending: relevant.filter(p => p.status === PROJECT_STATUS.PENDING && p.managerId === user.id).length,
            roi: relevant.reduce((acc, p) => acc + (p.actualRoi || 0), 0)
        };
    }, [projects, user]);

    const handleSwitchUser = () => {
        const currentIndex = MOCK_USERS.findIndex(u => u.id === user.id);
        const nextIndex = (currentIndex + 1) % MOCK_USERS.length;
        setUser(MOCK_USERS[nextIndex]);
    };

    const addProject = (formData, isDraft) => {
        const newProject = {
            ...formData,
            id: `p${Date.now()}`,
            submitterId: user.id,
            createdAt: new Date().toISOString().split('T')[0],
            status: isDraft ? PROJECT_STATUS.DRAFT : PROJECT_STATUS.PENDING,
            history: [],
            actualInvestment: null,
            actualRoi: null,
            estimatedBenefit: parseFloat(formData.estimatedBenefit) || 0
        };
        setProjects([newProject, ...projects]);
    };

    const updateProjectStatus = (projectId, newStatus, comment) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    status: newStatus,
                    history: [{
                        date: new Date().toISOString().split('T')[0],
                        user: user.name,
                        action: newStatus,
                        note: comment
                    }, ...(p.history || [])]
                };
            }
            return p;
        }));
    };

    const updateProject = (projectId, updates) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    ...updates,
                    history: [{
                        date: new Date().toISOString().split('T')[0],
                        user: user.name,
                        action: updates.status === PROJECT_STATUS.DRAFT ? 'Saved as Draft' : 'Resubmitted',
                        note: 'Updated after rework feedback'
                    }, ...(p.history || [])]
                };
            }
            return p;
        }));
    };

    const closeProject = (projectId, investment, roi) => {
        const investmentVal = parseFloat(investment);
        const roiVal = parseFloat(roi);

        if (isNaN(investmentVal) || isNaN(roiVal) || investmentVal < 0 || roiVal < 0) {
            return; // Silently reject invalid values
        }

        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    status: PROJECT_STATUS.CLOSED,
                    actualInvestment: investmentVal,
                    actualRoi: roiVal,
                    history: [{
                        date: new Date().toISOString().split('T')[0],
                        user: user.name,
                        action: 'Closed',
                        note: 'Final financials submitted'
                    }, ...(p.history || [])]
                };
            }
            return p;
        }));
    };

    return {
        user,
        projects,
        stats,
        handleSwitchUser,
        addProject,
        updateProject,
        updateProjectStatus,
        closeProject
    };
}
