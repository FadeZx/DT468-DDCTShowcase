import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Bookmark } from 'lucide-react';

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
  longDescription: string;
  requirements?: string[];
  agenda?: string[];
  speakers?: string[];
}

interface EventPageProps {
  eventId: string;
  onBack: () => void;
}

export function EventPage({ eventId, onBack }: EventPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Mock event data - in real app, this would come from an API
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'DDCT Game Jam 2025',
        description: '48-hour game development competition',
        coverImage: '/placeholder-event.svg',
        date: '2025-03-15',
        time: '10:00 AM',
        location: 'DDCT Main Campus, Building A',
        host: 'Game Development Department',
        attendees: 45,
        maxAttendees: 100,
        category: 'Competition',
        featured: true,
        longDescription: 'Join us for an exciting 48-hour game development competition where students from all departments collaborate to create innovative games. This event is perfect for programmers, artists, designers, and anyone interested in game development. Teams will have access to development tools, mentorship from industry professionals, and plenty of snacks to keep you going!',
        requirements: [
          'Bring your own laptop and development tools',
          'Basic knowledge of game development concepts',
          'Team of 2-4 members (can form teams on-site)',
          'Creative mindset and problem-solving skills'
        ],
        agenda: [
          'Day 1 (10:00 AM): Registration & Team Formation',
          'Day 1 (11:00 AM): Theme Announcement & Kickoff',
          'Day 1 (12:00 PM): Development Begins',
          'Day 2 (12:00 PM): Mid-point Check-in',
          'Day 3 (10:00 AM): Final Submissions',
          'Day 3 (2:00 PM): Presentations & Judging',
          'Day 3 (4:00 PM): Awards Ceremony'
        ],
        speakers: [
          'Prof. Sarah Chen - Game Design Expert',
          'Mr. James Wilson - Industry Professional',
          'Dr. Maria Rodriguez - Technical Advisor'
        ]
      },
      {
        id: '2',
        title: 'Animation Showcase Festival',
        description: 'Annual film festival showcasing student animations',
        coverImage: '/placeholder-event.svg',
        date: '2025-04-02',
        time: '6:00 PM',
        location: 'DDCT Auditorium',
        host: 'Animation Department',
        attendees: 78,
        maxAttendees: 150,
        category: 'Showcase',
        featured: true,
        longDescription: 'Experience the best of student animation at our annual showcase festival. This event features outstanding animated films created by DDCT students across various programs. Network with industry professionals, get feedback on your work, and celebrate the art of animation with fellow enthusiasts.',
        requirements: [
          'Open to all DDCT students and faculty',
          'Free admission with student ID'
        ],
        agenda: [
          '6:00 PM: Welcome Reception',
          '6:30 PM: Screening Begins',
          '8:00 PM: Q&A with Student Filmmakers',
          '8:30 PM: Networking Session',
          '9:00 PM: Awards Presentation'
        ],
        speakers: [
          'Animation Department Faculty',
          'Industry Guest Judges',
          'Student Filmmakers'
        ]
      }
    ];

    const foundEvent = mockEvents.find(e => e.id === eventId);
    setEvent(foundEvent || null);
  }, [eventId]);

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <p className="text-muted-foreground">
            The event you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRegister = () => {
    setIsRegistered(true);
    // In real app, this would call an API to register the user
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <div className="relative mb-8">
        <img 
          src={event.coverImage} 
          alt={event.title}
          className="w-full h-64 object-cover rounded-lg"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {event.featured && (
            <Badge className="bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
          <Badge className="bg-secondary text-secondary-foreground">
            {event.category}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{event.title}</CardTitle>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Hosted by {event.host}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">About this Event</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {event.longDescription}
                </p>
              </div>

              {event.agenda && event.agenda.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Event Agenda</h3>
                  <ul className="space-y-2">
                    {event.agenda.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.speakers && event.speakers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Featured Speakers</h3>
                  <ul className="space-y-2">
                    {event.speakers.map((speaker, index) => (
                      <li key={index} className="text-muted-foreground">
                        {speaker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.requirements && event.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Requirements</h3>
                  <ul className="space-y-1">
                    {event.requirements.map((requirement, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(event.date)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{event.time}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{event.location}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {event.attendees}/{event.maxAttendees} registered
                </span>
              </div>

              <div className="pt-4 border-t">
                {isRegistered ? (
                  <Button className="w-full" variant="outline" disabled>
                    Already Registered
                  </Button>
                ) : event.attendees >= event.maxAttendees ? (
                  <Button className="w-full" variant="outline" disabled>
                    Event Full
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleRegister}>
                    Register for Event
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="flex-1">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}