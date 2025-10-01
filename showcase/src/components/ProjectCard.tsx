import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Heart, Download, Eye } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnail: string;
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
      className="group cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl border-border bg-card"
      onClick={() => onClick(project.id)}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        <ImageWithFallback
          src={project.thumbnail}
          alt={project.title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
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
      
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {project.description}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src={project.author.avatar} />
            <AvatarFallback className="text-xs">{project.author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {project.author.name} • {project.author.year}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{project.stats.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{project.stats.downloads}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{project.stats.likes}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}