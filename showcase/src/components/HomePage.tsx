import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { ProjectCard } from './ProjectCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Users, Trophy, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SupabaseImage } from './figma/SupabaseImage';
import { FallingSymbols } from './FallingSymbols';
import { SteamLikeFeatured } from './SteamLikeFeatured';

const HERO_TITLE = 'WHERE IMAGINATION MEETS INNOVATION';

function getCategoryChipClass(categoryOrTag: string | undefined) {
  const key = (categoryOrTag || '').toLowerCase();
  switch (key) {
    case 'art':
      return 'category-chip--art';
    case 'animation':
      return 'category-chip--animation';
    case 'game':
      return 'category-chip--game';
    case 'simulation':
      return 'category-chip--simulation';
    default:
      return '';
  }
}

interface HomePageProps {
  projects: any[];
  onProjectClick: (projectId: string) => void;
}

export function HomePage({ projects, onProjectClick }: HomePageProps) {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [typedTitle, setTypedTitle] = useState('');
  const [hasAppliedSearchParams, setHasAppliedSearchParams] = useState(false);
  const browseSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let currentIndex = 0;

    const intervalId = window.setInterval(() => {
      currentIndex += 1;
      setTypedTitle(HERO_TITLE.slice(0, currentIndex));

      if (currentIndex >= HERO_TITLE.length) {
        window.clearInterval(intervalId);
      }
    }, 80);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);


  const featuredProjects = projects.filter(p => p.featured).slice(0, 3);
  const recentProjects = projects.slice(0, 8);

  const formatCategoryId = (category: string) =>
    (category || 'Others').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const categoryMap = new Map<string, { id: string; name: string; count: number }>();
  categoryMap.set('all', { id: 'all', name: 'All Projects', count: projects.length });

  projects.forEach(project => {
    const name = project.category || 'Others';
    const id = formatCategoryId(name);
    const existing = categoryMap.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(id, { id, name, count: 1 });
    }
  });

  const allCategories = Array.from(categoryMap.values());
  const sortedCategories = allCategories
    .filter((c) => c.id !== 'all')
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const topCategories = sortedCategories.slice(0, 4);
  const overflowCategories = sortedCategories.slice(4);
  const overflowCategoryIds = new Set(overflowCategories.map((c) => c.id));
  const categories = [
    categoryMap.get('all')!,
    ...topCategories,
    ...(overflowCategories.length
      ? [{ id: 'other-categories', name: 'Others', count: overflowCategories.reduce((sum, c) => sum + c.count, 0) }]
      : []),
  ];

  const projectMatchesCategory = (project: any, categoryId: string) => {
    if (categoryId === 'all') return true;
    const formattedCategory = formatCategoryId(project.category);
    if (categoryId === 'other-categories') return overflowCategoryIds.has(formattedCategory);
    return formattedCategory === categoryId;
  };

  const normalizeTags = (p: any): string[] => {
    const t = p?.tags;
    if (Array.isArray(t)) return t.map((s: any) => String(s || '').trim().toLowerCase()).filter(Boolean);
    if (typeof t === 'string') return t.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    return [];
  };

  // gather all tag suggestions from the projects visible in the selected category
  const allTagsSet = new Set<string>();
  projects
    .filter((p) => projectMatchesCategory(p, selectedCategory))
    .forEach((p) => normalizeTags(p).forEach((t) => allTagsSet.add(t)));
  const allTags = Array.from(allTagsSet).sort();

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTags]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const tagsParam = params.get('tags');

    if (!hasAppliedSearchParams && (categoryParam || tagsParam)) {
      if (categoryParam) {
        const categoryExists = categories.some((c) => c.id === categoryParam);
        if (categoryExists) {
          setSelectedCategory(categoryParam);
        } else if (overflowCategoryIds.has(categoryParam)) {
          setSelectedCategory('other-categories');
        }
      }

      if (tagsParam) {
        const rawTags = tagsParam
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const validTags = rawTags.filter((t) => allTags.includes(t));
        if (validTags.length > 0) {
          setSelectedTags(validTags);
        }
      }

      setHasAppliedSearchParams(true);
    }
  }, [location.search, categories, allTags, hasAppliedSearchParams]);

  // Drop any selected tags that no longer exist in the current category
  useEffect(() => {
    if (selectedTags.length === 0) return;
    const available = new Set(allTags);
    const filtered = selectedTags.filter((t) => available.has(t));
    if (filtered.length !== selectedTags.length) {
      setSelectedTags(filtered);
    }
  }, [allTags, selectedTags]);

  const filteredProjects = projects.filter((project) => {
    const matchesCategory = (() => {
      return projectMatchesCategory(project, selectedCategory);
    })();

    if (!matchesCategory) return false;
    if (selectedTags.length === 0) return true;

    const tags = normalizeTags(project);
    return selectedTags.every((t) => tags.includes(t));
  });

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProjects = filteredProjects.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
      <div className="mb-12 min-h-screen flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {typedTitle}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing games, animations, and digital art created by talented students 
            from the Digital Design & Creative Technology program.
          </p>
        </div>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div id="featured-projects" className="mb-12">
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
         
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-10">
        {/* Projects Section */}
        <div ref={browseSectionRef} className="md:col-span-4 order-2 md:order-1">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-center sm:text-left">Browse Projects</h2>
            </div>
            
            <TabsList className="flex flex-wrap justify-center gap-2 w-full mb-6">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  {category.name}
                  <span className="ml-2 text-muted-foreground text-xs font-medium">
                    {category.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {allTags.map((t) => {
                  const active = selectedTags.includes(t);
                  const categoryClass = getCategoryChipClass(t);
                  const baseClass = categoryClass || 'tag-chip--default';
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`tag-chip tag-chip--interactive ${baseClass} ${active ? 'tag-chip--active' : ''}`}
                      onClick={() => {
                        setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                      }}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            )}

            <TabsContent value={selectedCategory}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={onProjectClick}
                  />
                ))}
              </div>
              {filteredProjects.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">No projects in this filter.</div>
              )}
              
              {filteredProjects.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {safePage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-10 order-1 md:order-2">
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity removed */}
        </div>
      </div>
      </div>
    </div>
  );
}
