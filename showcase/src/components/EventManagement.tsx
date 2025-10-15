import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar, MapPin, Users, Clock, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

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

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>([
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
      featured: true
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
      featured: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    host: '',
    maxAttendees: 50,
    category: 'Workshop',
    featured: false
  });

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEvent = () => {
    const event: Event = {
      id: Date.now().toString(),
      ...newEvent,
      coverImage: '/placeholder-event.svg',
      attendees: 0
    };
    
    setEvents([...events, event]);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      host: '',
      maxAttendees: 50,
      category: 'Workshop',
      featured: false
    });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Event Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Enter event title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Enter event location"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Host</label>
                <Input
                  value={newEvent.host}
                  onChange={(e) => setNewEvent({...newEvent, host: e.target.value})}
                  placeholder="Enter host name/department"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Attendees</label>
                  <Input
                    type="number"
                    value={newEvent.maxAttendees}
                    onChange={(e) => setNewEvent({...newEvent, maxAttendees: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                    <option value="Showcase">Showcase</option>
                    <option value="Exhibition">Exhibition</option>
                    <option value="Networking">Networking</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvent.featured}
                  onChange={(e) => setNewEvent({...newEvent, featured: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm font-medium">Featured Event</label>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent} disabled={!newEvent.title || !newEvent.description}>
                  Create Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <img 
                    src={event.coverImage} 
                    alt={event.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      {event.featured && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Featured
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{event.attendees}/{event.maxAttendees}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first event to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}