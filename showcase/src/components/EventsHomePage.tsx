import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import supabase from '../utils/supabase/client';

interface EventRecord {
  id: string;
  title: string;
  description: string;
  cover_image?: string;
  coverImage?: string;
  date?: string;
  time?: string;
  location?: string;
  host?: string;
  attendees?: number;
  max_attendees?: number;
  maxAttendees?: number;
  category?: string;
  featured?: boolean;
}

interface EventsHomePageProps {
  onEventClick: (eventId: string) => void;
}

export function EventsHomePage({ onEventClick }: EventsHomePageProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });
        if (err) throw err;
        setEvents(data || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
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
        </p>
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">Loading events…</div>
      )}
      {error && (
        <div className="text-center py-12 text-destructive">Error: {error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event) => {
              const max = event.maxAttendees ?? event.max_attendees ?? 0;
              const attendees = event.attendees ?? 0;
              return (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
                  onClick={() => onEventClick(event.id)}
                >
                  <div className="relative">
                    <img
                      src={event.coverImage || event.cover_image || '/placeholder-event.svg'}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    {event.featured && (
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                        Featured
                      </Badge>
                    )}
                    <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
                      {event.category || 'Event'}
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
                        <span>{formatDate(event.date)}{event.time ? ` at ${event.time}` : ''}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location || 'TBD'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Hosted by {event.host || 'DDCT'}</span>
                      </div>

                      {max > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{attendees}/{max} attendees</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
        </>
      )}
    </div>
  );
}
