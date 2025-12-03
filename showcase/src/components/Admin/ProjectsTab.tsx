import { useMemo, useState } from 'react';
import { TabsContent } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SupabaseImage } from '../figma/SupabaseImage';
import { cleanupOrphanedProjectStorage } from '../../utils/fileStorage';

interface ProjectsTabProps {
  projects: any[];
}

export function ProjectsTab({ projects }: ProjectsTabProps) {
  const navigate = useNavigate();
  const [cleaning, setCleaning] = useState(false);

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.created_at || b.updated_at || 0).getTime() -
            new Date(a.created_at || a.updated_at || 0).getTime(),
        )
        .slice(0, 5),
    [projects],
  );

  const handleCleanStorage = async () => {
    if (cleaning) return;
    setCleaning(true);
    try {
      const { removed, kept } = await cleanupOrphanedProjectStorage();
      alert(`Orphaned storage cleanup completed. Removed ${removed} files. Kept ${kept}.`);
    } catch (e) {
      console.error('Cleanup failed', e);
      alert('Storage cleanup failed. See console for details.');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <TabsContent value="projects" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Projects
            <div className="flex items-center gap-2">
              <Button size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Manage All
              </Button>
              <Button size="sm" variant="outline" onClick={handleCleanStorage} disabled={cleaning}>
                {cleaning ? 'Cleaning…' : 'Clean Storage'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex items-center gap-2 text-left hover:opacity-90 focus:outline-none p-0 m-0 bg-transparent"
                  aria-label={`View ${project.title}`}
                >
                  <div className="w-16 h-16 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    <SupabaseImage
                      src={project.cover_image || project.thumbnail || ''}
                      alt={project.title}
                      className="w-16 h-16 object-cover"
                      fallbackSrc="/placeholder-project.svg"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold line-clamp-1 m-0 leading-tight">{project.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      by {project.author.name} • {project.category}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{project.author.year}</Badge>
                      {project.featured && (
                        <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                      )}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-3">
                  <div className="text-right text-sm min-w-[120px]">
                    <div>{project.stats.views} views</div>
                    <div>{project.stats.downloads ?? 0} downloads</div>
                    <div className="text-muted-foreground">{project.stats.likes} likes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

