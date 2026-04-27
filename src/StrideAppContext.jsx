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
import { useAppHandlers } from './hooks/useAppHandlers';
import { ROLE_THEME, PROJECT_STATUS } from './constants/projectConstants';
import { BulkActionBar, Toast, NotificationBell, ConfirmModal, ReassignModal } from './components/Common';
import { ChevronRight, PlusCircle, LogOut } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Layout / UI state (stays here — it's pure view concern)
  const [selectedIds, setSelectedIds]           = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning]   = useState(false);
  const [toast, setToast]                       = useState(null);
  const transitionTimer = useRef(null);

  // Data + server actions
  const {
    user, users, projects, stats,
    login, logout, authError,
    addProject, updateProject, updateProjectStatus,
    closeProject, deleteProjects, batchUpdateStatus, batchUpdateProjects,
    fetchComments, addComment,
    updateUserRole, updateUserStatus, deleteUser,
    loadMore, triggerRefresh, loading,
    notifications, unreadCount, markRead, markAllRead,
  } = useProjectManager();

  // All handlers + modal state + permission flags
  const {
    isSubmitting,
    confirmModal, setConfirmModal,
    editingProject, setEditingProject,
    showReassignModal,
    canSubmit, canApprove, canDelete, canClose, canReassign,
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
  } = useAppHandlers({
    user, users, projects, selectedIds, setSelectedIds, setToast,
    addProject, updateProject, updateProjectStatus, closeProject,
    deleteProjects, batchUpdateStatus, batchUpdateProjects,
    triggerRefresh, navigate,
  });

  const view = location.pathname.substring(1) || 'dashboard';
  const safeUser = user || { role: 'Employee' };
  const theme = ROLE_THEME[safeUser.role] || ROLE_THEME['Employee'];

  // Derive selectedProjectId directly from the URL — no state needed
  const selectedProjectId = useMemo(() => {
    const parts = location.pathname.split('/');
    return parts[1] === 'details' && parts[2] ? parts[2] : null;
  }, [location.pathname]);

  // Auth guard
  useEffect(() => {
    if (!user && !loading && location.pathname !== '/login') navigate('/login');
    if (user && location.pathname === '/login')              navigate('/dashboard');
  }, [location.pathname, user, loading, navigate]);

  // Always derive selectedProject from live projects array (avoids stale state)
  const selectedProject = useMemo(() =>
    selectedProjectId ? (projects.find(p => p.id === selectedProjectId) || null) : null,
    [selectedProjectId, projects]
  );

  // Role-filtered project list for the current route
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

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="relative w-24 h-1 bg-slate-100 overflow-hidden mb-6 rounded-full">
          <div className="absolute top-0 left-0 h-full bg-[#F05A28] animate-loading-bar" />
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

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
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

        {/* Desktop header */}
        <header className="hidden lg:flex sticky top-0 z-40 h-14 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-8 no-print">
          <div className="flex items-center gap-4 text-slate-400">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">System Engine</h2>
            <ChevronRight size={14} />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">
              {location.pathname.substring(1) || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
              onNavigate={navigate}
            />
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-[#F05A28] transition-colors rounded-lg hover:bg-slate-50">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-white/70 hover:text-white flex flex-col gap-1">
              <div className="w-5 h-0.5 bg-current" />
              <div className="w-5 h-0.5 bg-current" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Stride" className="w-5 h-5 object-contain" />
              <span className="text-sm font-black tracking-tighter italic font-display uppercase">STRIDE</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
              onNavigate={navigate}
            />
            <button onClick={handleLogout} className="p-2 text-white/50 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <Dashboard
                user={user} projects={displayProjects} totalCount={displayProjects.length}
                onLoadMore={loadMore} stats={stats} theme={theme}
                onSelectProject={p => navigate(`/details/${p?.id}`)}
                onEditProject={handleEditProject}
                onCardClick={v => navigate(`/${v}`)}
                setView={v => navigate(`/${v}`)}
                onSelectionChange={setSelectedIds} selectedIds={selectedIds}
                viewContext={null}
              />
            } />

            <Route path="/review" element={
              <Dashboard
                user={user} stats={stats} projects={displayProjects} totalCount={displayProjects.length}
                onLoadMore={() => { }}
                onSelectProject={p => navigate(`/details/${p?.id}`)}
                setView={v => navigate(`/${v}`)}
                onCardClick={v => navigate(`/${v}`)}
                onSelectionChange={setSelectedIds} selectedIds={selectedIds}
                viewContext="review"
              />
            } />

            <Route path="/closure" element={
              <Dashboard
                user={user} stats={stats} projects={displayProjects} totalCount={displayProjects.length}
                onLoadMore={() => { }}
                onSelectProject={p => navigate(`/details/${p?.id}`)}
                setView={v => navigate(`/${v}`)}
                onCardClick={v => navigate(`/${v}`)}
                onSelectionChange={setSelectedIds} selectedIds={selectedIds}
                viewContext="closure"
              />
            } />

            <Route path="/submit" element={
              <SubmissionForm
                user={user} users={users}
                onSubmit={handleFormSubmit}
                onBack={() => { navigate('/dashboard'); setEditingProject(null); }}
                initialData={editingProject}
              />
            } />

            <Route path="/guide" element={<UserGuide />} />

            <Route path="/governance" element={
              <Governance projects={projects} onSelectProject={p => navigate(`/details/${p?.id}`)} />
            } />

            <Route path="/people" element={
              user?.role === 'Admin' ? (
                <PeopleManagement
                  currentUser={user} users={users}
                  onUpdateRole={updateUserRole}
                  onUpdateStatus={updateUserStatus}
                  onDeleteUser={deleteUser}
                />
              ) : <Navigate to="/dashboard" replace />
            } />

            <Route path="/details/:id" element={
              <ProjectDetails
                project={selectedProject} user={user} users={users}
                onBack={() => navigate(-1)}
                onUpdateStatus={handleUpdateStatus}
                onCloseProject={handleCloseProject}
                onEditAndResubmit={handleEditProject}
                fetchComments={fetchComments}
                addComment={addComment}
              />
            } />

            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {/* Bulk action toolbar */}
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

      {/* Employee FAB */}
      {user?.role === 'Employee' && view === 'dashboard' && (
        <button
          onClick={() => navigate('/submit')}
          className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[60] group flex items-center gap-3 text-white pl-5 pr-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 animate-slide-up"
          style={{
            background: `linear-gradient(135deg, ${theme?.accent || '#F05A28'}, ${theme?.accent || '#F05A28'}dd)`,
            boxShadow: `0 12px 32px ${theme?.accentShadow || 'rgba(240, 90, 40, 0.2)'}`,
          }}
        >
          <div className="bg-white/20 p-1.5 rounded-xl group-hover:rotate-90 transition-transform duration-500">
            <PlusCircle size={18} />
          </div>
          <span className="hidden sm:inline">Launch Initiative</span>
          <span className="sm:hidden">New</span>
        </button>
      )}

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm modal (delete / destructive actions) */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Reassign modal (replaces window.prompt) */}
      {showReassignModal && (
        <ReassignModal
          users={users}
          onConfirm={handleReassignConfirm}
          onCancel={() => { }}
        />
      )}
    </div>
  );
}
