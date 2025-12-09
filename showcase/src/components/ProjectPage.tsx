import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  ArrowLeft, Download, Heart, Share2, Eye, Calendar,
  Github, ExternalLink, Play, Users, Edit, Trash2, ChevronLeft, ChevronRight, Crown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SupabaseImage } from './figma/SupabaseImage';
import { AspectRatio } from './ui/aspect-ratio';
import Slider from 'react-slick';
import { ProjectComments } from './ProjectComments';
import { getDownloadUrl, getBestFileUrl, getInlineFileUrl } from '../utils/fileStorage';
import { useProjectLikes } from '../hooks/useProjectLikes';

const FILE_CONTENT_LABELS: Record<string, string> = {
  download: 'Download',
  executable: 'Executable',
  soundtrack: 'Soundtrack',
  source: 'Source code',
  document: 'Book / Document',
  video: 'Video',
  mod: 'Mod',
  graphics: 'Graphical assets',
  audio: 'Audio assets',
  instructions: 'Documentation / Instructions'
};
const getBaseFileType = (value?: string | null) => {
  if (!value) return '';
  const [base] = value.split(':');
  return base || value;
};
const getContentKind = (value?: string | null) => {
  if (!value) return null;
  const [, kind] = value.split(':');
  return kind || null;
};
const formatContentLabel = (value?: string | null) => {
  const kind = getContentKind(value);
  if (kind) return FILE_CONTENT_LABELS[kind] || FILE_CONTENT_LABELS.download;
  const base = getBaseFileType(value);
  if (base === 'document') return FILE_CONTENT_LABELS.document;
  return FILE_CONTENT_LABELS.download;
};

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
    default:
      return '';
  }
}

