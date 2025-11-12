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
import { Input } from './components/ui/input';
import { Search } from 'lucide-react';
import { EventsPage } from './components/EventsPage';
import { EventPage } from './components/EventPage';
import { EventManagement } from './components/EventManagement';
import supabase from './utils/supabase/client';
import { getProjectLikeCounts } from './utils/projectLikes';
import { listProjectStorage } from './utils/fileStorage';
import { ProjectCard } from './components/ProjectCard';


// Wrapper component for ProjectPage to handle dynamic project lookup and page-loading ready callback
function ProjectPageWrapper({ projects, currentUser, onEditProject, onDeleteProject, onProjectUpdate, onReady }: {
  projects: any[];
  currentUser: any;
  onEditProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onProjectUpdate: () => void;
  onReady?: () => void;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === projectId);

  useEffect(() => { onReady?.(); }, []);

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
      onProjectUpdate={onProjectUpdate}
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

function BrowseAll({ projects, onProjectClick }: { projects: any[]; onProjectClick: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const normalizeTags = (p: any): string[] => {
    const t = p?.tags;
    if (Array.isArray(t)) return t.map((s: any) => String(s || '').trim().toLowerCase()).filter(Boolean);
    if (typeof t === 'string') return t.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    return [];
  };

  const q = searchTerm.trim().toLowerCase();
  const filtered = q
    ? projects.filter((p: any) => {
        const contains = (s?: string) => (s || '').toLowerCase().includes(q);
        if (contains(p.title) || contains(p.description) || contains(p.category)) return true;
        if (contains(p.author?.name)) return true;
        if (normalizeTags(p).some(t => t.includes(q))) return true;
        if ((p.members || []).some((m: any) => contains(m?.name))) return true;
        return false;
      })
    : projects;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold flex-1">Browse All Projects</h1>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, tag, author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((project: any) => (
            <div 
              key={project.id} 
              onClick={() => onProjectClick(project.id)}
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
          <p className="text-muted-foreground">No projects match your search.</p>
        </div>
      )}
    </div>
  );
}

