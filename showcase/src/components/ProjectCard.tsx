import { useEffect, useRef, useState } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Heart, Download, Eye } from 'lucide-react';
import { SupabaseImage } from './figma/SupabaseImage';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    visibility?: 'unlisted' | 'public';
    thumbnail?: string;
    cover_image?: string;
    author: {
      name: string;
      avatar?: string;
      year: string;
    };
    stats: {
      views: number;
      downloads: number;
      likes: number;
    };
    tags: string[];
    featured?: boolean;
    members?: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
  };
  onClick: (projectId: string) => void;
  theme?: {
    colors?: { cardBackground?: string; text?: string };
    layout?: { borderRadius?: number };
  };
}

export function ProjectCard({ project, onClick, theme }: ProjectCardProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const [infoHeightPx, setInfoHeightPx] = useState<number>(120);

  useEffect(() => {
    const element = coverRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const height = entry?.contentRect?.height ?? 0;
      // Reserve enough space for title, 2-line description, and avatar
      setInfoHeightPx(Math.max(120, Math.round(height / 3)));
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  const radius = theme?.layout?.borderRadius ?? 8;
  const cardBg = theme?.colors?.cardBackground;
  const textColor = theme?.colors?.text;
  return (
    <Card 
      className="group cursor-pointer hover:shadow-xl border-border bg-card w-full"
      onClick={() => onClick(project.id)}
      style={{ background: cardBg, color: textColor, borderRadius: radius }}
    >
      <div ref={coverRef} className="relative overflow-hidden aspect-square" style={{ borderTopLeftRadius: radius, borderTopRightRadius: radius }}>
        <SupabaseImage
          src={project.cover_image || project.thumbnail || ''}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          fallbackSrc="/placeholder-project.svg"
        />
        {project.featured && (
          <Badge className=" bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-secondary/80 backdrop-blur-sm"
        >
          {project.category}
        </Badge>
      </div>
      
      <div className="flex flex-col" style={{ height: infoHeightPx }}>
        <CardContent className="px-3 pt-1 pb-3 flex flex-col flex-1 overflow-hidden">
          <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors text-sm flex items-center gap-2">
            {project.title}
            {project.visibility === 'unlisted' && (
              <Badge variant="secondary" className="text-[9px] uppercase tracking-wide">
                Unlisted
              </Badge>
            )}
          </h3>
          <div className="flex-1 overflow-hidden mb-1 min-h-[2.6em]">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-snug max-h-[2.6em]">
              {project.description}
            </p>
          </div>
          
          <div className="mt-auto pt-1 flex items-center">
            {project.members && project.members.length > 0 ? (
              <div className="flex items-center -space-x-2">
                {project.members.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="w-6 h-6 border-2 border-background">
                    <AvatarImage src={member.avatar || '/placeholder-avatar.svg'} />
                    <AvatarFallback className="text-[10px]">
                      {member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.members.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-medium">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <Avatar className="w-6 h-6 border-2 border-background">
                <AvatarImage src={project.author.avatar || '/placeholder-avatar.svg'} />
                <AvatarFallback className="text-[10px]">{project.author.name[0]}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-3 pt-0 flex items-center justify-between text-xs text-muted-foreground h-9">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{project.stats.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{project.stats.downloads}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{project.stats.likes}</span>
            </div>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
