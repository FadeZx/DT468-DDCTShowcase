import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Calendar, MapPin, Users, Clock, Plus, Edit, Trash2, Search, ChevronLeft } from "lucide-react";
import supabase from "../utils/supabase/client";
import { useNavigate } from "react-router-dom";

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
  max_attendees?: number | null;
  category?: string;
  featured?: boolean;
  long_description?: string;
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
  coverFile: File | null;
  visibility: "draft" | "public";
  unlimitedAttendees: boolean;
  videoLink: string;
}

const toDateOnly = (startAt: string | null | undefined) => {
  if (!startAt) return null;
  const s = String(startAt);
  if (s.includes("T")) return s.split("T")[0];
  if (s.includes(" ")) return s.split(" ")[0];
  return s;
};
const toTime24h = (startAt: string | null | undefined) => {
  if (!startAt) return null;
  const d = new Date(startAt as any);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(11, 16); // HH:MM
  }
  const s = String(startAt);
  const match = s.match(/^(\\d{1,2}):(\\d{2})(?:\\s*(AM|PM))?/i);
  if (match) {
    let [_, hh, mm, mer] = match;
    let hours = parseInt(hh, 10);
    if (mer) {
      const isPM = mer.toUpperCase() === "PM";
      hours = (hours % 12) + (isPM ? 12 : 0);
    }
    return `${hours.toString().padStart(2, "0")}:${mm}`;
  }
  return null;
};
const toInputDateTime = (date?: string, time?: string | null) => {
  if (!date) return "";
  if (!time) return `${date}T00:00`;
  // try to normalize "10:00 AM" or "10:00" to HH:MM
  const match = time.match(/^(\\d{1,2}):(\\d{2})(?:\\s*(AM|PM))?/i);
  if (match) {
    let [_, hh, mm, mer] = match;
    let hours = parseInt(hh, 10);
    if (mer) {
      const isPM = mer.toUpperCase() === "PM";
      hours = (hours % 12) + (isPM ? 12 : 0);
    }
    const hourStr = hours.toString().padStart(2, "0");
    return `${date}T${hourStr}:${mm}`;
  }
  return `${date}T00:00`;
};

const uploadEventCover = async (file: File, eventId: string) => {
  const primaryBucket = "event-files";
  const fallbackBucket = "project-files";
  const filePath = `events/${eventId}/cover-${Date.now()}-${file.name}`;

  const tryUpload = async (bucket: string) => {
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return pub.publicUrl;
  };

  try {
    return await tryUpload(primaryBucket);
  } catch (err: any) {
    if ([400, 401, 403, 404].includes(err?.status)) {
      console.warn(`Primary bucket '${primaryBucket}' failed (${err?.status}). Falling back to '${fallbackBucket}'.`);
      return await tryUpload(fallbackBucket);
    }
    throw err;
  }
};

