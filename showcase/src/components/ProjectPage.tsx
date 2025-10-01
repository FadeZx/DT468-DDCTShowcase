import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, Download, Heart, Share2, Eye, Calendar, 
  Github, ExternalLink, Play, Users 
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProjectPageProps {
  project: any;
  onBack: () => void;
  currentUser: any;
}

export function ProjectPage({ project, onBack, currentUser }: ProjectPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const canEdit = currentUser && (
    currentUser.id === project.author.id || 
    currentUser.role === 'admin' ||
    project.collaborators?.some((c: any) => c.id === currentUser.id)
  );

  const mediaItems = [
    { type: 'image', url: project.thumbnail, caption: 'Main Screenshot' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1745223676002-b881b2a19089?w=800', caption: 'Gameplay Screenshot 1' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1728671404196-3583750ed3d9?w=800', caption: 'Character Design' },
    { type: 'video', url: '#', caption: 'Demo Video' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <Badge className="bg-primary text-primary-foreground">
              {project.category}
            </Badge>
            {project.featured && (
              <Badge variant="outline">Featured</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        {canEdit && (
          <Button variant="outline">
            Edit Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Media Gallery */}
          <Card>
            <CardContent className="p-0">
              <ImageWithFallback
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-80 object-cover rounded-lg"
              />
            </CardContent>
          </Card>

          {/* Project Details */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="devlog">Dev Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About This Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {project.longDescription || `${project.description} This is an expanded description of the project, showcasing the creative process, technical challenges overcome, and the learning outcomes achieved during development. The project demonstrates proficiency in various digital design and creative technology skills.`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Tools Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {(project.tools || ['Unity', 'Blender', 'Photoshop']).map((tool: string) => (
                        <Badge key={tool} variant="outline">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {(project.technologies || ['C#', '3D Modeling', 'Game Design']).map((tech: string) => (
                        <Badge key={tech} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Development Timeline</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.timeline || '8 weeks (September - November 2024)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-0">
                      {item.type === 'image' ? (
                        <ImageWithFallback
                          src={item.url}
                          alt={item.caption}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                          <Play className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm text-muted-foreground">{item.caption}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comments & Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Comments and feedback from peers and instructors will appear here.
                    This feature encourages collaboration and constructive criticism.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="devlog" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Development Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Development progress and updates from the project creator.
                    This section documents the creative journey and learning process.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button className="w-full" size="lg">
                <Play className="mr-2 h-4 w-4" />
                Play/View Project
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={isLiked ? 'text-red-500 border-red-500' : ''}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </CardContent>
          </Card>

          {/* Project Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Project Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Views</span>
                </div>
                <span className="font-semibold">{project.stats.views}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Downloads</span>
                </div>
                <span className="font-semibold">{project.stats.downloads}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Likes</span>
                </div>
                <span className="font-semibold">{project.stats.likes}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Published</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {project.publishedDate || 'Oct 1, 2024'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle>Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarImage src={project.author.avatar} />
                  <AvatarFallback>{project.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{project.author.name}</p>
                  <p className="text-sm text-muted-foreground">{project.author.year} Student</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
                
                {project.links?.github && (
                  <Button variant="outline" size="sm" className="w-full">
                    <Github className="mr-2 h-4 w-4" />
                    View Source
                  </Button>
                )}
                
                {project.links?.external && (
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    External Link
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collaborators */}
          {project.collaborators && project.collaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Collaborators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.collaborators.map((collab: any) => (
                  <div key={collab.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={collab.avatar} />
                      <AvatarFallback className="text-xs">{collab.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{collab.name}</p>
                      <p className="text-xs text-muted-foreground">{collab.role}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}