function SearchResults({ projects, onProjectClick }: { projects: any[]; onProjectClick: (id: string) => void }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const qRaw = params.get('q') || '';
  const q = qRaw.trim().toLowerCase();

  const normalizeTags = (p: any): string[] => {
    const t = p?.tags;
    if (Array.isArray(t)) return t.map((s: any) => String(s || '').trim().toLowerCase()).filter(Boolean);
    if (typeof t === 'string') return t.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    return [];
  };

  const contains = (s?: string) => (s || '').toLowerCase().includes(q);

  const filtered = !q
    ? []
    : projects.filter((p: any) =>
        contains(p.title) ||
        contains(p.description) ||
        contains(p.category) ||
        contains(p.author?.name) ||
        normalizeTags(p).some(t => t.includes(q)) ||
        (p.members || []).some((m: any) => contains(m?.name))
      );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Search Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {q ? `for "${qRaw}" — ${filtered.length} result${filtered.length === 1 ? '' : 's'}` : 'Enter a query in the header search.'}
          </p>
        </div>
      </div>

      {q && filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {filtered.map((project: any) => (
            <ProjectCard key={project.id} project={project} onClick={onProjectClick} />
          ))}
        </div>
      ) : q ? (
        <div className="text-center py-16 text-muted-foreground">No projects match your search.</div>
      ) : null}
    </div>
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
  const [loadedUser, setLoadedUser] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!userId) { setLoadedUser(null); setLoadingUser(false); return; }
      // 1) Try global cache
      const cached = users.find((u: any) => u.id === userId);
      if (cached) { if (active) { setLoadedUser(cached); setLoadingUser(false); } return; }
      // 2) Try derive from projects (author or members)
      const fromProjects = (() => {
        for (const p of projects) {
          if (p?.author?.id === userId) return p.author;
          const m = (p?.members || []).find((x: any) => x.id === userId);
          if (m) return m;
        }
        return null;
      })();
      if (fromProjects) { if (active) { setLoadedUser(fromProjects); setLoadingUser(false); } }
      // 3) Fetch from Supabase
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, avatar, role, year')
          .eq('id', userId)
          .single();
        if (error) throw error;
        if (active) { setLoadedUser(data); setLoadingUser(false); }
      } catch {
        if (active) setLoadingUser(false);
      }
    }
    load();
    return () => { active = false; };
  }, [userId, projects]);

  if (loadingUser) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-center">Loading profile…</p>
      </div>
    );
  }

  if (!loadedUser) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-center">User not found</p>
      </div>
    );
  }

  return (
    <UserProfile
      user={loadedUser}
      projects={projects}
      isOwnProfile={loadedUser.id === currentUser?.id}
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
          .eq('visibility', 'public')
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

        // Fetch like counts for all projects (reuse projectIds from above)
        const likeCounts = await getProjectLikeCounts(supabase, projectIds);

        // Fetch collaborators and their profiles
        let membersByProject: Record<string, any[]> = {};
        if (projectIds.length) {
          const { data: collabRows } = await supabase
            .from('project_collaborators')
            .select('project_id, user_id, job_role')
            .in('project_id', projectIds);
          const memberIds = Array.from(new Set((collabRows || []).map(r => r.user_id).filter(Boolean)));
          let memberProfiles: any[] = [];
          if (memberIds.length) {
            const { data: profs } = await supabase
              .from('profiles')
              .select('id, name, avatar, year')
              .in('id', memberIds);
            memberProfiles = profs || [];
          }
          const profMap = new Map(memberProfiles.map(p => [p.id, p] as const));
          (collabRows || []).forEach(r => {
            const prof = profMap.get(r.user_id);
            if (!prof) return;
            (membersByProject[r.project_id] ||= []).push({
              id: prof.id,
              name: prof.name || 'Unknown',
              avatar: prof.avatar || null,
              year: prof.year || 'Unknown',
              jobRole: (r as any).job_role || null
            });
          });
        }

        const supabaseProjects = (rows || []).map(p => {
          const author = owners.find(o => o.id === p.owner_id);
          const likeCount = likeCounts[p.id] || 0;
          return {
            id: p.id,
            title: p.title,
            description: p.description,
            long_description: p.long_description || '',
            category: p.category || 'Uncategorized',
            featured: false,
            created_at: p.created_at,
            updated_at: p.updated_at,
            status: (p.visibility === 'public' ? 'published' : (p.visibility || 'draft')),
            author_id: p.owner_id,
            cover_image: p.cover_image || coverMap[p.id] || '/placeholder-project.svg',
            views: 0,
            downloads: 0,
            likes: likeCount,
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
            stats: { views: 0, downloads: 0, likes: likeCount },
            media: { all: [], images: [], videos: [], downloads: [] },
            members: membersByProject[p.id] || []
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
  const quickLoginEmails = { admin: 'admin@ddct.edu.th', student1: 'student1@ddct.edu.th', student2: 'student2@ddct.edu.th' };

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

  const handleProjectClick = (projectId: string) => { navigate(`/projects/${projectId}`); };

  const handleProfileClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      if (!currentUser) {
        alert('Please sign in to delete a project.');
        return;
      }

      // Check ownership/permission
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id, owner_id')
        .eq('id', projectId)
        .single();
      if (projErr) throw projErr;
      const isOwner = currentUser?.id && proj?.owner_id && currentUser.id === proj.owner_id;
      const isAdmin = currentUser?.role === 'admin';
      if (!isOwner && !isAdmin) {
        alert('You do not have permission to delete this project.');
        return;
      }

      // 1) Delete storage objects for this project under the 'project-files' bucket
      try {
        const entries = await listProjectStorage(projectId);
        const allPaths = (entries || [])
          .map((e: any) => e.path as string)
          .filter((p) => typeof p === 'string' && p.startsWith(`projects/${projectId}/`));
        if (allPaths.length) {
          const { error: rmErr } = await supabase.storage.from('project-files').remove(allPaths);
          if (rmErr) console.warn('Storage remove warning:', rmErr);
        }
      } catch (e) {
        console.warn('Storage cleanup failed (non-fatal):', e);
      }

      // 2) Delete related DB rows
      try { await supabase.from('project_comments').delete().eq('project_id', projectId); } catch {}
      try { await supabase.from('project_likes').delete().eq('project_id', projectId); } catch {}
      try { await supabase.from('project_collaborators').delete().eq('project_id', projectId); } catch {}
      try { await supabase.from('project_files').delete().eq('project_id', projectId); } catch {}

      // 3) Delete project row (return deleted rows to detect RLS blocks)
      const { data: deletedRows, error: delErr } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select('id');
      if (delErr) throw delErr;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('Delete was blocked by RLS (no rows removed)');
      }

      // Update local state and navigate home
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      navigate('/');
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleEventBack = () => {
    navigate('/events');
  };

  const loadData = async () => {
    // Reload projects to refresh like counts
    try {
      const { data: rows, error } = await supabase
        .from('projects')
        .select('*')
        .eq('visibility', 'public')
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

      const likeCounts = await getProjectLikeCounts(supabase, projectIds);

      // Fetch collaborators and their profiles
      let membersByProject: Record<string, any[]> = {};
      if (projectIds.length) {
        const { data: collabRows } = await supabase
          .from('project_collaborators')
          .select('project_id, user_id, job_role')
          .in('project_id', projectIds);
        const memberIds = Array.from(new Set((collabRows || []).map(r => r.user_id).filter(Boolean)));
        let memberProfiles: any[] = [];
        if (memberIds.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, name, avatar, year')
            .in('id', memberIds);
          memberProfiles = profs || [];
        }
        const profMap = new Map(memberProfiles.map(p => [p.id, p] as const));
        (collabRows || []).forEach(r => {
          const prof = profMap.get(r.user_id);
          if (!prof) return;
          (membersByProject[r.project_id] ||= []).push({
            id: prof.id,
            name: prof.name || 'Unknown',
            avatar: prof.avatar || null,
            year: prof.year || 'Unknown',
            jobRole: (r as any).job_role || null
          });
        });
      }

      const supabaseProjects = (rows || []).map(p => {
        const author = owners.find(o => o.id === p.owner_id);
        const likeCount = likeCounts[p.id] || 0;
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          long_description: p.long_description || '',
          category: p.category || 'Uncategorized',
          featured: false,
          created_at: p.created_at,
          updated_at: p.updated_at,
          status: (p.visibility === 'public' ? 'published' : (p.visibility || 'draft')),
          author_id: p.owner_id,
          cover_image: p.cover_image || coverMap[p.id] || '/placeholder-project.svg',
          views: 0,
          downloads: 0,
          likes: likeCount,
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
          stats: { views: 0, downloads: 0, likes: likeCount },
          media: { all: [], images: [], videos: [], downloads: [] },
          members: membersByProject[p.id] || []
        };
      });
      setProjects(supabaseProjects);
    } catch (e) {
      console.warn('Failed to reload projects', e);
    }
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
                  onProjectUpdate={loadData}
                  />
              } />
              <Route path="/projects/:projectId/edit" element={
                (currentUser?.role === 'student' || currentUser?.role === 'admin') ? (
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
                    onUserUpdated={(u) => setCurrentUser(u)}
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
                <BrowseAll projects={projects} onProjectClick={handleProjectClick} />
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
              <Route path="/search" element={
                <SearchResults projects={projects} onProjectClick={handleProjectClick} />
              } />
            </Routes>
          </>
        )}
      </main>

      <Toaster />
    </div>
  );
}














