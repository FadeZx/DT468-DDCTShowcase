import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  time: string;
  location: string;
  host: string;
  attendees: number;
  maxAttendees: number;
  category: string;
  featured: boolean;
}

interface EventsPageProps {
  onEventClick: (eventId: string) => void;
}

export function EventsPage({ onEventClick }: EventsPageProps) {
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'DDCT Game Jam 2025',
      description: '48-hour game development competition where students collaborate to create innovative games. Showcase your skills and win amazing prizes!',
      coverImage: '/placeholder-event.svg',
      date: '2025-03-15',
      time: '10:00 AM',
      location: 'DDCT Main Campus, Building A',
      host: 'Game Development Department',
      attendees: 45,
      maxAttendees: 100,
      category: 'Competition',
      featured: true
    },
    {
      id: '2',
      title: 'Animation Showcase Festival',
      description: 'Annual film festival showcasing the best student animation projects. Network with industry professionals and get feedback on your work.',
      coverImage: '/placeholder-event.svg',
      date: '2025-04-02',
      time: '6:00 PM',
      location: 'DDCT Auditorium',
      host: 'Animation Department',
      attendees: 78,
      maxAttendees: 150,
      category: 'Showcase',
      featured: true
    },
    {
      id: '3',
      title: 'Portfolio Review Day',
      description: 'Industry professionals review and provide feedback on student portfolios. Bring your best work and get valuable insights.',
      coverImage: '/placeholder-event.svg',
      date: '2025-04-20',
      time: '9:00 AM',
      location: 'Career Center, Room 301',
      host: 'Career Services',
      attendees: 32,
      maxAttendees: 50,
      category: 'Workshop',
      featured: false
    },
    {
      id: '4',
      title: 'Digital Art Exhibition',
      description: 'Showcase your digital artwork and connect with fellow artists. Open to all digital media including illustrations, concept art, and more.',
      coverImage: '/placeholder-event.svg',
      date: '2025-05-10',
      time: '2:00 PM',
      location: 'Art Gallery, Building C',
      host: 'Digital Arts Club',
      attendees: 25,
      maxAttendees: 80,
      category: 'Exhibition',
      featured: false
    }
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">DDCT Events</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover upcoming events, workshops, and competitions at DDCT. 
          Join our community activities to enhance your skills and network with peers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {events.map((event) => (
          <Card 
            key={event.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => onEventClick(event.id)}
          >
            <div className="relative">
              <img 
                src={event.coverImage} 
                alt={event.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              {event.featured && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  Featured
                </Badge>
              )}
              <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
                {event.category}
              </Badge>
            </div>
            
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
              
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {event.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(event.date)} at {event.time}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Hosted by {event.host}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{event.attendees}/{event.maxAttendees} attendees</span>
                </div>
              </div>
              
              <Button className="w-full" variant="outline">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Events Scheduled</h3>
          <p className="text-muted-foreground">
            Check back later for upcoming events and activities.
          </p>
        </div>
      )}
    </div>
  );
}