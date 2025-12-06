import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Calendar, MapPin, Users, Clock, Plus, Edit, Trash2, Search, ChevronLeft } from "lucide-react";

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

interface EventForm {
  title: string;
  shortDescription: string;
  url: string;
  startAt: string;
  endAt: string;
  location: string;
  host: string;
  maxAttendees: number;
  category: string;
  featured: boolean;
  description: string;
  socialHashtag: string;
  tags: string[];
  coverImage: string;
  visibility: "draft" | "public";
  unlimitedAttendees: boolean;
  videoLink: string;
}

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "DDCT Game Jam 2025",
      description: "48-hour game development competition",
      coverImage: "/placeholder-event.svg",
      date: "2025-03-15",
      time: "10:00 AM",
      location: "DDCT Main Campus, Building A",
      host: "Game Development Department",
      attendees: 45,
      maxAttendees: 100,
      category: "Competition",
      featured: true,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"list" | "create">("list");
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentImageInputRef = useRef<HTMLInputElement | null>(null);
  const [newEvent, setNewEvent] = useState<EventForm>({
    title: "",
    shortDescription: "",
    url: "",
    startAt: "",
    endAt: "",
    location: "",
    host: "",
    maxAttendees: 50,
    category: "Workshop",
    featured: false,
    description: "",
    socialHashtag: "",
    tags: [],
    coverImage: "",
    visibility: "draft",
    unlimitedAttendees: false,
    videoLink: "",
  });

  const applyFormat = (command: string, value?: string) => {
    if (contentRef.current) {
      contentRef.current.focus();
      document.execCommand(command, false, value);
      setNewEvent({ ...newEvent, description: contentRef.current.innerHTML });
    }
  };

  const insertImageIntoContent = (file: File) => {
    const url = URL.createObjectURL(file);
    applyFormat("insertImage", url);
  };

  const insertVideoLink = () => {
    const link = prompt("Paste video link (YouTube, Vimeo, etc.)");
    if (link && contentRef.current) {
      contentRef.current.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<div class="my-3"><iframe src="${link}" allowfullscreen class="w-full h-64 rounded-md border"></iframe></div>`
      );
      setNewEvent({ ...newEvent, description: contentRef.current.innerHTML, videoLink: link });
    }
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    if (newEvent.tags.includes(tag.trim())) return;
    setNewEvent({ ...newEvent, tags: [...newEvent.tags, tag.trim()] });
  };

  const removeTag = (tag: string) => {
    setNewEvent({ ...newEvent, tags: newEvent.tags.filter((t) => t !== tag) });
  };

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.host.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [events, searchTerm]
  );

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.shortDescription) return;
    setSaving(true);
    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.shortDescription || newEvent.description,
      coverImage: newEvent.coverImage || "/placeholder-event.svg",
      date: newEvent.startAt,
      time: newEvent.startAt ? new Date(newEvent.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      location: newEvent.location,
      host: newEvent.host,
      attendees: 0,
      maxAttendees: newEvent.maxAttendees,
      category: newEvent.category,
      featured: newEvent.featured,
    };
    setEvents((prev) => [...prev, event]);
    setNewEvent({
      title: "",
      shortDescription: "",
      url: "",
      startAt: "",
      endAt: "",
      location: "",
      host: "",
      maxAttendees: 50,
      category: "Workshop",
      featured: false,
      description: "",
      socialHashtag: "",
      tags: [],
      coverImage: "",
      visibility: "draft",
      unlimitedAttendees: false,
      videoLink: "",
    });
    setSaving(false);
    setMode("list");
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setMode("create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
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
                        <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{event.date ? formatDate(event.date) : "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.time || "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location || "TBD"}</span>
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
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id)}>
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
                {searchTerm ? "Try adjusting your search terms" : "Create your first event to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCreate = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => setMode("list")} className="px-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to events
        </Button>
        <h2 className="text-2xl font-semibold">Host a new event</h2>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Title + Short description + Cover */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Required"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Short description</label>
                <Input
                  value={newEvent.shortDescription}
                  onChange={(e) => setNewEvent({ ...newEvent, shortDescription: e.target.value })}
                  placeholder="A one line summary of the event"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">URL</label>
                <Input
                  value={newEvent.url}
                  onChange={(e) => setNewEvent({ ...newEvent, url: e.target.value })}
                  placeholder="https://events.ddct.dev/my-event"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Cover image</label>
              <div className="border border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
                <p className="mb-3">Upload cover image (placeholder only). Recommended 630x500.</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const objectUrl = URL.createObjectURL(file);
                      setNewEvent({ ...newEvent, coverImage: objectUrl });
                    }
                  }}
                />
              </div>
              {newEvent.coverImage && (
                <div className="mt-2">
                  <img
                    src={newEvent.coverImage}
                    alt="Cover preview"
                    className="w-full max-w-xs rounded-md border object-cover"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                The cover image is used whenever the site links to your event.
              </p>
            </div>
          </div>

          {/* Dates & basics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Start date</label>
              <Input
                type="datetime-local"
                value={newEvent.startAt}
                onChange={(e) => setNewEvent({ ...newEvent, startAt: e.target.value })}
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">End date</label>
              <Input
                type="datetime-local"
                value={newEvent.endAt}
                onChange={(e) => setNewEvent({ ...newEvent, endAt: e.target.value })}
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Location / Host / Capacity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Location</label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Campus Hall / Online"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Host / Department</label>
              <Input
                value={newEvent.host}
                onChange={(e) => setNewEvent({ ...newEvent, host: e.target.value })}
                placeholder="Game Development Department"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Max attendees</label>
              <Input
                type="number"
                value={newEvent.unlimitedAttendees ? "" : newEvent.maxAttendees}
                disabled={newEvent.unlimitedAttendees}
                onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: parseInt(e.target.value) || 0 })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newEvent.unlimitedAttendees}
                  onChange={(e) => setNewEvent({ ...newEvent, unlimitedAttendees: e.target.checked })}
                />
                No attendee limit
              </label>
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-1">
            <label className="text-sm font-semibold">Featured</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newEvent.featured}
                onChange={(e) => setNewEvent({ ...newEvent, featured: e.target.checked })}
              />
              Highlight this event
            </label>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Content</label>
            <div className="flex flex-wrap gap-2 mb-2 text-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => applyFormat("formatBlock", "<h1>")}>
                H1
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyFormat("formatBlock", "<h2>")}>
                H2
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyFormat("bold")}>
                Bold
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyFormat("italic")}>
                Italic
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyFormat("insertUnorderedList")}>
                Bullet
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyFormat("createLink", prompt("Paste link") || "")}>
                Link
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => contentImageInputRef.current?.click()}
              >
                Image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={insertVideoLink}>
                Video
              </Button>
              <input
                ref={contentImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) insertImageIntoContent(file);
                  e.target.value = "";
                }}
              />
            </div>
            <div
              ref={contentRef}
              contentEditable
              className="min-h-[200px] border rounded-md p-3 bg-background"
              onInput={(e) => setNewEvent({ ...newEvent, description: (e.target as HTMLDivElement).innerHTML })}
              dangerouslySetInnerHTML={{ __html: newEvent.description }}
            />
            {newEvent.videoLink && (
              <p className="text-xs text-muted-foreground">Video attached: {newEvent.videoLink}</p>
            )}
          </div>

          {/* Submission details */}
          {/* Social + tags */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Social media hashtag</label>
            <Input
              value={newEvent.socialHashtag}
              onChange={(e) => setNewEvent({ ...newEvent, socialHashtag: e.target.value })}
              placeholder="optional"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newEvent.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                  {tag}
                  <button className="text-muted-foreground" onClick={() => removeTag(tag)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Add tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2 border rounded-md p-4 text-sm">
            <p className="text-base font-semibold">Visibility</p>
            <p className="text-muted-foreground">Your event is only visible to you and other admins until published.</p>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={newEvent.visibility === "draft"}
                onChange={() => setNewEvent({ ...newEvent, visibility: "draft" })}
              />
              Draft � keep private while editing
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={newEvent.visibility === "public"}
                onChange={() => setNewEvent({ ...newEvent, visibility: "public" })}
              />
              Published � event is visible and ready for submissions and ratings when appropriate
            </label>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreateEvent} disabled={!newEvent.title || !newEvent.shortDescription || saving}>
              {saving ? "Saving..." : "Create event & preview"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return mode === "list" ? renderList() : renderCreate();
}
