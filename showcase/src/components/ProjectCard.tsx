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
  };
  onClick: (projectId: string) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-xl border-border bg-card w-full"
      onClick={() => onClick(project.id)}
    >
      <div className="relative overflow-hidden rounded-t-lg aspect-square">
        <SupabaseImage
          src={project.cover_image || project.thumbnail || ''}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          fallbackSrc="/placeholder-project.svg"
        />
        {project.featured && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
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
      
      <CardContent className="p-3">
        <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors text-sm">
          {project.title}
        </h3>
        <div className="h-8 overflow-hidden mb-1">
          <p className="text-xs text-muted-foreground line-clamp-1">
            {project.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="w-5 h-5">
            <AvatarImage src="/placeholder-avatar.svg" />
            <AvatarFallback className="text-[10px]">{project.author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            {project.author.name} • {project.author.year}
          </span>
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
    </Card>
  );
}