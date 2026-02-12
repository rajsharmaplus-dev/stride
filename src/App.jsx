import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SubmissionForm } from './components/Forms/SubmissionForm';
import { ProjectDetails } from './components/Projects/ProjectDetails';
import { UserGuide } from './components/Help/UserGuide';
import { useProjectData } from './hooks/useProjectData';
import { PROJECT_STATUS } from './constants/projectConstants';
import { Zap } from 'lucide-react';

export default function App() {
  const {
    user,
    projects,
    stats,
    handleSwitchUser,
    addProject,
    updateProject,
    updateProjectStatus,
    closeProject
  } = useProjectData();

  const [view, setView] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  // Always derive selectedProject from projects array → fixes stale state (B-03)
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  // Filter projects for the current view
  const displayProjects = projects.filter(p => {
    if (view === 'review') return p.managerId === user.id && p.status === PROJECT_STATUS.PENDING;
    if (view === 'closure') return p.submitterId === user.id && p.status === PROJECT_STATUS.ACTIVE;

    // Default dashboard filtering
    const isOwner = p.submitterId === user.id;
    const isManager = p.managerId === user.id;
    const isAdmin = user.role === 'Admin';
    return isOwner || isManager || isAdmin;
  });

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

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar
        user={user}
        activeView={view}
        setView={(v) => { setView(v); setEditingProject(null); }}
        stats={stats}
        onSwitchUser={handleSwitchUser}
      />

      <main className="xl:pl-72 min-h-screen">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl px-8 py-5 flex justify-between items-center border-b border-slate-100 xl:hidden">
          <div className="flex items-center gap-2 text-primary-600 font-black tracking-tighter italic">
            <Zap size={24} className="fill-current" />
            <span>STRIDE</span>
          </div>
          <button
            onClick={handleSwitchUser}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20"
          >
            Toggle Demo Role
          </button>
        </header>

        <div className="p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
          {view === 'dashboard' && (
            <Dashboard
              user={user}
              stats={stats}
              projects={displayProjects}
              onSelectProject={handleSelectProject}
              setView={setView}
            />
          )}

          {view === 'review' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Queue</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Found {displayProjects.length} initiatives requiring baseline approval.</p>
              </div>
              <Dashboard projects={displayProjects} onSelectProject={handleSelectProject} user={user} stats={stats} setView={setView} />
            </div>
          )}

          {view === 'closure' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Closure</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Found {displayProjects.length} projects targeting execution completion.</p>
              </div>
              <Dashboard projects={displayProjects} onSelectProject={handleSelectProject} user={user} stats={stats} setView={setView} />
            </div>
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

          {view === 'details' && (
            <ProjectDetails
              project={selectedProject}
              user={user}
              onBack={() => setView('dashboard')}
              onUpdateStatus={handleUpdateStatus}
              onCloseProject={handleCloseProject}
              onEditAndResubmit={handleEditAndResubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
