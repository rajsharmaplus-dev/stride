import { useState, useMemo, useCallback } from 'react';
import { exportProjectsToCSV } from '../utils/csvExport';
import { PROJECT_STATUS } from '../constants/projectConstants';

/**
 * Extracts all bulk-action handlers, project-lifecycle handlers, and derived
 * permission booleans out of StrideAppContext into a focused hook.
 *
 * Owns state: isSubmitting, confirmModal, editingProject, showReassignModal
 */
export function useAppHandlers({
    user,
    users,
    projects,
    selectedIds,
    setSelectedIds,
    setToast,
    addProject,
    updateProject,
    updateProjectStatus,
    closeProject,
    deleteProjects,
    batchUpdateStatus,
    batchUpdateProjects,
    triggerRefresh,
    navigate,
}) {
    const [isSubmitting, setIsSubmitting]       = useState(false);
    const [confirmModal, setConfirmModal]       = useState(null);
    const [editingProject, setEditingProject]   = useState(null);
    const [showReassignModal, setShowReassignModal] = useState(false);

    // Derived: projects that are currently checked in the table
    const selectedProjects = useMemo(
        () => projects.filter(p => selectedIds.includes(p.id)),
        [projects, selectedIds]
    );

    // --- Permission booleans (previously computed inline in StrideAppContext) ---
    const hasDraft   = selectedProjects.some(p => p.status === PROJECT_STATUS.DRAFT);
    const hasPending = selectedProjects.some(p => p.status === PROJECT_STATUS.PENDING);
    const hasActive  = selectedProjects.some(p => p.status === PROJECT_STATUS.ACTIVE);

    const allDeletableStatus = selectedProjects.every(p =>
        p.status === PROJECT_STATUS.DRAFT ||
        p.status === PROJECT_STATUS.PENDING ||
        p.status === PROJECT_STATUS.REWORK
    );

    const canSubmit   = hasDraft && selectedProjects.every(p => p.submitterId === user?.id || user?.role === 'Admin');
    const canApprove  = (user?.role === 'Manager' || user?.role === 'Admin') && hasPending;
    const canDelete   = (user?.role === 'Manager' || user?.role === 'Admin') ||
                        (allDeletableStatus && selectedProjects.every(p => p.submitterId === user?.id));
    const canClose    = hasActive && selectedProjects.every(p => p.submitterId === user?.id || user?.role === 'Admin');
    const canReassign = user?.role === 'Manager' || user?.role === 'Admin';

    // -------------------------------------------------------------------------
    // Project lifecycle handlers
    // -------------------------------------------------------------------------
    const handleEditProject = useCallback((project) => {
        setEditingProject(project);
        navigate('/submit');
    }, [navigate]);

    const handleFormSubmit = useCallback(async (formData, isDraft) => {
        let result = { success: false };
        if (editingProject) {
            result = await updateProject(editingProject.id, {
                ...formData,
                status: isDraft ? PROJECT_STATUS.DRAFT : PROJECT_STATUS.PENDING,
            });
            setEditingProject(null);
        } else {
            result = await addProject(formData, isDraft);
        }

        if (result.success) {
            setToast({ message: isDraft ? 'Draft saved successfully' : 'Project submitted for review', type: 'success' });
            navigate('/dashboard');
        } else if (result.isNotFound) {
            setToast({ message: 'This project was deleted by another user.', type: 'error' });
            navigate('/dashboard');
        } else {
            setToast({ message: result.error || 'Operation failed. Please check inputs.', type: 'error' });
        }
    }, [editingProject, addProject, updateProject, setToast, navigate]);

    const handleUpdateStatus = useCallback(async (id, status, comment) => {
        const result = await updateProjectStatus(id, status, comment);
        if (result.success) {
            setToast({ message: `Project ${status} successfully`, type: 'success' });
            navigate('/dashboard');
        } else if (result.isNotFound) {
            setToast({ message: 'This project was deleted by another user.', type: 'error' });
            navigate('/dashboard');
        } else {
            setToast({ message: result.error || 'Status update failed', type: 'error' });
        }
    }, [updateProjectStatus, setToast, navigate]);

    const handleCloseProject = useCallback(async (id, investment, roi) => {
        const result = await closeProject(id, investment, roi);
        if (result.success) {
            setToast({ message: 'Project closed with final financials', type: 'success' });
            navigate('/dashboard');
        } else if (result.isNotFound) {
            setToast({ message: 'This project was deleted by another user.', type: 'error' });
            navigate('/dashboard');
        } else {
            setToast({ message: result.error || 'Failed to close project', type: 'error' });
        }
    }, [closeProject, setToast, navigate]);

    // -------------------------------------------------------------------------
    // Bulk action handlers
    // -------------------------------------------------------------------------
    const handleBulkExport = useCallback(() => {
        exportProjectsToCSV(selectedProjects);
    }, [selectedProjects]);

    const handleBulkDelete = useCallback(() => {
        const eligibleIds = selectedProjects
            .filter(p =>
                (user?.role === 'Manager' || user?.role === 'Admin') ||
                (p.submitterId === user?.id &&
                    (p.status === PROJECT_STATUS.DRAFT ||
                     p.status === PROJECT_STATUS.PENDING ||
                     p.status === PROJECT_STATUS.REWORK))
            )
            .map(p => p.id);

        if (eligibleIds.length === 0) return;

        setConfirmModal({
            message: `Permanently delete ${eligibleIds.length} project${eligibleIds.length !== 1 ? 's' : ''}? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(null);
                const result = await deleteProjects(eligibleIds);
                if (result.success) {
                    setToast({ message: `Deleted ${eligibleIds.length} projects`, type: 'success' });
                    setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
                } else {
                    setToast({ message: result.error || 'Bulk deletion failed', type: 'error' });
                    triggerRefresh();
                }
            },
        });
    }, [selectedProjects, user, deleteProjects, setToast, setSelectedIds, triggerRefresh]);

    const handleBulkApprove = useCallback(async () => {
        if (isSubmitting) return;
        const eligibleIds = selectedProjects
            .filter(p => (user?.role === 'Manager' || user?.role === 'Admin') && p.status === PROJECT_STATUS.PENDING)
            .map(p => p.id);
        if (eligibleIds.length === 0) return;

        setIsSubmitting(true);
        try {
            const result = await batchUpdateStatus(eligibleIds, PROJECT_STATUS.ACTIVE, 'Bulk approval from dashboard');
            if (result.success) {
                setToast({ message: `Approved ${eligibleIds.length} projects`, type: 'success' });
                setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
            } else {
                setToast({ message: result.error || 'Bulk approval failed', type: 'error' });
                triggerRefresh();
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, selectedProjects, user, batchUpdateStatus, setToast, setSelectedIds, triggerRefresh]);

    const handleBulkDecline = useCallback(async () => {
        if (isSubmitting) return;
        const eligibleIds = selectedProjects
            .filter(p => (user?.role === 'Manager' || user?.role === 'Admin') && p.status === PROJECT_STATUS.PENDING)
            .map(p => p.id);
        if (eligibleIds.length === 0) return;

        setIsSubmitting(true);
        try {
            const result = await batchUpdateStatus(eligibleIds, PROJECT_STATUS.DECLINED, 'Bulk decline from dashboard');
            if (result.success) {
                setToast({ message: `Declined ${eligibleIds.length} projects`, type: 'success' });
                setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
            } else {
                setToast({ message: result.error || 'Bulk decline failed', type: 'error' });
                triggerRefresh();
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, selectedProjects, user, batchUpdateStatus, setToast, setSelectedIds, triggerRefresh]);

    // Bulk close is intentionally disabled — each project needs individual financials
    const handleBulkClose = useCallback(() => {
        setToast({ message: 'To close a project, open it individually to enter final financials.', type: 'info' });
    }, [setToast]);

    const handleBulkSubmit = useCallback(async () => {
        if (isSubmitting) return;
        const eligibleIds = selectedProjects
            .filter(p => p.submitterId === user?.id && p.status === PROJECT_STATUS.DRAFT)
            .map(p => p.id);
        if (eligibleIds.length === 0) return;

        setIsSubmitting(true);
        try {
            const result = await batchUpdateStatus(eligibleIds, PROJECT_STATUS.PENDING, 'Bulk submission from dashboard');
            if (result.success) {
                setToast({ message: `Submitted ${eligibleIds.length} projects`, type: 'success' });
                setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
            } else {
                setToast({ message: result.error || 'Bulk submission failed', type: 'error' });
                triggerRefresh();
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, selectedProjects, user, batchUpdateStatus, setToast, setSelectedIds, triggerRefresh]);

    // Opens the ReassignModal (replaces window.prompt)
    const handleBulkAssign = useCallback(() => {
        if (isSubmitting || (user?.role !== 'Manager' && user?.role !== 'Admin')) return;
        setShowReassignModal(true);
    }, [isSubmitting, user]);

    // Called by ReassignModal on confirm with the chosen managerId
    const handleReassignConfirm = useCallback(async (newManagerId) => {
        setShowReassignModal(false);
        if (!newManagerId || !users.some(u => u.id === newManagerId)) return;
        setIsSubmitting(true);
        try {
            const result = await batchUpdateProjects(selectedIds, { manager_id: newManagerId }, 'Reassign', `Bulk reassigned to ${newManagerId}`);
            if (result.success) {
                setToast({ message: 'Projects successfully reassigned', type: 'success' });
                setSelectedIds([]);
            } else {
                setToast({ message: result.error || 'Reassignment failed', type: 'error' });
                triggerRefresh();
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedIds, users, batchUpdateProjects, setToast, setSelectedIds, triggerRefresh]);

    return {
        // State
        isSubmitting,
        confirmModal, setConfirmModal,
        editingProject, setEditingProject,
        showReassignModal, setShowReassignModal,
        selectedProjects,
        // Permission flags
        canSubmit, canApprove, canDelete, canClose, canReassign,
        // Handlers
        handleEditProject,
        handleFormSubmit,
        handleUpdateStatus,
        handleCloseProject,
        handleBulkExport,
        handleBulkDelete,
        handleBulkApprove,
        handleBulkDecline,
        handleBulkClose,
        handleBulkSubmit,
        handleBulkAssign,
        handleReassignConfirm,
    };
}
