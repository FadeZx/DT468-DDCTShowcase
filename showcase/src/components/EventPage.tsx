import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Bookmark, Edit } from 'lucide-react';
import supabase from '../utils/supabase/client';

interface Event {
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
  show_participants?: boolean;
  long_description?: string;
  longDescription?: string;
  requirements?: string[];
  agenda?: string[];
  speakers?: string[];
}

interface EventPageProps {
  eventId: string;
  onBack: () => void;
  currentUser?: any;
}

export function EventPage({ eventId, onBack, currentUser }: EventPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();
        if (err) throw err;
        if (active) setEvent((data as any) || null);
      } catch (e: any) {
        if (active) {
          setError(e?.message || 'Failed to load event');
          setEvent(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    if (eventId) load();
    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!eventId) return;
      try {
        const { data: regs, error: regErr } = await supabase
          .from('event_registrations')
          .select('user_id')
          .eq('event_id', eventId);
        if (regErr) {
          if ((regErr as any).status === 404) {
            console.warn('event_registrations table not found. Create it with columns event_id (uuid), user_id (uuid).');
            setParticipants([]);
            setIsRegistered(false);
            return;
          }
          throw regErr;
        }
        const ids = (regs || []).map((r: any) => r.user_id).filter(Boolean);
        if (ids.length === 0) { setParticipants([]); setIsRegistered(false); return; }
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, name, email, avatar, year')
          .in('id', ids);
        if (profErr) throw profErr;
        setParticipants(profiles || []);
        if (currentUser?.id) {
          setIsRegistered(ids.includes(currentUser.id));
        }
      } catch (e) {
        console.error('Failed to load participants', e);
      }
    };
    loadParticipants();
  }, [eventId, currentUser?.id]);

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

  const handleRegister = () => {
    if (!currentUser?.id) {
      alert('Please sign in to register.');
      return;
    }
    (async () => {
      try {
        const { error } = await supabase
          .from('event_registrations')
          .upsert({ event_id: eventId, user_id: currentUser.id }, { onConflict: 'event_id,user_id' });
        if (error) {
          if ((error as any).status === 404) {
            alert('Registration table missing. Create event_registrations (event_id uuid, user_id uuid) and allow inserts.');
            return;
          }
          throw error;
        }
        setIsRegistered(true);
        setParticipants((prev) => {
          if (prev.some((p) => p.id === currentUser.id)) return prev;
          return [
            ...prev,
            {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              avatar: currentUser.avatar,
              year: currentUser.year,
            },
          ];
        });
      } catch (e) {
        console.error('Registration failed', e);
        alert('Failed to register for this event. Please try again.');
      }
    })();
  };

  const viewerRole = (currentUser?.semanticRole || currentUser?.role || '').toLowerCase();
  const showParticipantsFlag = event?.show_participants;
  const canSeeParticipants = (showParticipantsFlag === undefined || showParticipantsFlag === null || showParticipantsFlag === true)
    || viewerRole === 'admin';
  const isAdmin = viewerRole === 'admin';

  const coverSrc = (() => {
    const candidate = event?.coverImage || event?.cover_image;
    if (candidate && candidate.startsWith('blob:')) return '/placeholder-event.svg';
    return candidate || '/placeholder-event.svg';
  })();

  if (!event && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <p className="text-muted-foreground">
            {error ? `Error: ${error}` : "The event you're looking for doesn't exist or has been removed."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={() => (window.location.href = `/admin/events`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Event
        </Button>
      )}
      {loading && (
        <div className="text-center py-12 text-muted-foreground">Loading event…</div>
      )}
      {!loading && event && (
        <>
          <div className="relative mb-8">
            <img 
              src={coverSrc}
              alt={event.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.dataset.fallback) return;
                target.dataset.fallback = '1';
                target.src = '/placeholder-event.svg';
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              {event.featured && (
                <Badge className="bg-primary text-primary-foreground">
                  Featured
                </Badge>
              )}
              <Badge className="bg-secondary text-secondary-foreground">
                {event.category || 'Event'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Hosted by {event.host || 'DDCT'}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">About this Event</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.longDescription || event.long_description || event.description}
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
                    <span className="font-medium">{event.time || 'TBD'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{event.location || 'TBD'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {(event.attendees ?? 0)}/{event.maxAttendees ?? event.max_attendees ?? 0} registered
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    {isRegistered ? (
                      <Button className="w-full" variant="outline" disabled>
                        Already Registered
                      </Button>
                    ) : (event.attendees ?? 0) >= (event.maxAttendees ?? event.max_attendees ?? 0) && (event.maxAttendees ?? event.max_attendees ?? 0) > 0 ? (
                      <Button className="w-full" variant="outline" disabled>
                        Event Full
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={handleRegister}>
                        Register for Event
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-10">
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {!canSeeParticipants && (
                  <p className="text-sm text-muted-foreground">
                    Participants are hidden for this event. Admins can view the list.
                  </p>
                )}
                {canSeeParticipants && (
                  participants.length > 0 ? (
                    <div className="space-y-3">
                      {participants.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 border rounded-md p-3">
                          <img
                            src={p.avatar || '/placeholder-avatar.svg'}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{p.name || 'Participant'}</div>
                            <div className="text-sm text-muted-foreground">
                              {p.email || 'No email'} {p.year ? `• ${p.year}` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No participants yet.</p>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
