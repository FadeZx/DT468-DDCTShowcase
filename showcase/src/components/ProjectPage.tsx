import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import {
  ArrowLeft, Download, Heart, Share2, Eye, Calendar,
  Github, ExternalLink, Play, Users, Edit, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { SupabaseImage } from './figma/SupabaseImage';

interface ProjectPageProps {
  project: any;
  onBack: () => void;
  currentUser: any;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  supabase: any;
}

export function ProjectPage({ project, onBack, currentUser, onEditProject, onDeleteProject, supabase }: ProjectPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [projectFiles, setProjectFiles] = useState<any[]>(project.media?.all || project.media || []);
  const [loading, setLoading] = useState(!(project.media?.all?.length || project.media?.length));
  // Steam-like gallery state (using placeholders for now)
  const placeholderImages = [
    'https://picsum.photos/seed/1/1280/720',
    'https://picsum.photos/seed/2/1280/720',
    'https://picsum.photos/seed/3/1280/720',
    'https://picsum.photos/seed/4/1280/720',
    'https://picsum.photos/seed/5/1280/720',
  ];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (project.media?.all || Array.isArray(project.media)) {
      setProjectFiles(project.media?.all || project.media || []);
      setLoading(false);
    } else {
      loadProjectFiles();
    }
  }, [project.id, project.media?.all, Array.isArray(project.media) ? project.media.length : undefined]);

  const loadProjectFiles = async () => {
    try {
      setLoading(true);
      const { data: files, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', project.id);

      if (error) {
        console.error('Error loading project files:', error);
        // If table doesn't exist, just set empty array
        setProjectFiles([]);
      } else {
        setProjectFiles(files || []);
      }
    } catch (error) {
      console.error('Error loading project files:', error);
      // If there's any error, set empty array to prevent crashes
      setProjectFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = currentUser && (
    currentUser.id === project.author_id ||
    currentUser.role === 'admin'
  );

  const canDelete = currentUser && (
    currentUser.id === project.author_id ||
    currentUser.role === 'admin'
  );

  // Get media files from project files
  const mediaFiles = projectFiles.filter(file => 
    file.file_type === 'image' || file.file_type === 'video'
  );

  // Build gallery images list (prefer uploaded images, fallback to placeholders)
  const imageFiles = mediaFiles.filter(file => file.file_type === 'image');
  const galleryImages: string[] = imageFiles.length
    ? imageFiles.map((file) => file.file_url)
    : placeholderImages;

  // Keep active image index in range when gallery changes
  useEffect(() => {
    setActiveImage((prev) => (galleryImages.length ? Math.min(prev, galleryImages.length - 1) : 0));
  }, [project.id, galleryImages.length]);

  // Get downloadable files
  const downloadableFiles = projectFiles.filter(file => 
    file.file_type === 'project' || file.file_type === 'document'
  );

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
            {project.status === 'published' && (
              <Badge variant="outline">Published</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {canEdit && onEditProject && (
            <Button
              variant="outline"
              onClick={() => onEditProject(project.id)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Project
            </Button>
          )}
          {canDelete && onDeleteProject && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to delete this project?')) {
                  onDeleteProject(project.id);
                }
              }}
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Media Gallery */}
          <Card>
            <CardContent className="p-0">
              <SupabaseImage
                src={project.cover_image || ''}
                alt={project.title}
                className="w-full h-80 object-cover rounded-lg"
                fallbackSrc="/placeholder-project.svg"
              />
            </CardContent>
          </Card>

          {/* Project Details */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About This Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {project.long_description || project.description || 'No detailed description available for this project.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>
                  
                  {project.tools && typeof project.tools === 'string' && project.tools.trim() && (
                    <div>
                      <h4 className="font-semibold mb-2">Tools Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.tools.split(',').map((tool: string, index: number) => (
                          <Badge key={index} variant="outline">{tool.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {project.technologies && typeof project.technologies === 'string' && project.technologies.trim() && (
                    <div>
                      <h4 className="font-semibold mb-2">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.split(',').map((tech: string, index: number) => (
                          <Badge key={index} variant="secondary">{tech.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.collaborators && project.collaborators.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Collaborators</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.collaborators.map((collaborator: any) => (
                          <Badge key={collaborator.id} variant="outline">
                            {collaborator.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Created</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              {/* Steam-like gallery inside Media tab */}
              <Card>
                <CardContent className="p-0">
                  <div className="w-full">
                    {/* Main image */}
                    <div className="relative">
                      <img
                        src={galleryImages[activeImage]}
                        alt={`Screenshot ${activeImage + 1}`}
                        className="w-full aspect-video object-cover rounded-t-lg"
                      />
                      <button
                        type="button"
                        aria-label="Previous screenshot"
                        onClick={() => setActiveImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/40 text-white hover:bg-black/60"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next screenshot"
                        onClick={() => setActiveImage((prev) => (prev + 1) % galleryImages.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/40 text-white hover:bg-black/60"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Thumbnails */}
                    <div className="flex gap-2 p-3 overflow-x-auto bg-muted/30 rounded-b-lg">
                      {galleryImages.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(idx)}
                          className={`relative h-20 aspect-video rounded-md overflow-hidden border ${idx === activeImage ? 'ring-2 ring-primary border-primary' : 'border-transparent hover:border-primary/40'}`}
                          aria-label={`Go to screenshot ${idx + 1}`}
                        >
                          <img src={src} alt={`Thumbnail ${idx + 1}`} className="h-full w-auto object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing media grid (optional to keep below) */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading media...</p>
                </div>
              ) : mediaFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {mediaFiles.map((file, index) => (
                    <Card key={index}>
                      <CardContent className="p-0">
                        {file.file_type === 'image' ? (
                          <SupabaseImage
                            src={file.file_url}
                            alt={file.file_name}
                            className="w-full h-48 object-cover rounded-lg"
                            fallbackSrc="/placeholder-project.svg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                            <Play className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">{file.file_type}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="mt-4">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No media files uploaded for this project.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading files...</p>
                </div>
              ) : downloadableFiles.length > 0 ? (
                <div className="space-y-3">
                  {downloadableFiles.map((file, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{file.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.file_type} • {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No downloadable files available for this project.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Status</h4>
                      <Badge className={
                        project.status === 'published' ? 'bg-green-100 text-green-800' :
                        project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Category</h4>
                      <p className="text-sm text-muted-foreground">{project.category}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Created</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Last Updated</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {project.github_url && (
                    <div>
                      <h4 className="font-semibold mb-2">Source Code</h4>
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          View on GitHub
                        </a>
                      </Button>
                    </div>
                  )}
                  
                  {project.demo_url && (
                    <div>
                      <h4 className="font-semibold mb-2">Live Demo</h4>
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Demo
                        </a>
                      </Button>
                    </div>
                  )}
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
              {project.demo_url && (
                <Button className="w-full" size="lg" asChild>
                  <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                    <Play className="mr-2 h-4 w-4" />
                    View Project
                  </a>
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {downloadableFiles.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('files')}>
                    <Download className="mr-2 h-4 w-4" />
                    Files ({downloadableFiles.length})
                  </Button>
                )}
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
                <span className="font-semibold">{project.views || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Downloads</span>
                </div>
                <span className="font-semibold">{project.downloads || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Likes</span>
                </div>
                <span className="font-semibold">{project.likes || 0}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Published</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
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
                  <AvatarImage src="/placeholder-avatar.svg" />
                  <AvatarFallback>{project.author?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{project.author?.name || 'Unknown Author'}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.author?.year ? `${project.author.year} Student` : 'Student'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
                
                {project.github_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      View Source
                    </a>
                  </Button>
                )}
                
                {project.demo_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Live Demo
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {project.tags && typeof project.tags === 'string' && project.tags.trim() && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags.split(',').map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}