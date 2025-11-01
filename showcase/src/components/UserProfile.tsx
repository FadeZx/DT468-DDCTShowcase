import { useState } from 'react';
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
}

export function UserProfile({ user, projects, isOwnProfile, currentUser, onProjectClick, onNavigate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [showInlineTheme, setShowInlineTheme] = useState(false);
  const [themeSidebarOpen, setThemeSidebarOpen] = useState(false);

  const [theme, setTheme] = useState<ProfileTheme>({
    colors: { background: '#0b0b0b', text: '#ffffff', accent: '#7c3aed', cardBackground: '#111827' },
    typography: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, headingSize: 18 },
    layout: { projectColumns: 3, borderRadius: 8 },
    images: {},
    projectOrder: projects.map((p) => p.id),
    hiddenProjects: [],
  });
  
  const canExportPDF = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
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

  const handleSave = () => {
    // Here would be the logic to save user changes (persist to backend)
    setIsEditing(false);
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

  const handleExportPDF = () => {
    // Logic to export PDF resume
    console.log('Exporting PDF resume for', user.name);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8" style={{ 
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="/placeholder-avatar.svg" />
                <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                    placeholder="Full Name"
                  />
                  <Input
                    value={editedUser.year}
                    onChange={(e) => setEditedUser({...editedUser, year: e.target.value})}
                    placeholder="Year"
                  />
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
                  <Input
                    value={(editedUser.skills || []).join(', ')}
                    onChange={(e) => setEditedUser({...editedUser, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)})}
                    placeholder="Skills (comma-separated)"
                  />
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
                  <Badge className="mb-4 bg-primary text-primary-foreground">
                    {user.year} Student
                  </Badge>
                  
                  {user.bio && (
                    <p className="text-muted-foreground mb-4">{user.bio}</p>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    {isOwnProfile && (
                      <div className="flex gap-2">
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
                      <Button onClick={handleExportPDF} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Resume PDF
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              
              {user.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.location}</span>
                </div>
              )}
              
              {user.joinDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Joined {user.joinDate}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          {(user.github || user.linkedin || user.portfolio) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.github && (
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                )}
                
                {user.linkedin && (
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </Button>
                )}
                
                {user.portfolio && (
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Portfolio
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {user.skills && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill: string) => (
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
                      <Button>Create New Project</Button>
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