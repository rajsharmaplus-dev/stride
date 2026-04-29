import React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { PROJECT_STATUS } from '../constants/projectConstants';

const API_BASE = `${import.meta.env.VITE_BASE_PATH || ''}/api`;


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

        if (response.status === 401) {
            const error = new Error('Session expired. Please log in again.');
            error.isUnauthorized = true;
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
    const [notifications, setNotifications] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(20);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // 1. Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            // Safety timeout: if checking sessions takes > 5s, 
            // force stop loading to show the login screen.
            const timeoutId = setTimeout(() => {
                setLoading(false);
            }, 5000);

            try {
                const data = await fetchApi('/auth/me');
                if (data?.user) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error('Session check failed:', err);
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const fetchData = useCallback(async (currentLimit = limit) => {
        if (!user) return; // Only fetch data if authenticated
        
        try {
            // Use allSettled so one failure (e.g. projects empty/error) doesn't kill the users load
            const [uRes, pRes] = await Promise.allSettled([
                fetchApi(user.role === 'Admin' ? '/users' : '/users/reviewers'),
                fetchApi(`/projects?limit=${currentLimit}`)
            ]);
            
            if (uRes.status === 'fulfilled') {
                setUsers(uRes.value || []);
            }
            
            if (pRes.status === 'fulfilled' && pRes.value) {
                setProjects(pRes.value.items || []);
                setTotalCount(pRes.value.total || 0);
            }
            return { success: true };
        } catch (error) {
            console.error('Fetch recovery required:', error);
            if (error.isUnauthorized) setUser(null);
            return { success: false, error };
        }
    }, [user, limit]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);

    // --- Notification polling ---
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const data = await fetchApi('/notifications');
            setNotifications(data || []);
        } catch (error) {
            // On failure, keep existing state — do NOT reset to empty (resilience)
            console.warn('Notification poll failed, retaining last state:', error.message);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [user, fetchNotifications]);

    const login = async (credential, existingUser = null) => {
        setAuthError(null);
        
        // If we already have the user (from dev-login), just set it
        if (existingUser) {
            setUser(existingUser);
            return { success: true };
        }

        if (!credential) {
            setAuthError('Missing login credentials');
            return { success: false, error: 'Missing credentials' };
        }

        try {
            const data = await fetchApi('/auth/google-login', {
                method: 'POST',
                body: JSON.stringify({ credential })
            });
            if (data.success) {
                setUser(data.user);
                return { success: true };
            }
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await fetchApi('/auth/logout', { method: 'POST' });
        } finally {
            setUser(null);
            setProjects([]);
            setUsers([]);
            setNotifications([]);
        }
    };

    const loadMore = () => {
        const nextLimit = limit + 20;
        setLimit(nextLimit);
        fetchData(nextLimit);
    };

    const triggerRefresh = () => {
        return fetchData();
    };

    const stats = useMemo(() => {
        if (!user) return { total: 0, active: 0, pending: 0, roi: 0 };
        const relevant = projects; // Backend already filters for user
        return {
            total: relevant.length,
            active: relevant.filter(p => p?.status === PROJECT_STATUS.ACTIVE).length,
            pending: relevant.filter(p => p?.status === PROJECT_STATUS.PENDING && p?.managerId === user?.id).length,
            roi: relevant.reduce((acc, p) => acc + (p?.actualRoi || 0), 0)
        };
    }, [projects, user]);

    const addProject = async (formData, isDraft) => {
        if (!user) return { success: false, error: 'User not initialized' };
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
            estimatedBenefit: Math.max(0, parseFloat(formData.estimatedBenefit) || 0)
        };

        try {
            await fetchApi('/projects', {
                method: 'POST',
                body: JSON.stringify(newProject)
            });
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
            });
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
            });
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
        if (investmentVal < 0 || roiVal < 0) return { success: false, error: 'Financials cannot be negative' };

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
            });
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
            });
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
            });
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const fetchComments = async (projectId) => {
        try {
            return await fetchApi(`/projects/${projectId}/comments`);
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
            });
            return { success: true };
        } catch (error) {
            const isNotFound = error.message.includes('404');
            return { success: false, error: error.message, isNotFound };
        }
    };
    
    const updateUserRole = async (userId, newRole) => {
        try {
            await fetchApi(`/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const updateUserStatus = async (userId, newStatus) => {
        try {
            await fetchApi(`/users/${userId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const deleteUser = async (userId) => {
        try {
            await fetchApi(`/users/${userId}`, {
                method: 'DELETE'
            });
            await fetchData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // --- Notification actions ---
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markRead = async (notificationId) => {
        // Optimistic update — flip immediately, revert on failure
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
        );
        try {
            await fetchApi(`/notifications/${notificationId}/read`, { method: 'PATCH' });
        } catch (error) {
            // Revert on failure
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: 0 } : n)
            );
        }
    };

    const markAllRead = async () => {
        const snapshot = notifications;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 }))); // optimistic
        try {
            await fetchApi('/notifications/read-all', { method: 'PATCH' });
        } catch (error) {
            setNotifications(snapshot); // revert on failure
        }
    };

    return {
        user,
        users,
        projects,
        totalCount,
        stats,
        loading,
        authError,
        login,
        logout,
        addProject,
        updateProject,
        updateProjectStatus,
        closeProject,
        deleteProjects,
        batchUpdateStatus,
        batchUpdateProjects,
        fetchComments,
        addComment,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        loadMore,
        triggerRefresh,
        notifications,
        unreadCount,
        fetchNotifications,
        markRead,
        markAllRead,
    };
}