function formatCategoryId(category: string | undefined) {
  return (category || 'Others').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

type GalleryMediaItem = { type: 'image' | 'video'; url: string; name?: string; thumb?: string };

interface ProjectPageProps {
  project: any;
  onBack: () => void;
  currentUser: any;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  supabase: any;
  onProjectUpdate?: () => void;
}

export function ProjectPage({ project, onBack, currentUser, onEditProject, onDeleteProject, supabase, onProjectUpdate }: ProjectPageProps) {
  const navigate = useNavigate();
  const [projectFiles, setProjectFiles] = useState<any[]>(project.media?.all || project.media || []);
  const [loading, setLoading] = useState(!(project.media?.all?.length || project.media?.length));
  const [webglUrls, setWebglUrls] = useState<Record<string, string>>({});
  // Ensure we start at the top when entering the project page
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      // Fallback for environments that don't support the options object
      window.scrollTo(0, 0);
    }
  }, []);
  // Steam-like gallery state (using placeholders for now)
  const placeholderImages = [
    'https://picsum.photos/seed/1/1280/720',
    'https://picsum.photos/seed/2/1280/720',
    'https://picsum.photos/seed/3/1280/720',
    'https://picsum.photos/seed/4/1280/720',
    'https://picsum.photos/seed/5/1280/720',
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isHoveringMain, setIsHoveringMain] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<any>(null);
  const attemptedFetchRef = useRef(false);
  const sliderSettings = { infinite: false, slidesToShow: 3, slidesToScroll: 1, arrows: false, swipeToSlide: true } as const;

  // Use the project likes hook
  const { likesCount, isLiked, loading: likesLoading, toggleLike } = useProjectLikes({
    projectId: project.id,
    currentUser,
    supabase,
    onLikeChange: onProjectUpdate,
    enabled: project.visibility === 'public'
  });

  const fullDescriptionHtml = useMemo(() => {
    const html = typeof project.full_description === 'string' ? project.full_description.trim() : '';
    return html;
  }, [project.full_description]);


  useEffect(() => {
    const providedAll = Array.isArray(project.media?.all) ? project.media.all : null;
    const providedDirect = Array.isArray(project.media) ? project.media : null;
    const incoming = providedAll ?? providedDirect ?? null;
    const incomingLen = Array.isArray(incoming) ? incoming.length : 0;

    if (incoming && incomingLen > 0) {
      console.log('[ProjectPage] Using provided project.media files:', { projectId: project.id, count: incomingLen, files: incoming });
      setProjectFiles(incoming);
      setLoading(false);
    } else if (!attemptedFetchRef.current) {
      attemptedFetchRef.current = true;
      console.log('[ProjectPage] No provided media (or empty). Fetching project_files from Supabase for project:', project.id);
      loadProjectFiles();
    } else {
      console.warn('[ProjectPage] No media available after fetch.');
      setProjectFiles([]);
      setLoading(false);
    }
  }, [project.id, Array.isArray(project.media?.all) ? project.media.all.length : 0, Array.isArray(project.media) ? project.media.length : 0]);

  const loadProjectFiles = async () => {
    try {
      setLoading(true);
      const { data: files, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', project.id);

      if (error) {
        console.error('[ProjectPage] Error loading project files:', error);
        // If table doesn't exist, just set empty array
        setProjectFiles([]);
      } else {
        console.log('[ProjectPage] Loaded project_files:', { projectId: project.id, count: (files||[]).length, files });
        setProjectFiles(files || []);
      }
    } catch (error) {
      console.error('[ProjectPage] Exception loading project files:', error);
      // If there's any error, set empty array to prevent crashes
      setProjectFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const [isCollaborator, setIsCollaborator] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function checkCollaborator() {
      try {
        if (!currentUser?.id) { if (mounted) setIsCollaborator(false); return; }
        const { data } = await supabase
          .from('project_collaborators')
          .select('user_id')
          .eq('project_id', project.id)
          .eq('user_id', currentUser.id)
          .limit(1);
        if (!mounted) return;
        setIsCollaborator(!!(data && data.length));
      } catch {
        if (mounted) setIsCollaborator(false);
      }
    }
    checkCollaborator();
    return () => { mounted = false; };
  }, [project.id, currentUser?.id, supabase]);

  const canEdit = !!currentUser && (
    currentUser.id === project.author_id ||
    currentUser.role === 'admin' ||
    isCollaborator
  );

  const canDelete = !!currentUser && (
    currentUser.id === project.author_id ||
    currentUser.role === 'admin'
  );

  // Get media files from project files (images/videos)
  const mediaFiles = useMemo(
    () => projectFiles.filter(file => (file.file_type === 'image' || file.file_type === 'video') && ((file.file_path && (file.file_path.startsWith('projects/') || file.file_path.startsWith('external:'))) || !!file.file_url)),
    [projectFiles]
  );
  // Sort: cover first, then by created_at asc
  const mediaFilesSorted = useMemo(() => {
    const sorted = [...mediaFiles].sort((a, b) => {
      const ac = a.is_cover ? 1 : 0;
      const bc = b.is_cover ? 1 : 0;
      if (bc - ac !== 0) return bc - ac;
      const at = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return at - bt;
    });
    return sorted;
  }, [mediaFiles]);

  // Build unified media list with thumbnail support for videos (YouTube etc.)
  const baseGalleryMedia = useMemo<GalleryMediaItem[]>(() => {
    return mediaFilesSorted
      .map((file) => {
        const path = file.file_path || '';
        const external = path.startsWith('external:') ? path.replace(/^external:/, '') : '';
        const storage = path.startsWith('projects/') ? path : '';
        const direct = file.file_url || external || storage;
        let url = direct || '';

        const ensureYoutubeThumb = (u: string): string => {
          try {
            // Support watch?v=ID, youtu.be/ID, /embed/ID, /shorts/ID
            const idMatch = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/);
            const id = idMatch ? idMatch[1] : '';
            return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
          } catch {
            return '';
          }
        };

        let thumb = '';
        if (file.file_type === 'image') {
          thumb = url;
        } else if (file.file_type === 'video') {
          thumb = file.thumbnail_url || ensureYoutubeThumb(url) || '';
        }
        const safeThumb = thumb && thumb.trim().length > 0 ? thumb : '/placeholder-project.svg';

        if (file.file_type === 'video') {
          try {
            const u = String(url || '');
            let m = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/);
            if (m && m[1]) {
              url = `https://www.youtube.com/embed/${m[1]}?rel=0`;
            } else {
              const vm = u.match(/vimeo\.com\/(\d+)/);
              if (vm && vm[1]) {
                url = `https://player.vimeo.com/video/${vm[1]}`;
              }
            }
          } catch {}
        }
        return { type: file.file_type as 'image' | 'video', url, name: file.file_name, thumb: safeThumb };
      })
      .filter((m) => !!m.url);
  }, [mediaFilesSorted]);

  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaItem[]>(baseGalleryMedia);
  const webglFiles = useMemo(() => {
    return projectFiles.filter((file) => getBaseFileType(file.file_type) === 'webgl');
  }, [projectFiles]);
  const webglKey = (file: any) => String(file?.id || file?.file_path || file?.file_url || '');

  useEffect(() => {
    let cancelled = false;
    const resolveWebgl = async () => {
      const resolved: Record<string, string> = {};
      for (const file of webglFiles) {
        const key = webglKey(file);
        if (!key) continue;
        try {
          const path = file.file_path as string | undefined;
          let url = '';
          if (path && (path.startsWith('projects/') || path.startsWith('external:') || path.startsWith('public/'))) {
            url = await getInlineFileUrl(String(path), 7200);
          } else if (file.file_url) {
            url = String(file.file_url);
          }
          if (url) {
            resolved[key] = url;
          }
        } catch (error) {
          console.warn('[ProjectPage] Failed to resolve WebGL URL', error);
        }
      }
      if (!cancelled) {
        setWebglUrls(resolved);
      }
    };
    resolveWebgl();
    return () => {
      cancelled = true;
    };
  }, [project.id, webglFiles.map((f) => `${f.id || f.file_path || f.file_url || ''}`).join('|')]);

  const primaryWebglFile = webglFiles[0];
  const primaryWebglUrl = primaryWebglFile ? webglUrls[webglKey(primaryWebglFile)] : '';

  useEffect(() => {
    let cancelled = false;
    setGalleryMedia(baseGalleryMedia);

    const needsSignedUrl = baseGalleryMedia.some(
      (item) => item.url?.startsWith('projects/') || item.thumb?.startsWith('projects/')
    );
    if (!needsSignedUrl) {
      return () => {
        cancelled = true;
      };
    }

    const resolveMediaUrls = async () => {
      const resolved = await Promise.all(
        baseGalleryMedia.map(async (item) => {
          let nextUrl = item.url;
          let nextThumb = item.thumb;
          try {
            if (nextUrl?.startsWith('projects/')) {
              nextUrl = await getBestFileUrl(nextUrl, 3600);
            }
            if (nextThumb?.startsWith('projects/')) {
              nextThumb = await getBestFileUrl(nextThumb, 3600);
            }
          } catch (error) {
            console.warn('[ProjectPage] Failed to resolve media URL', { item }, error);
          }
          return { ...item, url: nextUrl, thumb: nextThumb };
        })
      );
      if (!cancelled) {
        setGalleryMedia(resolved);
      }
    };

    resolveMediaUrls();

    return () => {
      cancelled = true;
    };
  }, [baseGalleryMedia]);

  console.log('[ProjectPage] galleryMedia built:', { projectId: project.id, count: baseGalleryMedia.length, galleryMedia: baseGalleryMedia, rawFilesCount: projectFiles.length, rawFiles: projectFiles });


  // Autoplay: images advance after delay; videos advance onEnded
  useEffect(() => {
    if (!autoPlay || isHoveringMain || galleryMedia.length <= 1) return;
    const current = galleryMedia[activeIndex];
    if (!current || current.type === 'video') return; // videos handled via onEnded
    const id = setTimeout(() => {
      setActiveIndex((prev) => (galleryMedia.length ? (prev + 1) % galleryMedia.length : 0));
    }, 4000);
    return () => clearTimeout(id);
  }, [autoPlay, isHoveringMain, galleryMedia, activeIndex]);

  // Preload next image to reduce perceived latency when advancing
  useEffect(() => {
    if (!galleryMedia.length) return;
    const next = galleryMedia[(activeIndex + 1) % galleryMedia.length];
    if (next?.type === 'image') {
      const img = new Image();
      img.src = next.url;
    }
  }, [activeIndex, galleryMedia]);

  // Keep active index in range when gallery changes
  useEffect(() => {
    setActiveIndex((prev) => (galleryMedia.length ? Math.min(prev, galleryMedia.length - 1) : 0));
  }, [project.id, galleryMedia.length]);

  // Get downloadable files
  const downloadableFiles = projectFiles.filter(file => {
    const base = getBaseFileType(file.file_type);
    return base === 'project' || base === 'document';
  });
  const handleDownload = async (file: any) => {
    try {
      let url = '';
      const path = file.file_path as string | undefined;
      const fileName = (file.file_name as string | undefined) || 'download';
      // Prefer storage path so we can request a download-disposition URL
      if (path) {
        url = await getDownloadUrl(String(path), fileName, 3600);
      } else if (file.file_url && (String(file.file_url).startsWith('http') || String(file.file_url).startsWith('/'))) {
        // If only a direct URL exists, fall back to it
        url = String(file.file_url);
      }
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      // Do not set target; let browser download directly
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('[ProjectPage] Download error', e);
      try {
        let fallback = '';
        if (file.file_path) {
          fallback = await getDownloadUrl(String(file.file_path), String(file.file_name || 'download'), 3600);
        } else if (file.file_url) {
          fallback = String(file.file_url);
        }
        if (fallback) {
          const a = document.createElement('a');
          a.href = fallback;
          a.download = String(file.file_name || 'download');
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } catch {}
    }
  };

  const parseTags = () => {
    const raw = project.tags;
    const tagsArray = Array.isArray(raw)
      ? raw
      : (typeof raw === 'string'
        ? raw.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []);

    return tagsArray
      .map((tag: string) => {
        const label = tag.trim().replace(/^#+/, '') || tag;
        const value = label.toLowerCase();
        return { label, value };
      })
      .filter((t) => !!t.value);
  };

  const tags = parseTags();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold select-text">{project.title}</h1>
            {project.category && (
              <Link
                to={`/?category=${encodeURIComponent(formatCategoryId(project.category))}`}
                className={`tag-chip tag-chip--interactive ${getCategoryChipClass(project.category) || 'tag-chip--default'}`}
              >
                {project.category}
              </Link>
            )}
          </div>
          <p className="text-muted-foreground select-text">{project.description}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Steam-like hero media carousel with custom thumbnail strip */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Main media viewer */}
              <div className="relative w-full bg-black rounded-lg overflow-hidden" onMouseEnter={() => setIsHoveringMain(true)} onMouseLeave={() => setIsHoveringMain(false)}>
                <AspectRatio ratio={16/9}>
                  <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                    {galleryMedia.length > 0 ? (
                      galleryMedia[activeIndex]?.type === 'video' ? (
                        <iframe
                          key={galleryMedia[activeIndex].url}
                          src={galleryMedia[activeIndex].url}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                          title={galleryMedia[activeIndex].name || project.title}
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
                          <SupabaseImage
                            src={galleryMedia[activeIndex].url}
                            alt={galleryMedia[activeIndex].name || project.title}
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                            fallbackSrc="/placeholder-project.svg"
                          />
                        </div>
                      )
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
                        <img src={placeholderImages[0]} alt="Placeholder" className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg" />
                      </div>
                    )}

                    {/* Nav buttons */}
                    {galleryMedia.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Previous"
                          onClick={() => setActiveIndex((prev) => (prev - 1 + galleryMedia.length) % galleryMedia.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/40 text-white hover:bg-black/60 cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next"
                          onClick={() => setActiveIndex((prev) => (prev + 1) % galleryMedia.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/40 text-white hover:bg-black/60 cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </AspectRatio>
              </div>

              {/* Steam-like thumbnail strip (disabled for now) */}
              {false && (
                <div className="relative w-full bg-muted/30">
                  <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-muted/60 to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-muted/60 to-transparent" />

                  <div className="p-3">
                    <Slider ref={(s: any) => (sliderRef.current = s)} {...sliderSettings}>
                      {galleryMedia.map((m, realIndex) => (
                        <div key={realIndex} className="slick-thumb-wrap flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setActiveIndex(realIndex)}
                            aria-label={`Go to media ${realIndex + 1}`}
                            className={`thumb-item block w-[240px] h-[135px] flex-none rounded-md overflow-hidden border transition-transform duration-200 cursor-pointer
                              ${realIndex === activeIndex ? 'ring-2 ring-primary border-primary scale-105' : 'border-transparent hover:border-primary/40 hover:scale-105'}`}
                          >
                            <img
                              src={(m as any).thumb || m.url || '/placeholder-project.svg'}
                              alt={m.name || `Media ${realIndex + 1}`}
                              className="thumb-img w-full h-full object-cover object-center block"
                              loading="lazy"
                              decoding="async"
                            />
                            {m.type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="text-white w-6 h-6 drop-shadow" />
                              </div>
                            )}
                          </button>
                        </div>
                      ))}
                    </Slider>
                  </div>

                  <button
                    type="button"
                    aria-label="Previous thumbnails"
                    onClick={() => sliderRef.current?.slickPrev()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/40 text-white hover:bg-black/60"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next thumbnails"
                    onClick={() => sliderRef.current?.slickNext()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-black/40 text-white hover:bg-black/60"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project description (HTML) + tags dropdown */}
          <Card>
            {/*description */}
            <CardContent className="pt-6">
              {fullDescriptionHtml ? (
                <div
                  className="text-sm leading-relaxed space-y-3 description-html"
                  dangerouslySetInnerHTML={{ __html: fullDescriptionHtml }}
                />
              ) : (
                <p className="text-muted-foreground text-sm pt-4">
                  No description has been provided for this project yet.
                </p>
              )}

            </CardContent>
          </Card>

          {tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-bold">Tags</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.value}
                      to={`/?tags=${encodeURIComponent(tag.value)}`}
                      className="tag-chip tag-chip--interactive tag-chip--default"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <ProjectComments 
            projectId={project.id}
            currentUser={currentUser}
            supabase={supabase}
          />
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
              
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLike}
                  disabled={!currentUser || likesLoading}
                  className={`flex-1 min-w-[140px] ${isLiked ? 'text-red-500 border-red-500 hover:text-red-600 hover:border-red-600' : ''}`}
                >
                  <Heart className={`mr-2 h-4 w-4 transition-all ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'} ({likesCount})
                </Button>
                <Button variant="outline" size="sm" className="flex-1 min-w-[140px]">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Project Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Project Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Views</span>
                </div>
                <span className="text-sm font-semibold">{project.stats?.views || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Downloads</span>
                </div>
                <span className="text-sm font-semibold">{project.downloads || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Likes</span>
                </div>
                <span className="text-sm font-semibold">
                  {likesLoading ? '...' : likesCount}
                </span>
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

          {/* Files (moved above Members) */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading files...</p>
                </div>
              ) : (
                <>
                  {webglFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Launch WebGL builds directly in your browser.
                        </p>
                        <Badge variant="outline" className="text-xs uppercase tracking-widest">
                          WebGL
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {webglFiles.map((file, index) => {
                          const key = webglKey(file);
                          const url = webglUrls[key];
                          const isPrimary = primaryWebglFile && file.id === primaryWebglFile.id;

                          return (
                            <Card key={file.id || index}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm truncate">
                                        {file.file_name || 'WebGL Build'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Playable in browser · WebGL
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" asChild disabled={!url}>
                                      <a href={url || '#'} target="_blank" rel="noopener noreferrer">
                                        <Play className="mr-2 h-4 w-4" />
                                        Play
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {downloadableFiles.length > 0 ? (
                    <div className="space-y-3">
                      {downloadableFiles.map((file, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{file.file_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatContentLabel(file.file_type)} - {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                </p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : webglFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No files available for this project.</p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const ownerId = project.author?.id;
                const ownerJobRole = (project.members || []).find((m: any) => m.id === ownerId)?.jobRole || null;
                const combined = [
                  {
                    id: ownerId,
                    name: project.author?.name || 'Unknown Author',
                    avatar: project.author?.avatar || null,
                    jobRole: ownerJobRole,
                    isOwner: true,
                  },
                  ...((project.members || []) as any[])
                    .filter((m: any) => m.id !== ownerId)
                    .map((m: any) => ({ ...m, isOwner: false })),
                ];
                return combined.map((m: any) => {
                  const hasProfile = !!m.id;
                  const content = (
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={m.avatar || undefined} />
                        <AvatarImage src="/placeholder-avatar.svg" />
                        <AvatarFallback>{m.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold inline-flex items-center gap-1">
                          {m.name}
                          {m.isOwner && <Crown className="w-3 h-3 text-amber-500" />}
                        </div>
                        {m.jobRole && (
                          <p className="text-xs text-muted-foreground">{m.jobRole}</p>
                        )}
                      </div>
                    </div>
                  );

                  return hasProfile ? (
                    <Link
                      key={m.id}
                      to={`/users/${m.id}`}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-input/50 transition-colors"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={m.id || Math.random()}
                      className="flex items-center justify-between p-2 rounded-md"
                    >
                      {content}
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
