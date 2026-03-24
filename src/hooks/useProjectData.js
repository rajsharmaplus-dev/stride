import { useState, useMemo, useEffect, useCallback } from 'react';
import { PROJECT_STATUS } from '../constants/projectConstants';

const API_BASE = '/api';

/**
 * Consolidated API helper with unified error handling
 */
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

export function useProjectData() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [uData, pData] = await Promise.all([
                fetchApi('/users'),
                fetchApi('/projects')
            ]);
            
            setUsers(uData);
            setProjects(pData);
            
            // Set initial user if not set
            if (!user && uData.length > 0) {
                setUser(uData[0]);
            }
        } catch (error) {
            // Error logged by fetchApi
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
            await fetchApi('/projects', {
                method: 'POST',
                body: JSON.stringify(newProject)
            });
            await fetchData();
            return true;
        } catch (error) {
            return false;
        }
    };

    const updateProjectStatus = async (projectId, newStatus, comment) => {
        try {
            await fetchApi(`/projects/${projectId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus,
                    user: user.name,
                    action: newStatus,
                    note: comment
                })
            });
            await fetchData();
            return true;
        } catch (error) {
            return false;
        }
    };

    const updateProject = async (projectId, updates) => {
        try {
            await fetchApi(`/projects/${projectId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    ...updates,
                    user: user.name,
                    action: updates.status === PROJECT_STATUS.DRAFT ? 'Saved as Draft' : 'Resubmitted',
                    note: 'Updated after rework feedback'
                })
            });
            await fetchData();
            return true;
        } catch (error) {
            return false;
        }
    };

    const closeProject = async (projectId, investment, roi) => {
        const investmentVal = parseFloat(investment);
        const roiVal = parseFloat(roi);

        if (isNaN(investmentVal) || isNaN(roiVal)) return false;

        try {
            await fetchApi(`/projects/${projectId}`, {
                method: 'PATCH',
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
            return true;
        } catch (error) {
            return false;
        }
    };

    const deleteProjects = async (ids) => {
        try {
            await fetchApi('/projects/batch-delete', {
                method: 'POST',
                body: JSON.stringify({ ids })
            });
            await fetchData();
            return true;
        } catch (error) {
            return false;
        }
    };

    const batchUpdateStatus = async (ids, status, note) => {
        try {
            await fetchApi('/projects/batch-update-status', {
                method: 'POST',
                body: JSON.stringify({
                    ids,
                    status,
                    user: user.name,
                    note: note || `Bulk status update to ${status}`
                })
            });
            await fetchData();
            return true;
        } catch (error) {
            return false;
        }
    };

    const batchUpdateProjects = async (ids, updates, action, note) => {
        try {
            await fetchApi('/projects/batch-update', {
                method: 'POST',
                body: JSON.stringify({
                    ids,
                    updates,
                    user: user.name,
                    action,
                    note: note || `Bulk update: ${Object.keys(updates).join(', ')}`
                })
            });
            await fetchData();
            return true;
        } catch (error) {
            return false;
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
        batchUpdateStatus,
        batchUpdateProjects
    };
}
