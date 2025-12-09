import { Header } from './components/Header';
import { AuthDialog } from './components/AuthDialog';
import { useState, useEffect, useMemo } from 'react';
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
import { EventsHomePage } from './components/EventsHomePage';
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
  onReady?: (projectId: string) => void;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [fallbackProject, setFallbackProject] = useState<any | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const project = projects.find(p => p.id === projectId) || fallbackProject;

  // Fetch project on demand if not in memory (e.g., after redirect immediately after create)
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!projectId || project) return;
      setLoadingProject(true);
      try {
        const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
        if (!active || !proj) return;
        const { data: files } = await supabase.from('project_files').select('*').eq('project_id', projectId);
        const ownerId = proj.owner_id || proj.author_id;
        setFallbackProject({
          ...proj,
          author_id: ownerId,
          media: { all: files || [] },
          author: { id: ownerId, name: 'Unknown', avatar: null },
          members: [],
          stats: { views: Number((proj as any).views) || 0, downloads: Number((proj as any).downloads) || 0, likes: 0 },
          cover_image: proj.cover_image || '',
          visibility: proj.visibility || 'unlisted',
        });
      } finally {
        if (active) setLoadingProject(false);
      }
    };
    load();
    return () => { active = false; };
  }, [projectId, project]);

  useEffect(() => { if (project) onReady?.(project.id); }, [project?.id]);

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-center">{loadingProject ? 'Loading project…' : 'Project not found'}</p>
      </div>
    );
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <ProjectPage
      project={project}
      onBack={handleBack}
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
          .select('id, name, email, avatar, role, year, bio, skills, github, linkedin, portfolio, location, majors')
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
  const publicProjects = useMemo(() => projects.filter(p => p.visibility === 'public'), [projects]);

  // Increment a project's view count once per session and reflect in UI
  const incrementProjectView = async (projectId: string) => {
    try {
      const key = `viewed:${projectId}`;
      const last = Number(sessionStorage.getItem(key) || 0);
      // Prevent rapid duplicate increments within a short window (dev-friendly)
      if (Date.now() - last < 60 * 1000) {
        return;
      }
      sessionStorage.setItem(key, String(Date.now()));

      const optimisticIncrement = (next?: number) => {
        setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          const currentViews = next ?? (p.views || 0) + 1;
          return {
            ...p,
            views: currentViews,
            stats: { ...p.stats, views: currentViews }
          };
        }));
      };

      // Optimistically update UI state
      optimisticIncrement();

      const persistWithRpc = async () => {
        const { data, error } = await supabase
          .rpc('increment_project_views', { p_project_id: projectId });
        if (error) throw error;
        if (typeof data === 'number' && Number.isFinite(data)) {
          optimisticIncrement(data);
        }
      };

      // Try to persist to Supabase (best-effort)
      try {
        await persistWithRpc();
      } catch (rpcError: any) {
        try {
          const current = projects.find(p => p.id === projectId);
          const nextViews = (current?.views || 0) + 1;
          const { error } = await supabase
            .from('projects')
            .update({ views: nextViews }, { returning: 'minimal' })
            .eq('id', projectId);
          if (error) throw error;
        } catch (e: any) {
          // Common in RLS setups where UPDATE is blocked or 406 returned;
          // UI already updated optimistically.
          if (typeof e?.message === 'string' && e.message.includes('406')) {
            console.warn('Persist skipped (406 Not Acceptable). Check RLS or use RPC.', e);
          } else {
            console.warn('Failed to persist view increment', e, rpcError);
          }
        }
      }
    } catch (e) {
      console.warn('incrementProjectView error', e);
    }
  };

  const hydrateProjects = async (rows: any[]) => {
    if (!rows || rows.length === 0) return [];
    const ownerIds = Array.from(new Set(rows.map((r: any) => r.owner_id).filter(Boolean)));
    let owners: any[] = [];
    if (ownerIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar, year')
        .in('id', ownerIds);
      owners = profiles || [];
    }
    const projectIds = rows.map((r: any) => r.id);
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
        const coverFirst = [...arr].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0));
        const chosen = coverFirst[0];
        if (chosen) {
          coverMap[pid] = (chosen.file_path?.startsWith('projects/') ? chosen.file_path : '') || chosen.file_url || '';
        }
      }
    }
    const likeCounts = projectIds.length ? await getProjectLikeCounts(supabase, projectIds) : {};
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
    return rows.map((p: any) => {
      const author = owners.find(o => o.id === p.owner_id);
      const likeCount = (likeCounts as any)[p.id] || 0;
      const normalizedVisibility = p.visibility === 'public' ? 'public' : 'unlisted';
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        full_description: p.full_description || '',
        category: p.category || 'Others',
        featured: false,
        created_at: p.created_at,
        updated_at: p.updated_at,
        status: normalizedVisibility === 'public' ? 'published' : 'unlisted',
        visibility: normalizedVisibility,
        author_id: p.owner_id,
        cover_image: p.cover_image || coverMap[p.id] || '/placeholder-project.svg',
        views: Number((p as any).views) || 0,
        downloads: Number((p as any).downloads) || 0,
        likes: likeCount,
        tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',').map((t: string) => t.trim()) : []),
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
        stats: { views: Number((p as any).views) || 0, downloads: Number((p as any).downloads) || 0, likes: likeCount },
        media: { all: [], images: [], videos: [], downloads: [] },
        members: membersByProject[p.id] || []
      };
    });
  };

  const buildRowsWithAccess = async (userId?: string) => {
    const { data: publicRows, error } = await supabase
      .from('projects')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });
    if (error) throw error;
    let rows = [...(publicRows || [])];
    const seen = new Set(rows.map(r => r.id));
    if (userId) {
      const { data: ownedRows } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .eq('visibility', 'unlisted')
        .order('updated_at', { ascending: false });
      (ownedRows || []).forEach(row => {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          rows.push(row);
        }
      });
      const { data: collaboratorLinks } = await supabase
        .from('project_collaborators')
        .select('project_id')
        .eq('user_id', userId);
      const collaboratorIds = (collaboratorLinks || [])
        .map((link: any) => link.project_id)
        .filter((id): id is string => Boolean(id) && !seen.has(id));
      if (collaboratorIds.length) {
        const { data: collabProjects } = await supabase
          .from('projects')
          .select('*')
          .in('id', collaboratorIds)
          .eq('visibility', 'unlisted');
        (collabProjects || []).forEach(row => {
          if (!seen.has(row.id)) {
            seen.add(row.id);
            rows.push(row);
          }
        });
      }
    }
    rows.sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime());
    return rows;
  };

  const fetchProjectsForUser = async (userId?: string) => {
    const rows = await buildRowsWithAccess(userId);
    return hydrateProjects(rows);
  };

  const loadUsersForAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar, role, year, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const list = data || [];
      setUsersState(list);
      users = list;
    } catch (e) {
      console.warn('Failed to load users for admin dashboard', e);
      setUsersState([]);
      users = [];
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProjectsForUser(currentUser?.id)
      .then(data => {
        if (active) setProjects(data);
      })
      .catch(e => {
        console.warn('Failed to load Supabase projects', e);
        if (active) setProjects([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  // Load user list for admin views
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsersForAdmin();
    } else {
      setUsersState([]);
      users = [];
    }
  }, [currentUser?.id, currentUser?.role]);

  const loadMockData = () => {
    // Mock removed; rely on Supabase only.
    setProjects([]);
    setUsersState([]);
    users = [];
  };

  // Auth helpers
  const quickLoginEmails = {
    admin: 'admin@ddct.edu.th',
    student1: 'student1@ddct.edu.th',
    student2: 'student2@ddct.edu.th',
    partner: 'partner@ddct.edu.th',
  };
  const quickLoginPasswords = {
    admin: 'Admin#468',
    student1: 'Student#468',
    student2: 'Student#468',
    partner: 'partner1234',
  };

  const ALLOWED_PROFILE_ROLES = ['admin', 'student', 'guest'] as const;
  type AllowedProfileRole = (typeof ALLOWED_PROFILE_ROLES)[number];
  const normalizeProfileRole = (role: string | null | undefined): AllowedProfileRole => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'student' || r === 'partner' || r === 'teacher') return 'student';
    return 'guest';
  };

  const fetchProfile = async (userId: string) => {
    // Get current auth user to derive semantic role metadata
    const { data: userRes } = await supabase.auth.getUser();
    const authUser = userRes?.user;
    const rawMetaRole = (authUser?.user_metadata as any)?.role as string | undefined;
    const semanticRole = typeof rawMetaRole === 'string' ? rawMetaRole : null;
    const metaYear = (authUser?.user_metadata as any)?.year as string | undefined;

    // Try to load existing profile row
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return {
        ...data,
        // Attach semanticRole for front-end logic (student vs partner vs admin)
        semanticRole: semanticRole || data.role,
      };
    }

    // If no profile row exists yet, build a minimal one from the auth user
    const dbRole = normalizeProfileRole(semanticRole);

    const baseProfile = {
      id: userId,
      email: authUser?.email ?? '',
      name: (authUser?.user_metadata as any)?.name || authUser?.email || 'Unknown User',
      role: dbRole,
      year: dbRole === 'student' ? (metaYear || 'Unknown') : null,
      avatar: (authUser?.user_metadata as any)?.avatar || null,
      bio: `Profile for ${authUser?.email || 'DDCT user'}`,
      skills: [] as string[],
    };

    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert(baseProfile, { onConflict: 'id' })
      .select('*')
      .eq('id', userId)
      .single();

    if (upsertError) {
      throw upsertError;
    }

    return {
      ...upserted,
      semanticRole: semanticRole || upserted.role,
    };
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
    try {
      const updatedProjects = await fetchProjectsForUser(currentUser?.id);
      setProjects(updatedProjects);
    } catch (e) {
      console.warn('Failed to reload projects', e);
    }
  };

  const currentRole = currentUser ? (currentUser.semanticRole || currentUser.role) : undefined;

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
                quickLoginPasswords={quickLoginPasswords}
              />
          <Routes>
              <Route path="/" element={
                <HomePage
                  projects={publicProjects}
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
                  onReady={(pid) => incrementProjectView(pid)}
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
                currentRole === 'admin' ? (
                  <AdminDashboard
                    projects={projects}
                    users={usersState}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <p className="text-center">Access denied</p>
                  </div>
                )
              } />
              
              <Route path="/upload" element={
                (currentRole === 'student' || currentRole === 'partner') ? (
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
                (currentRole === 'student' || currentRole === 'partner') ? (
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
                <BrowseAll projects={publicProjects} onProjectClick={handleProjectClick} />
              } />
              
              <Route path="/events" element={
                <EventsHomePage onEventClick={handleEventClick} />
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
                <SearchResults projects={publicProjects} onProjectClick={handleProjectClick} />
              } />
            </Routes>
          </>
        )}
      </main>

      <Toaster />
    </div>
  );
}