export function EventManagement() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"list" | "create">("list");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
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
      coverFile: null,
      visibility: "draft",
      unlimitedAttendees: false,
      videoLink: "",
    });

  const resetForm = () =>
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
      coverFile: null,
      visibility: "draft",
      unlimitedAttendees: false,
      videoLink: "",
    });

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
        if (error) throw error;
        setEvents(data || []);
      } catch (e) {
        console.error("Failed to load events", e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

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
          (event.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.host || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [events, searchTerm]
  );

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.shortDescription) return;
    setSaving(true);
    (async () => {
      try {
        const payload: any = {
          title: newEvent.title,
          description: newEvent.shortDescription || newEvent.description,
          cover_image: newEvent.coverImage || "/placeholder-event.svg",
          date: toDateOnly(newEvent.startAt),
          time: toTime24h(newEvent.startAt),
          location: newEvent.location || null,
          host: newEvent.host || null,
          attendees: 0,
          max_attendees: newEvent.unlimitedAttendees ? null : newEvent.maxAttendees,
          category: newEvent.category,
          featured: newEvent.featured,
        };
        const eventId = editingId || (globalThis.crypto?.randomUUID?.() || `${Date.now()}`);

        if (newEvent.coverFile) {
          try {
            const publicUrl = await uploadEventCover(newEvent.coverFile, eventId);
            payload.cover_image = publicUrl;
          } catch (uploadErr) {
            console.error("Cover upload failed", uploadErr);
            alert("Failed to upload cover image. Please try again.");
            setSaving(false);
            return;
          }
        }

        const newRow: EventRecord = { id: eventId, ...payload };
        const op = editingId
          ? await supabase.from("events").update(payload, { returning: "minimal" }).eq("id", editingId)
          : await supabase.from("events").insert({ id: eventId, ...payload }, { returning: "minimal" });
        if (op.error) throw op.error;

        setEvents((prev) =>
          editingId
            ? prev.map((e) => (e.id === editingId ? { ...e, ...newRow } : e))
            : [...prev, newRow]
        );
        resetForm();
        setEditingId(null);
        setMode("list");
      } catch (e) {
        console.error("Failed to save event", e);
        const msg = (e?.message || e?.error?.message || e?.details || "Failed to save event. Please try again.") as string;
        alert(msg);
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleDeleteEvent = (eventId: string) => {
    (async () => {
      try {
        await supabase.from("events").delete().eq("id", eventId);
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
        if (editingId === eventId) {
          resetForm();
          setEditingId(null);
          setMode("list");
        }
      } catch (e) {
        console.error("Failed to delete event", e);
        alert("Failed to delete event.");
      }
    })();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "TBD";
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
          {loading && <div className="text-muted-foreground">Loading events…</div>}
          {!loading && (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={
                        (() => {
                          const candidate = event.coverImage || event.cover_image;
                          if (candidate && candidate.startsWith("blob:")) return "/placeholder-event.svg";
                          return candidate || "/placeholder-event.svg";
                        })()
                      }
                      alt={event.title}
                      className="w-16 h-16 rounded object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.dataset.fallback) return;
                        target.dataset.fallback = "1";
                        target.src = "/placeholder-event.svg";
                      }}
                    />
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      {event.featured && (
                        <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                      )}
                        <Badge variant="outline" className="text-xs">
                          {event.category || "Event"}
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
                          <span>{event.time || "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location || "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {(event.attendees ?? 0)}/{event.maxAttendees ?? event.max_attendees ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      View Event
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(event.id);
                      setNewEvent({
                        title: event.title || "",
                        shortDescription: event.description || "",
                        url: "",
                        startAt: toInputDateTime(event.date, event.time),
                          endAt: "",
                          location: event.location || "",
                          host: event.host || "",
                          maxAttendees: event.max_attendees ?? 50,
                          category: event.category || "Workshop",
                          featured: !!event.featured,
                        description: event.long_description || "",
                        socialHashtag: "",
                        tags: [],
                        coverImage: event.cover_image || "",
                        coverFile: null,
                        visibility: "draft",
                        unlimitedAttendees: event.max_attendees === null,
                        videoLink: "",
                      });
                        setMode("create");
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredEvents.length === 0 && (
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
        <h2 className="text-2xl font-semibold">{editingId ? "Edit event" : "Host a new event"}</h2>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
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
                      setNewEvent({ ...newEvent, coverImage: objectUrl, coverFile: file });
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
                    x
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

          <div className="space-y-2 border rounded-md p-4 text-sm">
            <p className="text-base font-semibold">Visibility</p>
            <p className="text-muted-foreground">Your event is only visible to you and other admins until published.</p>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={newEvent.visibility === "draft"}
                onChange={() => setNewEvent({ ...newEvent, visibility: "draft" })}
              />
              Draft — keep private while editing
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={newEvent.visibility === "public"}
                onChange={() => setNewEvent({ ...newEvent, visibility: "public" })}
              />
              Published — event is visible
            </label>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreateEvent} disabled={!newEvent.title || !newEvent.shortDescription || saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create event & preview"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return mode === "list" ? renderList() : renderCreate();
}
