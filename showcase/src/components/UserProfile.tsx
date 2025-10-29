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
import { 
  Edit, Download, Mail, Github, Linkedin, ExternalLink,
  Calendar, MapPin, Users, Award, BookOpen, Settings, UserPlus, Shield
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

  const canExportPDF = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const userProjects = projects.filter(p => p.author.id === user.id);
  const collaborativeProjects = projects.filter(p => 
    p.members?.some((m: any) => m.id === user.id)
  );

  const handleSave = () => {
    // Here would be the logic to save user changes
    setIsEditing(false);
  };

  const handleExportPDF = () => {
    // Logic to export PDF resume
    console.log('Exporting PDF resume for', user.name);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
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
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                    
                    {canExportPDF && (
                      <Button onClick={handleExportPDF} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Resume PDF
                      </Button>
                    )}

                    {isOwnProfile && currentUser?.role === 'admin' && (
                      <>

                      </>
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
                <span className="font-semibold">{userProjects.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Collaborations</span>
                </div>
                <span className="font-semibold">{collaborativeProjects.length}</span>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projects">My Projects ({userProjects.length})</TabsTrigger>
              <TabsTrigger value="collaborations">Collaborations ({collaborativeProjects.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              {userProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={onProjectClick}
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

            <TabsContent value="collaborations">
              {collaborativeProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {collaborativeProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={onProjectClick}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Collaborations</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile 
                        ? "Join collaborative projects to work with other students!"
                        : "This student hasn't collaborated on any projects yet."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary pl-4">
                      <p className="font-semibold">Project Published</p>
                      <p className="text-sm text-muted-foreground">
                        Published "3D Character Animation" • 2 days ago
                      </p>
                    </div>
                    
                    <div className="border-l-2 border-muted pl-4">
                      <p className="font-semibold">Collaboration Joined</p>
                      <p className="text-sm text-muted-foreground">
                        Joined "VR Experience" project • 1 week ago
                      </p>
                    </div>
                    
                    <div className="border-l-2 border-muted pl-4">
                      <p className="font-semibold">Profile Updated</p>
                      <p className="text-sm text-muted-foreground">
                        Added new skills and portfolio link • 2 weeks ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}