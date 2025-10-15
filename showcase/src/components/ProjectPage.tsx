import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, Download, Heart, Share2, Eye, Calendar, 
  Github, ExternalLink, Play, Users, Edit 
} from 'lucide-react';
import { SupabaseImage } from './figma/SupabaseImage';

interface ProjectPageProps {
  project: any;
  onBack: () => void;
  currentUser: any;
  onEditProject?: (projectId: string) => void;
  supabase: any;
}

export function ProjectPage({ project, onBack, currentUser, onEditProject, supabase }: ProjectPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectFiles();
  }, [project.id]);

  const loadProjectFiles = async () => {
    try {
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

  // Get media files from project files
  const mediaFiles = projectFiles.filter(file => 
    file.file_type === 'image' || file.file_type === 'video'
  );

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
                fallbackSrc="/placeholder-project.jpg"
                supabase={supabase}
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
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading media...</p>
                </div>
              ) : mediaFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mediaFiles.map((file, index) => (
                    <Card key={index}>
                      <CardContent className="p-0">
                        {file.file_type === 'image' ? (
                          <SupabaseImage
                            src={file.file_url}
                            alt={file.file_name}
                            className="w-full h-48 object-cover rounded-lg"
                            fallbackSrc="/placeholder-project.jpg"
                            supabase={supabase}
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
                <Card>
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
                  <AvatarImage src={project.author?.avatar} />
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