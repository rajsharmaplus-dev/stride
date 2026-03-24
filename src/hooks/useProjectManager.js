import { useState, useMemo, useEffect, useCallback } from 'react';
import { PROJECT_STATUS } from '../constants/projectConstants';

const API_BASE = '/api';

/**
 * Consolidated API helper with unified error handling and identity headers
 */
async function fetchApi(endpoint, options = {}, userRole = null, userId = null) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(userRole && { 'X-User-Role': userRole }),
            ...(userId && { 'X-User-Id': userId })
        },
    };

    try {
        const response = await fetch(url, { 
            ...options, 
            headers: { ...defaultOptions.headers, ...options.headers } 
        });

        // 1. Handle Rate Limiting (429) Specifically
        if (response.status === 429) {
            const error = new Error('You have reached the request limit. Please wait 15 minutes before trying again.');
            error.isRateLimit = true;
            throw error;
        }

        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!response.ok) {
            // Attempt to get server error message if JSON, else use generic status
            const errorData = isJson ? await response.json().catch(() => ({})) : {};
            throw new Error(errorData.error || `Server Error: ${response.status} ${response.statusText}`);
        }

        // 2. Safe JSON Parsing
        if (isJson) {
            return await response.json();
        }
        
        return null; // For 204 No Content or non-JSON success
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Network connection error. Please check your internet or server status.');
        }
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

export function useProjectManager() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(20);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (currentLimit = limit) => {
        try {
            // 1. Fetch users first (public endpoint)
            const uData = await fetchApi('/users', {}, user?.role, user?.id);
            setUsers(uData || []);
            
            // 2. Identify current user (existing or first available)
            let currentUser = user;
            if (!user && uData?.length > 0) {
                currentUser = uData[0];
                setUser(currentUser);
            }

            // 3. Only fetch projects if identity is established
            if (currentUser) {
                const pData = await fetchApi(`/projects?limit=${currentLimit}`, {}, currentUser.role, currentUser.id);
                setProjects(pData?.items || []);
                setTotalCount(pData?.total || 0);
            }
        } catch (error) {
            // Error logged by fetchApi
        } finally {
            setLoading(false);
        }
    }, [user, limit]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const loadMore = () => {
        const nextLimit = limit + 20;
        setLimit(nextLimit);
        fetchData(nextLimit);
    };

    const triggerRefresh = () => {
        fetchData();
    };

    const stats = useMemo(() => {
        if (!user) return { total: 0, active: 0, pending: 0, roi: 0 };
        const relevant = projects.filter(p => p?.submitterId === user?.id || p?.managerId === user?.id || user?.role === 'Admin');
        return {
            total: relevant.length,
            active: relevant.filter(p => p?.status === PROJECT_STATUS.ACTIVE).length,
            pending: relevant.filter(p => p?.status === PROJECT_STATUS.PENDING && p?.managerId === user?.id).length,
            roi: relevant.reduce((acc, p) => acc + (p?.actualRoi || 0), 0)
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
            }, user?.role, user?.id);
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
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
            }, user?.role, user?.id);
            await fetchData();
            return { success: true };
        } catch (error) {
            const isNotFound = error.message.includes('404');
            return { success: false, error: error.message, isNotFound };
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
            }, user?.role, user?.id);
            await fetchData();
            return { success: true };
        } catch (error) {
            const isNotFound = error.message.includes('404');
            return { success: false, error: error.message, isNotFound };
        }
    };

    const closeProject = async (projectId, investment, roi) => {
        const investmentVal = parseFloat(investment);
        const roiVal = parseFloat(roi);

        if (isNaN(investmentVal) || isNaN(roiVal)) return { success: false, error: 'Invalid financials' };

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
            }, user?.role, user?.id);
            await fetchData();
            return { success: true };
        } catch (error) {
            const isNotFound = error.message.includes('404');
            return { success: false, error: error.message, isNotFound };
        }
    };

    const deleteProjects = async (ids) => {
        try {
            await fetchApi('/projects/batch-delete', {
                method: 'POST',
                body: JSON.stringify({ ids })
            }, user?.role, user?.id);
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
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
            }, user?.role, user?.id);
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
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
            }, user?.role, user?.id);
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const fetchComments = async (projectId) => {
        try {
            return await fetchApi(`/projects/${projectId}/comments`, {}, user?.role, user?.id);
        } catch (error) {
            const isNotFound = error.message.includes('404');
            return { error: error.message, isNotFound };
        }
    };

    const addComment = async (projectId, text) => {
        try {
            await fetchApi('/comments', {
                method: 'POST',
                body: JSON.stringify({
                    projectId,
                    userId: user?.id,
                    userName: user?.name,
                    text
                })
            }, user?.role, user?.id);
            return { success: true };
        } catch (error) {
            const isNotFound = error.message.includes('404');
            return { success: false, error: error.message, isNotFound };
        }
    };

    return {
        user: user || { name: 'Loading...', role: 'Employee' },
        projects,
        totalCount,
        stats,
        loading,
        handleSwitchUser,
        addProject,
        updateProject,
        updateProjectStatus,
        closeProject,
        deleteProjects,
        batchUpdateStatus,
        batchUpdateProjects,
        fetchComments,
        addComment,
        loadMore,
        triggerRefresh
    };
}
