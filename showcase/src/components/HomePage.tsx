import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { ProjectCard } from './ProjectCard';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Users, Trophy, ArrowRight } from 'lucide-react';
import { SupabaseImage } from './figma/SupabaseImage';
import { FallingSymbols } from './FallingSymbols';
import { SteamLikeFeatured } from './SteamLikeFeatured';

interface HomePageProps {
  projects: any[];
  onProjectClick: (projectId: string) => void;
}

export function HomePage({ projects, onProjectClick }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const featuredProjects = projects.filter(p => p.featured).slice(0, 3);
  const recentProjects = projects.slice(0, 8);

  const formatCategoryId = (category: string) =>
    (category || 'Uncategorized').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const categoryMap = new Map<string, { id: string; name: string; count: number }>();
  categoryMap.set('all', { id: 'all', name: 'All Projects', count: projects.length });

  projects.forEach(project => {
    const name = project.category || 'Uncategorized';
    const id = formatCategoryId(name);
    const existing = categoryMap.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(id, { id, name, count: 1 });
    }
  });

  const categories = Array.from(categoryMap.values());

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(p => formatCategoryId(p.category) === selectedCategory);

  const upcomingEvents = [
    {
      id: 1,
      title: "DDCT Game Jam 2025",
      date: "March 15-17, 2025",
      description: "48-hour game development competition",
      participants: 156
    },
    {
      id: 2,
      title: "Animation Showcase",
      date: "April 2, 2025",
      description: "Student animation film festival",
      participants: 89
    },
    {
      id: 3,
      title: "Portfolio Review Day",
      date: "April 20, 2025",
      description: "Industry professionals review student work",
      participants: 234
    }
  ];

  return (
    <div className="relative min-h-screen">
      <FallingSymbols />
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-20">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            WHERE IMAGINATION MEETS INNOVATION
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing games, animations, and digital art created by talented students 
            from the Digital Design & Creative Technology program.
          </p>
        </div>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Featured Projects</h2>
              <Button variant="outline" className="group">
                View All Featured
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={onProjectClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-muted-foreground">Total Projects</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {new Set(projects.map(p => p.author.name)).size}
              </div>
              <div className="text-muted-foreground">Active Students</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <div className="text-muted-foreground">Upcoming Events</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Projects Section */}
        <div className="lg:col-span-3">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Browse Projects</h2>
            </div>
            
            <TabsList className="grid w-full grid-cols-6 mb-6">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.slice(0, 12).map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={onProjectClick}
                  />
                ))}
              </div>
              
              {filteredProjects.length > 12 && (
                <div className="text-center mt-8">
                  <Button variant="outline" size="lg">
                    Load More Projects
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-sm text-muted-foreground mb-1">{event.date}</p>
                  <p className="text-sm mb-2">{event.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {event.participants} participants
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center gap-3">
                  <SupabaseImage
                    src={project.thumbnail || ''}
                    alt={project.title}
                    className="w-10 h-10 rounded object-cover"
                    fallbackSrc="/placeholder-project.svg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {project.author.name}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}