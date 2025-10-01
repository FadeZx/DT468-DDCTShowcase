import { Header } from './components/Header';
import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { ProjectPage } from './components/ProjectPage';
import { UserProfile } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import UploadProjectPage from './components/UploadProject/UploadProjectPage';
import MyProjectsPage from './components/MyProjects/MyProjectsPage';
import { AccountManagement } from './components/Admin/AccountManagement';
import { AccountSettings } from './components/Profile/AccountSettings';
import { Toaster } from './components/ui/sonner';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

// Initialize Supabase client
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    checkUser();
    loadData();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setCurrentUser(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadData = async () => {
    try {
      // Load projects from Supabase
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        setProjects([]);
      } else {
        // Load users/profiles separately
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*');

        if (usersError) {
          console.error('Error loading users:', usersError);
          setUsers([]);
        } else {
          setUsers(usersData || []);
          
          // Combine projects with author data
          const projectsWithAuthors = (projectsData || []).map(project => {
            const author = usersData?.find(user => user.id === project.author_id);
            return {
              ...project,
              author: author ? {
                name: author.name || 'Unknown',
                avatar: author.avatar,
                year: author.year || 'Unknown'
              } : {
                name: 'Unknown',
                avatar: null,
                year: 'Unknown'
              },
              // Ensure stats object exists
              stats: {
                views: project.views || 0,
                downloads: project.downloads || 0,
                likes: project.likes || 0
              },
              // Ensure tags is an array
              tags: Array.isArray(project.tags) ? project.tags : 
                    (typeof project.tags === 'string' ? project.tags.split(',').map((t: string) => t.trim()) : [])
            };
          });
          
          setProjects(projectsWithAuthors);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.session && data.user) {
        await loadUserProfile(data.user.id);
        console.log('Successfully authenticated with Supabase');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedProject(null);
    setSelectedUser(null);
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setCurrentPage('project');
  };

  const handleProfileClick = (userId: string) => {
    setSelectedUser(userId);
    setCurrentPage('user-profile');
  };

  const handleBackFromProject = () => {
    setCurrentPage('home');
    setSelectedProject(null);
  };

  const currentProject = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const profileUser = selectedUser ? users.find(u => u.id === selectedUser) : currentUser;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
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
            {currentPage === 'home' && (
              <HomePage
                projects={projects}
                onProjectClick={handleProjectClick}
              />
            )}

            {currentPage === 'project' && currentProject && (
              <ProjectPage
                project={currentProject}
                onBack={handleBackFromProject}
                currentUser={currentUser}
                onEditProject={(projectId) => {
                  setSelectedProject(projectId);
                  setCurrentPage('edit-project');
                }}
              />
            )}

            {currentPage === 'profile' && currentUser && (
              <UserProfile
                user={currentUser}
                projects={projects}
                isOwnProfile={true}
                currentUser={currentUser}
                onProjectClick={handleProjectClick}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'user-profile' && profileUser && (
              <UserProfile
                user={profileUser}
                projects={projects}
                isOwnProfile={profileUser.id === currentUser?.id}
                currentUser={currentUser}
                onProjectClick={handleProjectClick}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'admin' && currentUser?.role === 'admin' && (
              <AdminDashboard
                projects={projects}
                users={users}
              />
            )}

            {currentPage === 'upload-project' && currentUser?.role === 'student' && (
              <UploadProjectPage 
                currentUser={currentUser}
                onProjectCreated={loadData}
              />
            )}

            {currentPage === 'my-projects' && currentUser?.role === 'student' && (
              <MyProjectsPage 
                currentUser={currentUser}
                projects={projects}
                onNavigate={handleNavigate}
                onEditProject={(projectId) => {
                  setSelectedProject(projectId);
                  setCurrentPage('edit-project');
                }}
                onViewProject={handleProjectClick}
              />
            )}

            {currentPage === 'edit-project' && currentUser?.role === 'student' && selectedProject && (
              <UploadProjectPage 
                currentUser={currentUser}
                projectId={selectedProject}
                onProjectUpdated={loadData}
              />
            )}

            {currentPage === 'account-management' && currentUser?.role === 'admin' && (
              <AccountManagement onAccountCreated={loadData} />
            )}

            {currentPage === 'account-settings' && currentUser && (
              <AccountSettings 
                user={currentUser} 
                onClose={() => setCurrentPage('home')}
              />
            )}
          </>
        )}

        {currentPage === 'browse' && (
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
                        src={project.thumbnail || '/placeholder-project.jpg'} 
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
        )}

        {currentPage === 'events' && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">DDCT Game Jam 2025</h3>
                <p className="text-muted-foreground mb-4">March 15-17, 2025</p>
                <p>48-hour game development competition where students collaborate to create innovative games.</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">Animation Showcase</h3>
                <p className="text-muted-foreground mb-4">April 2, 2025</p>
                <p>Annual film festival showcasing the best student animation projects.</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2">Portfolio Review Day</h3>
                <p className="text-muted-foreground mb-4">April 20, 2025</p>
                <p>Industry professionals review and provide feedback on student portfolios.</p>
              </div>
            </div>
          </div>
        )}


      </main>

      <Toaster />
    </div>
  );
}