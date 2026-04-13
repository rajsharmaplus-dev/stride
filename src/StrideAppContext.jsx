import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SubmissionForm } from './components/Forms/SubmissionForm';
import { ProjectDetails } from './components/Projects/ProjectDetails';
import { LoginPage } from './components/Auth/LoginPage';
import { UserGuide } from './components/Help/UserGuide';
import { Governance } from './components/Administration/Governance';
import { PeopleManagement } from './components/Administration/PeopleManagement';
import { useProjectManager } from './hooks/useProjectManager';
import { ROLE_THEME, PROJECT_STATUS } from './constants/projectConstants';
import { BulkActionBar, Toast } from './components/Common';
import { ChevronRight, PlusCircle, LogOut } from 'lucide-react';
import { exportProjectsToCSV } from './utils/csvExport';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }
  const transitionTimer = useRef(null);

  const {
    user,
    users,
    projects,
    totalCount,
    stats,
    login,
    logout,
    authError,
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
    loading
  } = useProjectManager();

  const view = location.pathname.substring(1) || 'dashboard';

  // [CACHE BUSTER 2026-03-23] Guaranteed fallback to prevent null reference
  const safeUser = user || { role: 'Employee' };
  const theme = ROLE_THEME[safeUser.role] || ROLE_THEME['Employee'];

  // Derive selectedProjectId from URL if in /details/:id
  useEffect(() => {
    if (!user && !loading && location.pathname !== '/login') {
      navigate('/login');
    }
    if (user && location.pathname === '/login') {
      navigate('/dashboard');
    }

    const parts = location.pathname.split('/');
    if (parts[1] === 'details' && parts[2]) {
      setSelectedProjectId(parts[2]);
    } else {
      setSelectedProjectId(null);
    }
  }, [location, user, loading, navigate]);

  // Always derive selectedProject from projects array → fixes stale state (B-03)
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  // Filter projects for the current view
  const displayProjects = projects.filter(p => {
    if (!user) return false;
    if (view === 'review') return p.status === PROJECT_STATUS.PENDING && p.managerId === user?.id;
    if (view === 'closure') {
        if (user?.role === 'Admin') return p.status === PROJECT_STATUS.ACTIVE;
        if (user?.role === 'Manager') return p.status === PROJECT_STATUS.ACTIVE && p.managerId === user?.id;
        return p.status === PROJECT_STATUS.ACTIVE && p.submitterId === user?.id;
    }
    return p.submitterId === user?.id || p.managerId === user?.id || user?.role === 'Admin';
  });

  const handleLogout = useCallback(async () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setIsTransitioning(true);
    await logout();
    navigate('/login');
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), 500);
  }, [logout, navigate]);

  const handleSelectProject = (project) => {
    navigate(`/details/${project?.id}`);
  };

  const handleFormSubmit = async (formData, isDraft) => {
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
      triggerRefresh();
      navigate('/dashboard');
    } else {
      setToast({ message: result.error || 'Operation failed. Please check inputs.', type: 'error' });
    }
  };

  const handleUpdateStatus = async (id, status, comment) => {
    const result = await updateProjectStatus(id, status, comment);
    if (result.success) {
      setToast({ message: `Project ${status} successfully`, type: 'success' });
      navigate('/dashboard');
    } else if (result.isNotFound) {
      setToast({ message: 'This project was deleted by another user.', type: 'error' });
      triggerRefresh();
      navigate('/dashboard');
    } else {
      setToast({ message: result.error || 'Status update failed', type: 'error' });
    }
  };

  const handleCloseProject = async (id, investment, roi) => {
    const result = await closeProject(id, investment, roi);
    if (result.success) {
      setToast({ message: 'Project closed with final financials', type: 'success' });
      navigate('/dashboard');
    } else if (result.isNotFound) {
      setToast({ message: 'This project was deleted by another user.', type: 'error' });
      triggerRefresh();
      navigate('/dashboard');
    } else {
      setToast({ message: result.error || 'Failed to close project', type: 'error' });
    }
  };

  // Rework resubmit: open the form pre-filled with project data (B-02)
  const handleEditAndResubmit = (project) => {
    setEditingProject(project);
    navigate('/submit');
  };

  // Rework resubmit / Edit: open the form pre-filled with project data
  const handleEditProject = (project) => {
    setEditingProject(project);
    navigate('/submit');
  };

  // Determine selected projects for bulk actions (must be above handlers that use it)
  const selectedProjects = useMemo(() => 
    projects.filter(p => selectedIds.includes(p.id)),
    [projects, selectedIds]
  );

  const handleBulkExport = () => {
    exportProjectsToCSV(selectedProjects);
  };

  const handleBulkDelete = async () => {
    const eligibleIds = selectedProjects
      .filter(p => 
        (user?.role === 'Manager' || user?.role === 'Admin') || 
        (p.submitterId === user?.id && (p.status === PROJECT_STATUS.DRAFT || p.status === PROJECT_STATUS.PENDING || p.status === PROJECT_STATUS.REWORK))
      )
      .map(p => p.id);

    if (eligibleIds.length === 0) return;

    // UX-04: Use in-app confirmation modal instead of window.confirm
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
      }
    });
  };

  const handleBulkApprove = async () => {
    if (isSubmitting) return;
    const eligibleIds = selectedProjects
      .filter(p => (user?.role === 'Manager' || user?.role === 'Admin') && p.status === PROJECT_STATUS.PENDING)
      .map(p => p.id);

    if (eligibleIds.length > 0) {
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
    }
  };

  const handleBulkDecline = async () => {
    if (isSubmitting) return;
    const eligibleIds = selectedProjects
      .filter(p => (user?.role === 'Manager' || user?.role === 'Admin') && p.status === PROJECT_STATUS.PENDING)
      .map(p => p.id);

    if (eligibleIds.length > 0) {
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
    }
  };

  // BUG-02: Bulk close disabled — closure requires per-project financials.
  // Users must open each Active project individually to enter investment/ROI data.
  const handleBulkClose = () => {
    setToast({ message: 'To close a project, open it individually to enter final financials.', type: 'info' });
  };

  const handleBulkSubmit = async () => {
    if (isSubmitting) return;
    const eligibleIds = selectedProjects
      .filter(p => p.submitterId === user?.id && p.status === PROJECT_STATUS.DRAFT)
      .map(p => p.id);

    if (eligibleIds.length > 0) {
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
    }
  };

  const handleBulkAssign = async () => {
    if (isSubmitting || (user?.role !== 'Manager' && user?.role !== 'Admin')) return;
    
    const managerList = users
      .filter(u => u.role === 'Manager' || u.role === 'Admin')
      .map(u => `${u.name} (ID: ${u.id})`)
      .join('\n');
      
    const newManagerId = window.prompt(`Select new reviewer ID:\n\n${managerList}`);
    
    if (newManagerId && users.some(u => u.id === newManagerId)) {
      setIsSubmitting(true);
      try {
        // BUG-04: was incorrectly calling batchUpdateStatus — now calls batchUpdateProjects
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
    }
  };


  // Determine which bulk actions to show based on user role and selection
  const hasDraft = selectedProjects.some(p => p.status === PROJECT_STATUS.DRAFT);
  const hasPending = selectedProjects.some(p => p.status === PROJECT_STATUS.PENDING);
  const hasActive = selectedProjects.some(p => p.status === PROJECT_STATUS.ACTIVE);
  const hasRework = selectedProjects.some(p => p.status === PROJECT_STATUS.REWORK);
  
  // A project is deletable if it is Draft, Pending, or Rework (not Active/Closed)
  const allDeletableStatus = selectedProjects.every(p => 
    p.status === PROJECT_STATUS.DRAFT || 
    p.status === PROJECT_STATUS.PENDING || 
    p.status === PROJECT_STATUS.REWORK
  );

  const canSubmit = hasDraft && selectedProjects.every(p => p.submitterId === user?.id || user?.role === 'Admin');
  const canApprove = (user?.role === 'Manager' || user?.role === 'Admin') && hasPending;
  
  // Managers/Admins can delete anything selected. 
  // Employees can delete projects they OWN if they are in a "pre-execution" state (Draft/Pending/Rework).
  const canDelete = (user?.role === 'Manager' || user?.role === 'Admin') || 
                    (allDeletableStatus && selectedProjects.every(p => p.submitterId === user?.id));

  const canClose = hasActive && 
                   selectedProjects.every(p => p.submitterId === user?.id || user?.role === 'Admin');

  const canReassign = (user?.role === 'Manager' || user?.role === 'Admin');


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="relative w-24 h-1 bg-slate-100 overflow-hidden mb-6 rounded-full">
          <div className="absolute top-0 left-0 h-full bg-[#F05A28] animate-loading-bar"></div>
        </div>
        <h2 className="text-3xl font-black text-black tracking-tighter mb-1 italic font-display">STRIDE</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Optimizing Portfolio...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={login} error={authError} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-slate-50 selection:bg-[#F05A28] selection:text-white ${isTransitioning ? 'role-transition' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - responsive behavior */}
      <div className={`fixed inset-y-0 left-0 z-[70] transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar 
          user={user} 
          activeView={view} 
          setView={(v) => { navigate(`/${v}`); setIsMobileMenuOpen(false); setEditingProject(null); }} 
          stats={stats}
          onLogout={handleLogout} 
        />
      </div>

      <main className="flex-1 min-w-0 flex flex-col relative">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 h-14 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-8 no-print">
          <div className="flex items-center gap-4 text-slate-400">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">System Engine</h2>
            <ChevronRight size={14} />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">{location.pathname.substring(1) || 'Dashboard'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-[#F05A28] transition-colors rounded-lg hover:bg-slate-50"
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* Mobile TopBar */}
        <header className="lg:hidden sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-slate-900 text-white no-print">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 -ml-2 text-white/70 hover:text-white flex flex-col gap-1"
                >
                    <div className="w-5 h-0.5 bg-current" />
                    <div className="w-5 h-0.5 bg-current" />
                    <div className="w-5 h-0.5 bg-current" />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Stride" className="w-5 h-5 object-contain" />
                    <span className="text-sm font-black tracking-tighter italic font-display uppercase">STRIDE</span>
                </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-white/50 hover:text-white">
                <LogOut size={18} />
            </button>
        </header>

        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <Dashboard
                user={user}
                projects={projects}
                totalCount={totalCount}
                onLoadMore={loadMore}
                stats={stats}
                theme={theme}
                onSelectProject={handleSelectProject}
                onEditProject={handleEditProject}
                onCardClick={(v) => navigate(`/${v}`)}
                setView={(v) => navigate(`/${v}`)}
                onSelectionChange={setSelectedIds}
                selectedIds={selectedIds}
                viewContext={null}
              />
            } />

            <Route path="/review" element={
              <Dashboard
                user={user}
                stats={stats}
                projects={displayProjects}
                totalCount={displayProjects.length}
                onLoadMore={() => {}}
                onSelectProject={handleSelectProject}
                setView={(v) => navigate(`/${v}`)}
                onCardClick={(v) => navigate(`/${v}`)}
                onSelectionChange={setSelectedIds}
                selectedIds={selectedIds}
                viewContext="review"
              />
            } />

            <Route path="/closure" element={
              <Dashboard
                user={user}
                stats={stats}
                projects={displayProjects}
                totalCount={displayProjects.length}
                onLoadMore={() => {}}
                onSelectProject={handleSelectProject}
                setView={(v) => navigate(`/${v}`)}
                onCardClick={(v) => navigate(`/${v}`)}
                onSelectionChange={setSelectedIds}
                selectedIds={selectedIds}
                viewContext="closure"
              />
            } />

            <Route path="/submit" element={
              <SubmissionForm
                user={user}
                users={users}
                onSubmit={handleFormSubmit}
                onBack={() => { navigate('/dashboard'); setEditingProject(null); }}
                initialData={editingProject}
              />
            } />

            <Route path="/guide" element={<UserGuide />} />

            <Route path="/governance" element={
              <Governance 
                projects={projects} 
                onSelectProject={handleSelectProject} 
              />
            } />

            <Route path="/people" element={
              user?.role === 'Admin' ? (
                <PeopleManagement 
                  currentUser={user}
                  users={users}
                  onUpdateRole={updateUserRole}
                  onUpdateStatus={updateUserStatus}
                  onDeleteUser={deleteUser}
                />
              ) : <Navigate to="/dashboard" replace />
            } />

            <Route path="/details/:id" element={
              <ProjectDetails
                project={selectedProject}
                user={user}
                users={users}
                onBack={() => navigate(-1)}
                onUpdateStatus={handleUpdateStatus}
                onCloseProject={handleCloseProject}
                onEditAndResubmit={handleEditAndResubmit}
                fetchComments={fetchComments}
                addComment={addComment}
              />
            } />

            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      <BulkActionBar 
        count={selectedIds.length}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
        onApprove={handleBulkApprove}
        onDecline={handleBulkDecline}
        onClose={handleBulkClose}
        onSubmit={handleBulkSubmit}
        onReassign={handleBulkAssign}
        theme={theme}
        isLoading={isSubmitting}
        showDelete={canDelete}
        showApproval={canApprove}
        showClosing={canClose}
        showSubmit={canSubmit}
        showReassign={canReassign}
      />

      {/* Floating Action Button for Employees (Dashboard Only) */}
      {user?.role === 'Employee' && view === 'dashboard' && (
        <button
          onClick={() => navigate('/submit')}
          className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[60] group flex items-center gap-3 bg-slate-900 text-white pl-5 pr-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 animate-slide-up"
          style={{ 
            background: `linear-gradient(135deg, ${theme?.accent || '#F05A28'}, ${theme?.accent || '#F05A28'}dd)`,
            boxShadow: `0 12px 32px ${theme?.accentShadow || 'rgba(240, 90, 40, 0.2)'}`
          }}
        >
          <div className="bg-white/20 p-1.5 rounded-xl group-hover:rotate-90 transition-transform duration-500">
            <PlusCircle size={18} />
          </div>
          <span className="hidden sm:inline">Launch Initiative</span>
          <span className="sm:hidden">New</span>
        </button>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* UX-04: In-app confirmation modal (replaces window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Confirm Action</p>
              <p className="text-slate-800 font-bold text-sm leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="btn-primary flex-1 !bg-red-600 border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
