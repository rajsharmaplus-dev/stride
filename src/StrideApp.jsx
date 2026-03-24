import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SubmissionForm } from './components/Forms/SubmissionForm';
import { ProjectDetails } from './components/Projects/ProjectDetails';
import { UserGuide } from './components/Help/UserGuide';
import { Governance } from './components/Administration/Governance';
import { useProjectData } from './hooks/useProjectData';
import { ROLE_THEME, PROJECT_STATUS } from './constants/projectConstants';
import { BulkActionBar } from './components/Common';
import { ChevronRight, LayoutDashboard, FileText, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { exportProjectsToCSV } from './utils/csvExport';

export default function App() {
  const {
    user,
    users,
    projects,
    stats,
    handleSwitchUser,
    addProject,
    updateProject,
    updateProjectStatus,
    closeProject,
    deleteProjects,
    batchUpdateStatus,
    loading
  } = useProjectData();

  const [view, setView] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimer = useRef(null);

  // [CACHE BUSTER 2026-03-23] Guaranteed fallback to prevent null reference
  const safeUser = user || { role: 'Employee' };
  const theme = ROLE_THEME[safeUser.role] || ROLE_THEME['Employee'];

  // Always derive selectedProject from projects array → fixes stale state (B-03)
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  // Filter projects for the current view
  const displayProjects = projects.filter(p => {
    if (view === 'review') return p.managerId === user?.id && p.status === PROJECT_STATUS.PENDING;
    if (view === 'closure') return p.submitterId === user?.id && p.status === PROJECT_STATUS.ACTIVE;

    // Default dashboard filtering
    const isOwner = p.submitterId === user?.id;
    const isManager = p.managerId === user?.id;
    const isAdmin = user?.role === 'Admin';
    return isOwner || isManager || isAdmin;
  });

  // Trigger role-switch animation then call switch
  const handleSwitchWithTransition = useCallback(() => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setIsTransitioning(true);
    handleSwitchUser();
    setView('dashboard');
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), 500);
  }, [handleSwitchUser]);

  const handleSelectProject = (project) => {
    setSelectedProjectId(project.id);
    setView('details');
  };

  const handleFormSubmit = (formData, isDraft) => {
    if (editingProject) {
      // Rework resubmit: update existing project and change status
      updateProject(editingProject.id, {
        ...formData,
        status: isDraft ? PROJECT_STATUS.DRAFT : PROJECT_STATUS.PENDING,
      });
      setEditingProject(null);
    } else {
      addProject(formData, isDraft);
    }
    setView('dashboard');
  };

  const handleUpdateStatus = (id, status, comment) => {
    updateProjectStatus(id, status, comment);
    setView('dashboard');
  };

  const handleCloseProject = (id, investment, roi) => {
    closeProject(id, investment, roi);
    setView('dashboard');
  };

  // Rework resubmit: open the form pre-filled with project data (B-02)
  const handleEditAndResubmit = (project) => {
    setEditingProject(project);
    setView('submit');
  };

  // Rework resubmit / Edit: open the form pre-filled with project data
  const handleEditProject = (project) => {
    setEditingProject(project);
    setView('submit');
  };

  const handleBulkExport = () => {
    const selectedProjects = projects.filter(p => selectedIds.includes(p.id));
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

    if (confirm(`Are you sure you want to delete ${eligibleIds.length} projects?`)) {
      await deleteProjects(eligibleIds);
      setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    }
  };

  const handleBulkApprove = async () => {
    const eligibleIds = selectedProjects
      .filter(p => (user?.role === 'Manager' || user?.role === 'Admin') && p.status === PROJECT_STATUS.PENDING)
      .map(p => p.id);

    if (eligibleIds.length > 0) {
      await batchUpdateStatus(eligibleIds, PROJECT_STATUS.ACTIVE, 'Bulk approval from dashboard');
      setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    }
  };

  const handleBulkDecline = async () => {
    const eligibleIds = selectedProjects
      .filter(p => (user?.role === 'Manager' || user?.role === 'Admin') && p.status === PROJECT_STATUS.PENDING)
      .map(p => p.id);

    if (eligibleIds.length > 0) {
      await batchUpdateStatus(eligibleIds, PROJECT_STATUS.DECLINED, 'Bulk decline from dashboard');
      setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    }
  };

  const handleBulkClose = async () => {
    const eligibleIds = selectedProjects
      .filter(p => p.submitterId === user?.id && p.status === PROJECT_STATUS.ACTIVE)
      .map(p => p.id);

    if (eligibleIds.length > 0) {
      await batchUpdateStatus(eligibleIds, PROJECT_STATUS.CLOSED, 'Bulk closure from dashboard');
      setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    }
  };

  const handleBulkSubmit = async () => {
    const eligibleIds = selectedProjects
      .filter(p => p.submitterId === user?.id && p.status === PROJECT_STATUS.DRAFT)
      .map(p => p.id);

    if (eligibleIds.length > 0) {
      await batchUpdateStatus(eligibleIds, PROJECT_STATUS.PENDING, 'Bulk submission from dashboard');
      setSelectedIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    }
  };

  const handleBulkAssign = async () => {
    if (user?.role !== 'Manager' && user?.role !== 'Admin') return;
    
    // Simple POC: prompt for manager ID
    const managerList = users
      .filter(u => u.role === 'Manager' || u.role === 'Admin')
      .map(u => `${u.name} (ID: ${u.id})`)
      .join('\n');
      
    const newManagerId = window.prompt(`Select new reviewer ID:\n\n${managerList}`);
    
    if (newManagerId && users.some(u => u.id === newManagerId)) {
      await batchUpdateProjects(selectedIds, { manager_id: newManagerId }, 'Reassign', `Bulk reassigned to ${newManagerId}`);
      setSelectedIds([]);
    }
  };



  // Determine which bulk actions to show based on user role and selection
  const selectedProjects = useMemo(() => 
    projects.filter(p => selectedIds.includes(p.id)),
    [projects, selectedIds]
  );

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 italic">STRIDE</h2>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Initializing Secure Database...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 mb-6">
            <span className="text-red-500 font-black tracking-widest uppercase text-xs">Connection Error</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 italic">STRIDE</h2>
        <p className="text-sm font-medium text-slate-500 max-w-sm mt-2">Unable to connect to the backend server or load the user profile.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-surface-50 ${isTransitioning ? 'role-transition' : ''}`}>
      <Sidebar
        user={user}
        activeView={view}
        setView={(v) => { setView(v); setEditingProject(null); }}
        stats={stats}
        onSwitchUser={handleSwitchWithTransition}
      />

      <main className="xl:pl-72 min-h-screen pb-32">
        {/* Mobile header — themed per role */}
        <header
          className="sticky top-0 z-10 px-8 py-5 flex justify-between items-center border-b xl:hidden"
          style={{
            backgroundColor: `${theme.sidebarBg.split(',')[0].replace('linear-gradient(160deg, ', '')}`,
            borderColor: `${theme.accent}20`
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white italic tracking-tighter">STRIDE</span>
          </div>
          <button
            onClick={() => handleSwitchWithTransition()}
            className="p-2 rounded-xl bg-white/10 text-white"
          >
            <ChevronRight size={18} />
          </button>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          {view === 'dashboard' && (
            <Dashboard
              user={user}
              projects={projects}
              stats={stats}
              theme={theme}
              onSelectProject={handleSelectProject}
              onEditProject={handleEditProject}
              onCardClick={(v) => setView(v)}
              onSelectionChange={setSelectedIds}
              selectedIds={selectedIds}
              viewContext={null}
            />
          )}


          {view === 'review' && (
            <Dashboard
              user={user}
              stats={stats}
              projects={displayProjects}
              onSelectProject={handleSelectProject}
              setView={setView}
              onCardClick={(v) => setView(v)}
              onSelectionChange={setSelectedIds}
              selectedIds={selectedIds}
              viewContext="review"
            />
          )}

          {view === 'closure' && (
            <Dashboard
              user={user}
              stats={stats}
              projects={displayProjects}
              onSelectProject={handleSelectProject}
              setView={setView}
              onCardClick={(v) => setView(v)}
              onSelectionChange={setSelectedIds}
              selectedIds={selectedIds}
              viewContext="closure"
            />
          )}

          {view === 'submit' && (
            <SubmissionForm
              user={user}
              onSubmit={handleFormSubmit}
              onBack={() => { setView('dashboard'); setEditingProject(null); }}
              initialData={editingProject}
            />
          )}

          {view === 'guide' && (
            <UserGuide />
          )}

          {view === 'governance' && (
            <Governance 
              projects={projects} 
              onSelectProject={handleSelectProject} 
            />
          )}

          {view === 'details' && (
            <ProjectDetails
              project={selectedProject}
              user={user}
              users={users}
              onBack={() => setView('dashboard')}
              onUpdateStatus={handleUpdateStatus}
              onCloseProject={handleCloseProject}
              onEditAndResubmit={handleEditAndResubmit}
            />
          )}
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
        showDelete={canDelete}
        showApproval={canApprove}
        showClosing={canClose}
        showSubmit={canSubmit}
        showReassign={canReassign}
      />
    </div>
  );
}
