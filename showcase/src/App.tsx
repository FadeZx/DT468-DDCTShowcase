import { Header } from './components/Header';
import { AuthDialog } from './components/AuthDialog';
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ProjectPage } from './components/ProjectPage';
import { UserProfile } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import UploadProjectPage from './components/UploadProject/UploadProjectPage';
import MyProjectsPage from './components/MyProjects/MyProjectsPage';

import { AccountSettings } from './components/Profile/AccountSettings';
import { Toaster } from './components/ui/sonner';
import { EventsPage } from './components/EventsPage';
import { EventPage } from './components/EventPage';
import { EventManagement } from './components/EventManagement';
import supabase from './utils/supabase/client';

// Wrapper component for ProjectPage to handle dynamic project lookup
function ProjectPageWrapper({ projects, currentUser, onEditProject, onDeleteProject }: {
  projects: any[];
  currentUser: any;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-center">Project not found</p>
      </div>
    );
  }
  
  return (
    <ProjectPage
      project={project}
      onBack={() => navigate('/')}
      currentUser={currentUser}
      onEditProject={onEditProject}
      onDeleteProject={onDeleteProject}
      supabase={supabase}
    />
  );
}

function ProjectEditorWrapper({ currentUser, onProjectUpdated, allProjects }: {
  currentUser: any;
  onProjectUpdated: () => void;
  allProjects: any[];
}) {
  const { projectId } = useParams<{ projectId: string }>();
  // Find the project from in-memory list to support mock/demo mode
  const initialProject = (allProjects || []).find((p: any) => p.id === projectId);

  return (
    <UploadProjectPage
      currentUser={currentUser}
      projectId={projectId}
      onProjectUpdated={onProjectUpdated}
      initialProject={initialProject}
    />
  );
}

// Wrapper component for UserProfile to handle dynamic user lookup
function UserProfileWrapper({ projects, currentUser, onProjectClick, onNavigate }: { 
  projects: any[]; 
  currentUser: any; 
  onProjectClick: (projectId: string) => void; 
  onNavigate: (path: string) => void; 
}) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const user = users.find((u: any) => u.id === userId);
  
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-center">User not found</p>
      </div>
    );
  }
  
  return (
    <UserProfile
      user={user}
      projects={projects}
      isOwnProfile={user.id === currentUser?.id}
      currentUser={currentUser}
      onProjectClick={onProjectClick}
      onNavigate={onNavigate}
    />
  );
}

