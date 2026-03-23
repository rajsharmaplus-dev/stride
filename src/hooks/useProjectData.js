import { useState, useMemo, useEffect, useCallback } from 'react';
import { PROJECT_STATUS } from '../constants/projectConstants';

const API_BASE = '/api';

export function useProjectData() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [uRes, pRes] = await Promise.all([
                fetch(`${API_BASE}/users`),
                fetch(`${API_BASE}/projects`)
            ]);
            const uData = await uRes.json();
            const pData = await pRes.json();
            
            setUsers(uData);
            setProjects(pData);
            
            // Set initial user if not set
            if (!user && uData.length > 0) {
                setUser(uData[0]);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        if (!user) return { total: 0, active: 0, pending: 0, roi: 0 };
        const relevant = projects.filter(p => p.submitterId === user.id || p.managerId === user.id || user.role === 'Admin');
        return {
            total: relevant.length,
            active: relevant.filter(p => p.status === PROJECT_STATUS.ACTIVE).length,
            pending: relevant.filter(p => p.status === PROJECT_STATUS.PENDING && p.managerId === user.id).length,
            roi: relevant.reduce((acc, p) => acc + (p.actualRoi || 0), 0)
        };
    }, [projects, user]);

    const handleSwitchUser = () => {
        if (users.length === 0) return;
        const currentIndex = users.findIndex(u => u.id === user.id);
        const nextIndex = (currentIndex + 1) % users.length;
        setUser(users[nextIndex]);
    };

    const addProject = async (formData, isDraft) => {
        const newProject = {
            ...formData,
            id: `p${Date.now()}`,
            submitterId: user.id,
            createdAt: new Date().toISOString().split('T')[0],
            status: isDraft ? PROJECT_STATUS.DRAFT : PROJECT_STATUS.PENDING,
            history: [{
                date: new Date().toISOString().split('T')[0],
                user: user.name,
                action: isDraft ? 'Draft Created' : 'Submitted',
                note: isDraft ? 'Saved initiative as draft' : 'Initial baseline submitted'
            }],
            actualInvestment: null,
            actualRoi: null,
            estimatedBenefit: parseFloat(formData.estimatedBenefit) || 0
        };

        try {
            await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProject)
            });
            await fetchData(); // Refresh data from server
        } catch (error) {
            console.error('Failed to add project:', error);
        }
    };

    const updateProjectStatus = async (projectId, newStatus, comment) => {
        try {
            await fetch(`${API_BASE}/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    user: user.name,
                    action: newStatus,
                    note: comment
                })
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const updateProject = async (projectId, updates) => {
        try {
            await fetch(`${API_BASE}/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updates,
                    user: user.name,
                    action: updates.status === PROJECT_STATUS.DRAFT ? 'Saved as Draft' : 'Resubmitted',
                    note: 'Updated after rework feedback'
                })
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to update project:', error);
        }
    };

    const closeProject = async (projectId, investment, roi) => {
        const investmentVal = parseFloat(investment);
        const roiVal = parseFloat(roi);

        if (isNaN(investmentVal) || isNaN(roiVal)) return;

        try {
            await fetch(`${API_BASE}/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: PROJECT_STATUS.CLOSED,
                    actualInvestment: investmentVal,
                    actualRoi: roiVal,
                    user: user.name,
                    action: 'Closed',
                    note: 'Final financials submitted'
                })
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to close project:', error);
        }
    };

    const deleteProjects = async (ids) => {
        try {
            await fetch(`${API_BASE}/projects/batch-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to delete projects:', error);
        }
    };



    const batchUpdateStatus = async (ids, status, note) => {
        try {
            await fetch(`${API_BASE}/projects/batch-update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids,
                    status,
                    user: user.name,
                    note: note || `Bulk status update to ${status}`
                })
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to batch update status:', error);
        }
    };

    return {
        user: user || { name: 'Loading...', role: 'Employee' },
        projects,
        stats,
        loading,
        handleSwitchUser,
        addProject,
        updateProject,
        updateProjectStatus,
        closeProject,
        deleteProjects,
        batchUpdateStatus
    };
}
