import { Header } from './components/Header';
import { RoleSelector, mockUsers } from './components/RoleSelector';
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ProjectPage } from './components/ProjectPage';
import { UserProfile } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import UploadProjectPage from './components/UploadProject/UploadProjectPage';
import MyProjectsPage from './components/MyProjects/MyProjectsPage';
import { AccountManagement } from './components/Admin/AccountManagement';
import { AccountSettings } from './components/Profile/AccountSettings';
import { Toaster } from './components/ui/sonner';
import { EventsPage } from './components/EventsPage';
import { EventPage } from './components/EventPage';
import { EventManagement } from './components/EventManagement';

// Wrapper component for ProjectPage to handle dynamic project lookup
function ProjectPageWrapper({ projects, currentUser, onEditProject, onDeleteProject, supabase }: {
  projects: any[];
  currentUser: any;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  supabase: any;
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

function ProjectEditorWrapper({ currentUser, onProjectUpdated }: {
  currentUser: any;
  onProjectUpdated: () => void;
}) {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <UploadProjectPage
      currentUser={currentUser}
      projectId={projectId}
      onProjectUpdated={onProjectUpdated}
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
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Mock data for demo
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock projects data
    const mockProjects = [
      {
        id: '1',
        title: 'Fantasy Adventure Game',
        description: 'A 3D fantasy RPG with immersive storytelling',
        category: 'Games',
        featured: true,
        created_at: '2024-01-15T10:00:00Z',
        author_id: 'student-1',
        cover_image: '/placeholder-project.svg',
        views: 150,
        downloads: 45,
        likes: 23,
        tags: ['RPG', 'Fantasy', '3D']
      },
      {
        id: '2',
        title: 'Animated Short Film',
        description: 'A 2D animated story about friendship',
        category: 'Animation',
        featured: true,
        created_at: '2024-01-10T14:30:00Z',
        author_id: 'student-2',
        cover_image: '/placeholder-project.svg',
        views: 89,
        downloads: 12,
        likes: 15,
        tags: ['2D', 'Animation', 'Storytelling']
      }
    ];

    // Mock users data
    const mockUsersData = [
      {
        id: 'student-1',
        name: 'John Doe',
        email: 'john.doe@ddct.edu',
        role: 'student',
        avatar: null,
        year: '2025'
      },
      {
        id: 'student-2', 
        name: 'Jane Smith',
        email: 'jane.smith@ddct.edu',
        role: 'student',
        avatar: null,
        year: '2024'
      }
    ];

    // Process projects with mock data
    const processedProjects = mockProjects.map(project => {
      const author = mockUsersData.find(u => u.id === project.author_id);
      return {
        ...project,
        author: author ? {
          name: author.name,
          avatar: author.avatar,
          year: author.year
        } : {
          name: 'Unknown',
          avatar: null,
          year: 'Unknown'
        },
        stats: {
          views: project.views,
          downloads: project.downloads,
          likes: project.likes
        },
        media: {
          all: [],
          images: [],
          videos: [],
          downloads: []
        },
        collaborators: []
      };
    });

    setProjects(processedProjects);
    setUsersState(mockUsersData);
    users = mockUsersData;
    setLoading(false);
  };

  const handleRoleSelected = (role: 'admin' | 'student' | 'guest') => {
    setCurrentUser(mockUsers[role]);
    console.log(`Selected role: ${role}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowRoleSelector(true);
    navigate('/');
  };

  const handleLogin = () => {
    setShowRoleSelector(true);
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
    loadMockData();
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
            <RoleSelector
              isOpen={showRoleSelector && !currentUser}
              onClose={() => setShowRoleSelector(false)}
              onRoleSelected={handleRoleSelected}
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
                currentUser?.role === 'student' ? (
                  <ProjectEditorWrapper
                    currentUser={currentUser}
                    onProjectUpdated={loadData}
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
              
              <Route path="/account-management" element={
                currentUser?.role === 'admin' ? (
                  <AccountManagement onAccountCreated={loadData} />
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