// Declare users variable at module level to be accessible by wrapper components
let users: any[] = [];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [usersState, setUsersState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  // Load only real projects from Supabase (remove mock templates)
  useEffect(() => {
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const ownerIds = Array.from(new Set((rows || []).map(r => r.owner_id).filter(Boolean)));
        let owners: any[] = [];
        if (ownerIds.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email, avatar, year')
            .in('id', ownerIds);
          owners = profiles || [];
        }
        // Fetch candidate cover images for all projects in one query, prefer is_cover then earliest image
        const projectIds = (rows || []).map(r => r.id);
        let coverMap: Record<string, string> = {};
        if (projectIds.length) {
          const { data: files } = await supabase
            .from('project_files')
            .select('project_id,file_url,file_path,file_type,is_cover,created_at')
            .in('project_id', projectIds)
            .eq('file_type', 'image')
            .order('created_at', { ascending: true });
          const grouped: Record<string, any[]> = {};
          (files || []).forEach(f => { (grouped[f.project_id] ||= []).push(f); });
          for (const pid of Object.keys(grouped)) {
            const arr = grouped[pid];
            const coverFirst = [...arr].sort((a,b) => (b.is_cover?1:0)-(a.is_cover?1:0));
            const chosen = coverFirst[0];
            if (chosen) {
              coverMap[pid] = (chosen.file_path?.startsWith('projects/') ? chosen.file_path : '') || chosen.file_url || '';
            }
          }
        }

        const supabaseProjects = (rows || []).map(p => {
          const author = owners.find(o => o.id === p.owner_id);
          return {
            id: p.id,
            title: p.title,
            description: p.description,
            long_description: p.long_description || '',
            category: p.category || 'Uncategorized',
            featured: false,
            created_at: p.created_at,
            updated_at: p.updated_at,
            status: p.status || 'published',
            author_id: p.owner_id,
            cover_image: p.cover_image || coverMap[p.id] || '/placeholder-project.svg',
            views: 0,
            downloads: 0,
            likes: 0,
            tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',').map((t:string)=>t.trim()) : []),
            author: author ? {
              id: author.id,
              name: author.name || author.email || 'Unknown',
              avatar: author.avatar || null,
              year: author.year || 'Unknown'
            } : {
              id: p.owner_id,
              name: 'Unknown',
              avatar: null,
              year: 'Unknown'
            },
            stats: { views: 0, downloads: 0, likes: 0 },
            media: { all: [], images: [], videos: [], downloads: [] },
            members: []
          };
        });
        setProjects(supabaseProjects);
      } catch (e) {
        console.warn('Failed to load Supabase projects', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMockData = () => {
    // Mock removed; rely on Supabase only.
    setProjects([]);
    setUsersState([]);
    users = [];
  };

  // Auth helpers
  const quickLoginEmails = { admin: 'admin@ddct.edu.th', student: 'student1@ddct.edu.th' };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await fetchProfile(data.user.id);
    setCurrentUser(profile);
    return profile;
  };

  useEffect(() => {
    // Restore session if exists
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        try {
          const profile = await fetchProfile(data.user.id);
          setCurrentUser(profile);
        } catch {}
      }
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/');
  };

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const handleDeleteProject = (projectId: string) => {
    // TODO: Implement project deletion logic
    console.log('Delete project:', projectId);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleEventBack = () => {
    navigate('/events');
  };

  const loadData = () => {
    // No-op: mock data removed, rely on Supabase-backed refreshes if needed.
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <main>
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading DDCT Showcase...</p>
            </div>
          </div>
        ) : (
          <>
            <AuthDialog
              isOpen={showAuth && !currentUser}
              onClose={() => setShowAuth(false)}
              onSignedIn={() => setShowAuth(false)}
              signInWithEmail={signInWithEmail}
              quickLoginEmails={quickLoginEmails}
            />
            <Routes>
              <Route path="/" element={
                <HomePage
                  projects={projects}
                  onProjectClick={handleProjectClick}
                />
              } />
              
              <Route path="/projects/:projectId" element={
                <ProjectPageWrapper
                  projects={projects}
                  currentUser={currentUser}
                  onEditProject={(projectId: string) => {
                    navigate(`/projects/${projectId}/edit`);
                  }}
                  onDeleteProject={handleDeleteProject}
          
                />
              } />

              <Route path="/projects/:projectId/edit" element={
                currentUser?.role === 'student' || currentUser?.role === 'admin' ? (
                  <ProjectEditorWrapper
                    currentUser={currentUser}
                    onProjectUpdated={loadData}
                    allProjects={projects}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Access denied</p>
                  </div>
                )
              } />
              
              <Route path="/profile" element={
                currentUser ? (
                  <UserProfile
                    user={currentUser}
                    projects={projects}
                    isOwnProfile={true}
                    currentUser={currentUser}
                    onProjectClick={handleProjectClick}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Please sign in to view your profile</p>
                  </div>
                )
              } />
              
              <Route path="/users/:userId" element={
                <UserProfileWrapper 
                  projects={projects}
                  currentUser={currentUser}
                  onProjectClick={handleProjectClick}
                  onNavigate={handleNavigate}
                />
              } />
              
              <Route path="/admin" element={
                currentUser?.role === 'admin' ? (
                  <AdminDashboard
                    projects={projects}
                    users={users}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Access denied</p>
                  </div>
                )
              } />
              
              <Route path="/upload" element={
                currentUser?.role === 'student' ? (
                  <UploadProjectPage 
                    currentUser={currentUser}
                    onProjectCreated={loadData}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Access denied</p>
                  </div>
                )
              } />
              
              <Route path="/my-projects" element={
                currentUser?.role === 'student' ? (
                  <MyProjectsPage
                    currentUser={currentUser}
                    projects={projects}
                    onNavigate={handleNavigate}
                    onEditProject={(projectId) => {
                      navigate(`/projects/${projectId}/edit`);
                    }}
                    onViewProject={handleProjectClick}
                    onDeleteProject={handleDeleteProject}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Access denied</p>
                  </div>
                )
              } />
              

              
              <Route path="/account-settings" element={
                currentUser ? (
                  <AccountSettings 
                    user={currentUser} 
                    onClose={() => navigate('/')}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Please sign in to access settings</p>
                  </div>
                )
              } />
              
              <Route path="/browse" element={
                <div className="max-w-7xl mx-auto px-6 py-8">
                  <h1 className="text-3xl font-bold mb-8">Browse All Projects</h1>
                  {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {projects.map((project) => (
                        <div 
                          key={project.id} 
                          onClick={() => handleProjectClick(project.id)}
                          className="cursor-pointer"
                        >
                          <div className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
                            <img 
                              src={project.thumbnail || '/placeholder-project.svg'} 
                              alt={project.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                              <h3 className="font-semibold mb-2">{project.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {project.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {project.author?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No projects available yet.</p>
                    </div>
                  )}
                </div>
              } />
              
              <Route path="/events" element={
                <EventsPage onEventClick={handleEventClick} />
              } />
              
              <Route path="/events/:eventId" element={
                <EventPage eventId={location.pathname.split('/').pop() || ''} onBack={handleEventBack} />
              } />
              
              <Route path="/admin/events" element={
                currentUser?.role === 'admin' ? (
                  <EventManagement />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Access denied</p>
                  </div>
                )
              } />
            </Routes>
          </>
        )}
      </main>

      <Toaster />
    </div>
  );
}