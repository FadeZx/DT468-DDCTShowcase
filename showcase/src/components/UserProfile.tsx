import { useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ProjectCard } from './ProjectCard';
import { ProfileThemeEditor, ProfileTheme } from './ProfileThemeEditor';
import supabase from '../utils/supabase/client';
import { 
  Edit, Download, Mail, Github, Linkedin, ExternalLink,
  Calendar, MapPin, Award, BookOpen, Settings, UserPlus, Shield, Palette, X
} from 'lucide-react';

interface UserProfileProps {
  user: any;
  projects: any[];
  isOwnProfile: boolean;
  currentUser: any;
  onProjectClick: (projectId: string) => void;
  onNavigate?: (page: string) => void;
  onUserUpdated?: (u: any) => void;
}

export function UserProfile({ user, projects, isOwnProfile, currentUser, onProjectClick, onNavigate, onUserUpdated }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [showInlineTheme, setShowInlineTheme] = useState(false);
  const [themeSidebarOpen, setThemeSidebarOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const displayAvatar = useMemo(
    () => avatarPreview || editedUser.avatar || user.avatar || null,
    [avatarPreview, editedUser.avatar, user.avatar]
  );
  const displayRole = user.semanticRole || user.role;
  const viewerRoleRaw = currentUser ? (currentUser.semanticRole || currentUser.role) : '';
  const viewerRole = `${viewerRoleRaw || ''}`.toLowerCase();
  const isPrivilegedViewer = ['admin', 'partner', 'teacher'].includes(viewerRole);
  const limitedView = !isOwnProfile && !isPrivilegedViewer;

  const [theme, setTheme] = useState<ProfileTheme>({
    colors: { background: '#0b0b0b', text: '#ffffff', accent: '#7c3aed', cardBackground: '#111827' },
    typography: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, headingSize: 18 },
    layout: { projectColumns: 3, borderRadius: 8 },
    images: {},
    projectOrder: projects.map((p) => p.id),
    hiddenProjects: [],
  });
  
  const canExportPDF = ['admin', 'partner'].includes(viewerRole);
  const userProjects = projects.filter(p => p.author.id === user.id);
  const collaborativeProjects = projects.filter(p => 
    p.members?.some((m: any) => m.id === user.id)
  );
  const combinedProjects = [...userProjects, ...collaborativeProjects].filter(
    (proj, index, arr) => arr.findIndex(p => p.id === proj.id) === index
  );
  const orderMap = new Map(theme.projectOrder.map((id, idx) => [id, idx] as const));
  const orderedProjects = combinedProjects.slice().sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  const visibleProjects = orderedProjects.filter(p => !theme.hiddenProjects.includes(p.id));


  const handleSave = async () => {
    try {
      // If a new avatar file was chosen, upload on Save.
      if (avatarFile) {
        setAvatarBusy(true);
        setAvatarError(null);
        const ext = (avatarFile.name.split('.').pop() || 'png').toLowerCase();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        const publicUrl = pub.publicUrl;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar: publicUrl })
          .eq('id', user.id);
        if (updateError) throw updateError;
        setEditedUser((prev: any) => ({ ...prev, avatar: publicUrl }));
      }
      // Update profile fields in DB
      const updates: any = {};
      if (editedUser.name !== user.name) updates.name = editedUser.name;
      if (displayRole === 'student' && editedUser.year !== user.year) {
        updates.year = editedUser.year;
      }
      if (editedUser.bio !== user.bio) updates.bio = editedUser.bio || null;
      if (Array.isArray(editedUser.skills)) updates.skills = editedUser.skills;
      if (editedUser.email && editedUser.email !== user.email) updates.email = editedUser.email;
      if (editedUser.location !== user.location) updates.location = editedUser.location || null;
      if (editedUser.majors !== user.majors) updates.majors = editedUser.majors || null;
      if (editedUser.github !== user.github) updates.github = editedUser.github || null;
      if (editedUser.linkedin !== user.linkedin) updates.linkedin = editedUser.linkedin || null;
      if (editedUser.portfolio !== user.portfolio) updates.portfolio = editedUser.portfolio || null;
      if (Object.keys(updates).length > 0) {
        const { error: updateInfoError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (updateInfoError) throw updateInfoError;
      }

      const merged = { ...user, ...editedUser };
      onUserUpdated?.(merged);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Save error:', err);
      setAvatarError(err?.message || 'Failed to save profile');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleReorder = (projectId: string, direction: 'up' | 'down') => {
    const order = [...theme.projectOrder];
    const idx = order.indexOf(projectId);
    if (idx === -1) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= order.length) return;
    [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
    setTheme({ ...theme, projectOrder: order });
  };
  const handleToggleHidden = (projectId: string) => {
    const hidden = new Set(theme.hiddenProjects);
    if (hidden.has(projectId)) hidden.delete(projectId); else hidden.add(projectId);
    setTheme({ ...theme, hiddenProjects: Array.from(hidden) });
  };
  const handleUploadBanner = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setTheme({ ...theme, images: { ...theme.images, banner: String(reader.result) } });
    reader.readAsDataURL(file);
  };
  const handleUploadBackground = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setTheme({ ...theme, images: { ...theme.images, background: String(reader.result) } });
    reader.readAsDataURL(file);
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const [{ jsPDF }] = await Promise.all([
        import('jspdf'),
        // Preload html2canvas in case we later expand to screenshots; keeps tree shaking happy
        import('html2canvas'),
      ]);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 16;

      const addHeading = (text: string, size = 16) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size);
        doc.text(text, 14, y);
        y += size < 16 ? 8 : 10;
      };

      const addLabelValue = (label: string, value?: string | null) => {
        if (!value) return;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${label}:`, 14, y);
        doc.setFont('helvetica', 'normal');
        const text = doc.splitTextToSize(value, pageWidth - 40);
        doc.text(text, 40, y);
        y += 6 + (text.length - 1) * 6;
      };

      addHeading('DDCT Student Resume');
      addLabelValue('Name', user.name);
      addLabelValue('Email', user.email);
      addLabelValue('Role', displayRole || 'Student');
      if (displayRole === 'student' && user.year) addLabelValue('Year', user.year);
      addLabelValue('Location', user.location);
      addLabelValue('Bio', user.bio);
      if (Array.isArray(user.skills) && user.skills.length) {
        addLabelValue('Skills', user.skills.join(', '));
      }
      if (user.majors) addLabelValue('Majors', user.majors);

      const totalProjects = combinedProjects.length;
      const featured = userProjects.filter(p => p.featured).length;
      addHeading('Project Summary', 14);
      addLabelValue('Total Projects', String(totalProjects));
      addLabelValue('Featured Projects', String(featured));

      if (combinedProjects.length) {
        addHeading('Projects', 14);
        combinedProjects.forEach((p, idx) => {
          addHeading(`${idx + 1}. ${p.title || 'Untitled Project'}`, 12);
          addLabelValue('Category', p.category);
          addLabelValue('Summary', p.description || p.summary || '');
          addLabelValue('Views', p.stats?.views != null ? String(p.stats.views) : undefined);
          addLabelValue('Featured', p.featured ? 'Yes' : undefined);
          y += 2;
          if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 16;
          }
        });
      }

      const fileName = `${(user.name || 'student').replace(/\\s+/g, '_')}_resume.pdf`;
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      // Also trigger download to ensure availability offline
      doc.save(fileName);
    } catch (err) {
      console.error('Export PDF failed', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (limitedView) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 cursor-default select-none">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="w-24 h-24 mx-auto mb-3">
                <AvatarImage src={displayAvatar || undefined} alt={user.name} />
                <AvatarImage src="/placeholder-avatar.svg" />
                <AvatarFallback className="text-2xl">{user.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">Student profile</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedUser.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm select-text">{editedUser.email}</span>
                </div>
              )}
              {editedUser.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm select-text">{editedUser.location}</span>
                </div>
              )}
              {editedUser.joinDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm select-text">Joined {editedUser.joinDate}</span>
                </div>
              )}
              {!editedUser.email && !editedUser.location && !editedUser.joinDate && (
                <p className="text-sm text-muted-foreground">No contact details provided.</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              Additional profile details and projects are visible only to the owner, partners, teachers, or admins.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 cursor-default select-none" style={{ 
      background: theme.colors.background,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
      backgroundImage: theme.images.background ? `url(${theme.images.background})` : undefined,
      backgroundSize: theme.images.background ? 'cover' : undefined,
      backgroundPosition: theme.images.background ? 'center' : undefined,
    }}>
      {/* Banner */}
      {theme.images.banner && (
        <div className="w-full h-32 rounded-lg mb-6" style={{
          backgroundImage: `url(${theme.images.banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      )}
      {isOwnProfile && !isEditing && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm" onClick={() => setThemeSidebarOpen(true)}>
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className={`mx-auto mb-4 w-24 h-24 relative ${isEditing ? 'group' : ''}`}>
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={displayAvatar || undefined}
                    alt={editedUser.name}
                    className={isEditing ? 'transition-transform duration-200 group-hover:scale-[1.02]' : ''}
                  />
                  <AvatarImage src="/placeholder-avatar.svg" />
                  <AvatarFallback className="text-2xl">{editedUser.name[0]}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button
                    type="button"
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change photo"
                  >
                    {/* Simple camera icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </button>
                )}
                {isEditing && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setAvatarError(null);
                      const f = (e.target as HTMLInputElement).files?.[0] || null;
                      if (!f) { setAvatarFile(null); setAvatarPreview(null); return; }
                      if (!f.type.startsWith('image/')) { setAvatarError('Please choose an image file'); return; }
                      if (f.size > 5 * 1024 * 1024) { setAvatarError('Image is too large (max 5MB)'); return; }
                      setAvatarFile(f);
                      const url = URL.createObjectURL(f);
                      setAvatarPreview(url);
                    }}
                    className="hidden"
                    hidden
                    aria-hidden="true"
                    style={{ display: 'none' }}
                  />
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  {avatarError && <div className="text-sm text-red-600">{avatarError}</div>}
                  <Input
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                    placeholder="Full Name"
                  />
                  {displayRole === 'student' && (
                    <Input
                      value={editedUser.year}
                      onChange={(e) => setEditedUser({ ...editedUser, year: e.target.value })}
                      placeholder="Year"
                    />
                  )}
                  <Textarea
                    value={editedUser.bio || ''}
                    onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                    placeholder="Bio"
                    rows={3}
                  />
                  <Input
                    value={editedUser.majors || ''}
                    onChange={(e) => setEditedUser({...editedUser, majors: e.target.value})}
                    placeholder="Majors (e.g., Animation, Modeling)"
                  />
                  <Input
                    value={editedUser.email || ''}
                    onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                    placeholder="Email"
                  />
                  <Input
                    value={editedUser.location || ''}
                    onChange={(e) => setEditedUser({...editedUser, location: e.target.value})}
                    placeholder="Location"
                  />
                  <Input
                    value={editedUser.github || ''}
                    onChange={(e) => setEditedUser({...editedUser, github: e.target.value})}
                    placeholder="GitHub URL"
                  />
                  <Input
                    value={editedUser.linkedin || ''}
                    onChange={(e) => setEditedUser({...editedUser, linkedin: e.target.value})}
                    placeholder="LinkedIn URL"
                  />
                  <Input
                    value={editedUser.portfolio || ''}
                    onChange={(e) => setEditedUser({...editedUser, portfolio: e.target.value})}
                    placeholder="Portfolio URL"
                  />
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editedUser.skills || []).map((skill: string) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2 py-1 text-xs"
                        >
                          {skill}
                          <button
                            type="button"
                            className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label={`Remove ${skill}`}
                            onClick={() => {
                              const next = (editedUser.skills || []).filter((s: string) => s !== skill);
                              setEditedUser({ ...editedUser, skills: next });
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const tokens = newSkill.split(/[\n,]/).map(t => t.trim()).filter(Boolean);
                          if (tokens.length) {
                            const set = new Set([...(editedUser.skills || [])]);
                            tokens.forEach(t => set.add(t));
                            setEditedUser({ ...editedUser, skills: Array.from(set) });
                            setNewSkill('');
                          }
                        }
                      }}
                      onBlur={() => {
                        const tokens = newSkill.split(/[\n,]/).map(t => t.trim()).filter(Boolean);
                        if (tokens.length) {
                          const set = new Set([...(editedUser.skills || [])]);
                          tokens.forEach(t => set.add(t));
                          setEditedUser({ ...editedUser, skills: Array.from(set) });
                          setNewSkill('');
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
                  <p className="text-xs text-muted-foreground -mt-1 mb-2 break-all">ID: {user.id}</p>
                  {displayRole === 'student' && (
                    <Badge className="mb-4 bg-primary text-primary-foreground">
                      {user.year} Student
                    </Badge>
                  )}
                  
                  {user.bio && (
                    <p className="text-muted-foreground mb-4">{user.bio}</p>
                  )}
                  
                  <div className="flex flex-col gap-2">

                    {showInlineTheme && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle>Profile Theme</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[80vh] overflow-y-auto">
                          <ProfileThemeEditor
                            theme={theme}
                            setTheme={setTheme}
                            projects={combinedProjects.map(p => ({ id: p.id, title: p.title }))}
                            onReorder={handleReorder}
                            onToggleHidden={handleToggleHidden}
                            onUploadBanner={handleUploadBanner}
                            onUploadBackground={handleUploadBackground}
                          />
                        </CardContent>
                      </Card>
                    )}
                    
                    {canExportPDF && (
                      <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={exporting}>
                        <Download className="mr-2 h-4 w-4" />
                        {exporting ? 'Preparing PDF...' : 'Export Resume PDF'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          {(editedUser.email || editedUser.location || editedUser.joinDate) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editedUser.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm select-text">{editedUser.email}</span>
                  </div>
                )}
                
                {editedUser.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm select-text">{editedUser.location}</span>
                  </div>
                )}
                
                {editedUser.joinDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm select-text">Joined {editedUser.joinDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Social Links */}
          {(editedUser.github || editedUser.linkedin || editedUser.portfolio) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {editedUser.github && (
                  <a
                    href={editedUser.github}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full inline-flex items-center justify-start rounded-md border px-3 py-2 hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    <span className="text-sm">GitHub</span>
                  </a>
                )}
                {editedUser.linkedin && (
                  <a
                    href={editedUser.linkedin}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full inline-flex items-center justify-start rounded-md border px-3 py-2 hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                  >
                    <Linkedin className="mr-2 h-4 w-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
                {editedUser.portfolio && (
                  <a
                    href={editedUser.portfolio}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full inline-flex items-center justify-start rounded-md border px-3 py-2 hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span className="text-sm">Portfolio</span>
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {editedUser.skills && editedUser.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {editedUser.skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Total Projects</span>
                </div>
                <span className="font-semibold">{combinedProjects.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Featured Projects</span>
                </div>
                <span className="font-semibold">
                  {userProjects.filter(p => p.featured).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="projects">Projects ({combinedProjects.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              {visibleProjects.length > 0 ? (
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(theme.layout.projectColumns, 1), 5)}, minmax(0, 1fr))` }}>
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={onProjectClick}
                      theme={theme}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {isOwnProfile 
                        ? "Start creating your first project to showcase your skills!"
                        : "This student hasn't published any projects yet."
                      }
                    </p>
                    {isOwnProfile && (
                      <Button onClick={() => onNavigate?.('/upload')}>Create New Project</Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>



          </Tabs>
        </div>
      </div>

      {themeSidebarOpen && (
        <div className="fixed inset-y-0 right-0 z-[200] w-[360px] max-w-[90vw] border-l shadow-xl" style={{ background: theme.colors.cardBackground || '#111827', color: theme.colors.text }}>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-semibold">Profile Theme</div>
            <button onClick={() => setThemeSidebarOpen(false)} className="inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10" aria-label="Close theme">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[calc(100%-56px)] overflow-y-auto p-3">
            <ProfileThemeEditor
              theme={theme}
              setTheme={setTheme}
              projects={combinedProjects.map(p => ({ id: p.id, title: p.title }))}
              onReorder={handleReorder}
              onToggleHidden={handleToggleHidden}
              onUploadBanner={handleUploadBanner}
              onUploadBackground={handleUploadBackground}
            />
          </div>
        </div>
      )}
    </div>
  );
}
