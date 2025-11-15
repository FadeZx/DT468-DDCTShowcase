import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge-simple';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Calendar,
  Heart,
  MoreVertical,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface MyProjectsPageProps {
  currentUser: any;
  projects: any[];
  onNavigate: (page: string) => void;
  onEditProject: (projectId: string) => void;
  onViewProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function MyProjectsPage({
  currentUser,
  projects,
  onNavigate,
  onEditProject,
  onViewProject,
  onDeleteProject
}: MyProjectsPageProps) {
  const [filter, setFilter] = useState<'all' | 'public' | 'unlisted'>('all');
  
  // Filter projects to show only current user's projects
  const userProjects = projects.filter(project => project.author_id === currentUser?.id);

  const normalizeVisibility = (v?: string) => {
    if (v === 'draft' || v === 'private' || !v) return 'unlisted';
    return v;
  };

  const filteredProjects = userProjects.filter(project => {
    if (filter === 'all') return true;
    return normalizeVisibility(project.visibility) === filter;
  });

  const getVisibilityColor = (v: string) => {
    switch (v) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'unlisted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-600">Manage and track your uploaded projects</p>
          </div>
          <Button 
            onClick={() => onNavigate('/upload')}
            className="bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload New Project
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Projects', count: userProjects.length },
              { key: 'public', label: 'Public', count: userProjects.filter(p => normalizeVisibility(p.visibility) === 'public').length },
              { key: 'unlisted', label: 'Unlisted', count: userProjects.filter(p => normalizeVisibility(p.visibility) === 'unlisted').length }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                onClick={() => setFilter(key as any)}
                size="sm"
                className="flex items-center gap-2"
              >
                {label}
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p>
                  {filter === 'all' 
                    ? "You haven't uploaded any projects yet." 
                    : `No ${filter.replace('-', ' ')} projects found.`
                  }
                </p>
              </div>
              {filter === 'all' && (
                <Button 
                  onClick={() => onNavigate('/upload')}
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                >
                  Upload Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const projectVisibility = normalizeVisibility(project.visibility);
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getVisibilityColor(projectVisibility)}>
                          {projectVisibility.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {project.category}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewProject(project.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditProject(project.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <SupabaseImage
                    src={project.cover_image || '/placeholder-project.svg'}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    fallbackSrc="/placeholder-project.svg"
                  />
                </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {project.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {project.stats?.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {project.downloads || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {project.likes || 0}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-gray-400 space-y-1">
                    {(projectVisibility === 'public') && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Published: {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    )}
                    <div>Last modified: {new Date(project.updated_at).toLocaleDateString()}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onViewProject(project.id)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditProject(project.id)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {filteredProjects.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userProjects.length}
                </div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userProjects.filter(p => p.visibility === 'public').length}
                </div>
                <div className="text-sm text-gray-600">Published</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {userProjects.reduce((sum, p) => sum + (p.stats?.views || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {userProjects.reduce((sum, p) => sum + (p.downloads || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Downloads</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

