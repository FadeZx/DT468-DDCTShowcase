import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Calendar, User, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string;
  category: string;
  author: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  tags: string[];
  featured: boolean;
  likes: number;
  views: number;
}

interface SteamLikeFeaturedProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

export function SteamLikeFeatured({ projects, onProjectClick }: SteamLikeFeaturedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const featuredProjects = projects.filter(p => p.featured).slice(0, 7);

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoPlaying && featuredProjects.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredProjects.length);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, featuredProjects.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleCardHover = (index: number) => {
    setHoveredIndex(index);
    setIsAutoPlaying(false);
    // Auto-scroll to hovered card after a delay
    setTimeout(() => {
      if (hoveredIndex === index) {
        goToSlide(index);
      }
    }, 1000);
  };

  const handleCardLeave = () => {
    setHoveredIndex(null);
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  if (featuredProjects.length === 0) return null;

  const getCardPosition = (index: number) => {
    const diff = index - currentIndex;
    const totalCards = featuredProjects.length;
    
    // Normalize position to handle circular array
    let position = diff;
    if (position > totalCards / 2) position -= totalCards;
    if (position < -totalCards / 2) position += totalCards;
    
    return position;
  };

  const getCardStyle = (index: number) => {
    const position = getCardPosition(index);
    const isCenter = position === 0;
    const isHovered = hoveredIndex === index;
    
    let transform = `translateX(${position * 200}px)`;
    let scale = 1;
    let zIndex = 10;
    let opacity = 0.6;
    
    if (isCenter) {
      scale = 1.1;
      zIndex = 20;
      opacity = 1;
    } else if (Math.abs(position) === 1) {
      scale = 0.85;
      zIndex = 15;
      opacity = 0.7;
    } else if (Math.abs(position) === 2) {
      scale = 0.7;
      zIndex = 10;
      opacity = 0.4;
    } else {
      scale = 0.5;
      zIndex = 5;
      opacity = 0.2;
    }
    
    if (isHovered && !isCenter) {
      scale *= 1.05;
      opacity = 0.9;
      zIndex += 5;
    }
    
    transform += ` scale(${scale})`;
    
    return {
      transform,
      zIndex,
      opacity,
      transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    };
  };

  const currentProject = featuredProjects[currentIndex];

  return (
    <div className="relative w-full mb-12">
      {/* Background with current project */}
      <div className="absolute inset-0 h-[400px] rounded-lg overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out blur-sm"
          style={{
            backgroundImage: `url(${currentProject.banner || '/placeholder-project.svg'})`,
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-[400px] flex flex-col">
        {/* Project Info Section */}
        <div className="flex-1 flex items-center justify-center px-6 py-6">
          <div className="text-center text-white max-w-3xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
                Featured
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white text-xs">
                {currentProject.category}
              </Badge>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
              {currentProject.title}
            </h1>
            
            <p className="text-base text-gray-200 mb-4 max-w-xl mx-auto leading-relaxed">
              {currentProject.description}
            </p>

            <Button 
              onClick={() => onProjectClick(currentProject.id)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
            >
              <Play className="w-4 h-4 mr-2" />
              View Project
            </Button>
          </div>
        </div>

        {/* Carousel Section */}
        <div className="relative h-48 flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-6xl mx-auto">
            {featuredProjects.map((project, index) => {
              const isCenter = getCardPosition(index) === 0;
              const isHovered = hoveredIndex === index;
              
              return (
                <div
                  key={project.id}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={getCardStyle(index)}
                  onClick={() => goToSlide(index)}
                  onMouseEnter={() => handleCardHover(index)}
                  onMouseLeave={handleCardLeave}
                >
                  <div className={`relative w-48 h-28 rounded-lg overflow-hidden shadow-xl ${
                    isCenter ? 'ring-2 ring-orange-500' : ''
                  }`}>
                    <img
                      src="/placeholder-project.svg"
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Card Info - Only show for center card */}
                    {isCenter && (
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold text-sm mb-1 truncate">
                          {project.title}
                        </h3>
                        <p className="text-gray-300 text-xs truncate">
                          {project.category}
                        </p>
                      </div>
                    )}

                    {/* Hover Info Overlay - Only for side cards */}
                    {isHovered && !isCenter && (
                      <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-3 transition-all duration-300">
                        <div className="text-center text-white">
                          <h4 className="font-bold text-sm mb-1">{project.title}</h4>
                          <p className="text-xs text-gray-300 mb-1">{project.category}</p>
                          <p className="text-xs text-gray-400">by {project.author.name}</p>
                          <div className="mt-2 text-xs text-orange-400">
                            Click to feature
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => goToSlide(currentIndex === 0 ? featuredProjects.length - 1 : currentIndex - 1)}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => goToSlide((currentIndex + 1) % featuredProjects.length)}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {featuredProjects.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-orange-500' : 'bg-white/30 hover:bg-white/50'
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}