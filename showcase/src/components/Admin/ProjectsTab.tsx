import { useMemo, useState } from 'react';
import { TabsContent } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Eye, Download, Heart, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SupabaseImage } from '../figma/SupabaseImage';

interface ProjectsTabProps {
  projects: any[];
}

function getCategoryChipClass(category: string | undefined) {
  const key = (category || '').toLowerCase();
  switch (key) {
    case 'art':
      return 'category-chip--art';
    case 'animation':
      return 'category-chip--animation';
    case 'game':
      return 'category-chip--game';
    case 'simulation':
      return 'category-chip--simulation';
    case 'other':
      return 'category-chip--other';
    default:
      return 'tag-chip--default';
  }
}

export function ProjectsTab({ projects }: ProjectsTabProps) {
  const navigate = useNavigate();
  const [yearFilter, setYearFilter] = useState<string>('all');

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const y = p.author?.year;
      if (y && typeof y === 'string' && y.trim()) {
        set.add(y.trim());
      }
    }
    return ['all', ...Array.from(set).sort()];
  }, [projects]);

  const visibleProjects = useMemo(
    () => {
      const filtered =
        yearFilter === 'all'
          ? projects
          : projects.filter((p) => (p.author?.year || '').trim() === yearFilter);

      return [...filtered].sort(
        (a, b) =>
          new Date(b.created_at || b.updated_at || 0).getTime() -
          new Date(a.created_at || a.updated_at || 0).getTime(),
      );
    },
    [projects, yearFilter],
  );

  return (
    <TabsContent value="projects" className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Projects</CardTitle>
              <p className="text-sm text-muted-foreground">
                {visibleProjects.length} projects Â· filter by student year
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-1 border rounded-md bg-background text-sm"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y === 'all' ? 'All years' : y}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Manage All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visibleProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group flex w-full items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors cursor-pointer text-left"
                aria-label={`View ${project.title}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    <SupabaseImage
                      src={project.cover_image || project.thumbnail || ''}
                      alt={project.title}
                      className="w-16 h-16 object-cover"
                      fallbackSrc="/placeholder-project.svg"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold line-clamp-1 m-0 leading-tight group-hover:text-primary">
                        {project.title}
                      </h4>
                      {project.category && (
                        <span
                          className={`tag-chip ${getCategoryChipClass(project.category) || 'tag-chip--default'} hidden sm:inline-flex`}
                        >
                          {project.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      by {project.author?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {project.author?.year && (
                        <Badge variant="outline">{project.author.year}</Badge>
                      )}
                      {project.featured && (
                        <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{project.stats?.views ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{project.stats?.downloads ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{project.stats?.likes ?? 0}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}