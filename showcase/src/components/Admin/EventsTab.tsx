import { useState } from 'react';
import { TabsContent } from '../ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  CalendarRange,
  Link,
  MapPin,
  Users,
  Upload,
  FileText,
  Shield,
  Eye,
  Tag,
  ListChecks,
  Bell,
} from 'lucide-react';

interface EventDraft {
  name: string;
  shortDescription: string;
  urlSlug: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  votingEndDate: string;
  shortDescription: string;
  fullDescription: string;
  bannerUrl: string;
  location: string;
  registrationLink: string;
  teamSize: string;
  rules: string;
  prizes: string;
  tags: string;
  hashtag: string;
  coverFileName: string;
  ranked: boolean;
  voterScope: 'submitters' | 'submitters_contributors' | 'judges' | 'public';
  ratingQueue: 'disabled' | 'all_voters' | 'exclude_submitters';
  hideResults: boolean;
  hideSubmissionsUntilEnd: boolean;
  lockNewUploadsDuringVoting: boolean;
  enableCommunity: boolean;
  published: boolean;
  unlisted: boolean;
}

export function EventsTab() {
  const [eventDraft, setEventDraft] = useState<EventDraft>({
    name: '',
    urlSlug: '',
    startDate: '',
    endDate: '',
    submissionDeadline: '',
    votingEndDate: '',
    shortDescription: '',
    fullDescription: '',
    location: '',
    registrationLink: '',
    teamSize: '',
    rules: '',
    prizes: '',
    tags: '',
    hashtag: '',
    coverFileName: '',
    ranked: true,
    voterScope: 'submitters',
    ratingQueue: 'disabled',
    hideResults: false,
    hideSubmissionsUntilEnd: false,
    lockNewUploadsDuringVoting: false,
    enableCommunity: true,
    published: false,
    unlisted: false,
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingLink, setPendingLink] = useState('');
  const [pendingAlt, setPendingAlt] = useState('');

  const updateDraft = (key: keyof EventDraft, value: string) => {
    setEventDraft(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
    <TabsContent value="events" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Host a new event (design only)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Itch.io-style structure for DDCT events. No persistence yet—this is the blueprint before wiring Supabase.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={eventDraft.name}
                  onChange={(e) => updateDraft('name', e.target.value)}
                  placeholder="DDCT Fall Game Jam"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL slug</label>
                <Input
                  value={eventDraft.urlSlug}
                  onChange={(e) => updateDraft('urlSlug', e.target.value)}
                  placeholder="ddct-fall-jam"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarRange className="w-4 h-4" /> Start date
                </label>
                <Input
                  type="datetime-local"
                  value={eventDraft.startDate}
                  onChange={(e) => updateDraft('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarRange className="w-4 h-4" /> End date
                </label>
                <Input
                  type="datetime-local"
                  value={eventDraft.endDate}
                  onChange={(e) => updateDraft('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarRange className="w-4 h-4" /> Submission deadline
                </label>
                <Input
                  type="datetime-local"
                  value={eventDraft.submissionDeadline}
                  onChange={(e) => updateDraft('submissionDeadline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarRange className="w-4 h-4" /> Voting end date
                </label>
                <Input
                  type="datetime-local"
                  value={eventDraft.votingEndDate}
                  onChange={(e) => updateDraft('votingEndDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover image</label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      updateDraft('coverFileName', file ? file.name : '');
                    }}
                  />
                  {eventDraft.coverFileName && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {eventDraft.coverFileName} (will upload to storage in next step)
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location / venue
                </label>
                <Input
                  value={eventDraft.location}
                  onChange={(e) => updateDraft('location', e.target.value)}
                  placeholder="On-campus, Room 301 or online"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Link className="w-4 h-4" /> Registration link
                </label>
                <Input
                  value={eventDraft.registrationLink}
                  onChange={(e) => updateDraft('registrationLink', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" /> Team size / participation
                </label>
                <Input
                  value={eventDraft.teamSize}
                  onChange={(e) => updateDraft('teamSize', e.target.value)}
                  placeholder="Solo / Teams up to 4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Short description</label>
              <Input
                value={eventDraft.shortDescription}
                onChange={(e) => updateDraft('shortDescription', e.target.value)}
                placeholder="One-liner for cards and listings"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description (HTML allowed)
                </label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs">B</Button>
                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs">I</Button>
                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs">List</Button>
                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setShowLinkModal(true)}>Link</Button>
                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setShowImageModal(true)}>Image</Button>
                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs">Video</Button>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/10 p-3">
                <Textarea
                  value={eventDraft.fullDescription}
                  onChange={(e) => updateDraft('fullDescription', e.target.value)}
                  rows={8}
                  className="bg-background"
                  placeholder="<p>Write your event page content (HTML allowed)…</p>"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Basic HTML supported. Buttons above will open link/image dialogs (design only).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> Rules / code of conduct
                </label>
                <Textarea
                  value={eventDraft.rules}
                  onChange={(e) => updateDraft('rules', e.target.value)}
                  rows={4}
                  placeholder="Eligibility, content restrictions, submission format... (HTML allowed)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Prizes / recognition
                </label>
                <Textarea
                  value={eventDraft.prizes}
                  onChange={(e) => updateDraft('prizes', e.target.value)}
                  rows={4}
                  placeholder="Certificates, showcase feature, swag..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Tags / categories
                </label>
                <Input
                  value={eventDraft.tags}
                  onChange={(e) => updateDraft('tags', e.target.value)}
                  placeholder="e.g., game-jam, animation, VR"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Social hashtag</label>
                <Input
                  value={eventDraft.hashtag}
                  onChange={(e) => updateDraft('hashtag', e.target.value)}
                  placeholder="#ddctjam"
                />
              </div>
            </div>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Voting & visibility (design)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Kind of event</label>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={!eventDraft.ranked}
                        onChange={() => updateDraft('ranked', false)}
                      />
                      Non-ranked — entries are not voted on
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.ranked}
                        onChange={() => updateDraft('ranked', true)}
                      />
                      Ranked — entries are voted on and ranked
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Who can vote on entries?</label>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.voterScope === 'submitters'}
                        onChange={() => updateDraft('voterScope', 'submitters')}
                      />
                      Submitters only
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.voterScope === 'submitters_contributors'}
                        onChange={() => updateDraft('voterScope', 'submitters_contributors')}
                      />
                      Submitters & contributors
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.voterScope === 'judges'}
                        onChange={() => updateDraft('voterScope', 'judges')}
                      />
                      Judges only
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.voterScope === 'public'}
                        onChange={() => updateDraft('voterScope', 'public')}
                      />
                      Public voting
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Rating queue</label>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.ratingQueue === 'disabled'}
                        onChange={() => updateDraft('ratingQueue', 'disabled')}
                      />
                      Disable queue — any voter can rate any entry any time
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.ratingQueue === 'all_voters'}
                        onChange={() => updateDraft('ratingQueue', 'all_voters')}
                      />
                      All voters must participate in queue
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={eventDraft.ratingQueue === 'exclude_submitters'}
                        onChange={() => updateDraft('ratingQueue', 'exclude_submitters')}
                      />
                      Exclude submitters from queue
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Options</label>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={eventDraft.enableCommunity}
                        onChange={(e) => updateDraft('enableCommunity', e.target.checked)}
                      />
                      Enable community / message board
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={eventDraft.lockNewUploadsDuringVoting}
                        onChange={(e) => updateDraft('lockNewUploadsDuringVoting', e.target.checked)}
                      />
                      Lock new uploads during voting
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={eventDraft.hideResults}
                        onChange={(e) => updateDraft('hideResults', e.target.checked)}
                      />
                      Hide results until manually revealed
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={eventDraft.hideSubmissionsUntilEnd}
                        onChange={(e) => updateDraft('hideSubmissionsUntilEnd', e.target.checked)}
                      />
                      Hide submissions before end
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Visibility
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={eventDraft.published}
                        onChange={(e) => updateDraft('published', e.target.checked)}
                      />
                      Published (listed and open)
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={eventDraft.unlisted}
                        onChange={(e) => updateDraft('unlisted', e.target.checked)}
                      />
                      Unlisted (direct link only)
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button disabled>
                <Upload className="w-4 h-4 mr-2" />
                Save draft (wire Supabase next)
              </Button>
              <p className="text-sm text-muted-foreground">
                Next: connect create/update endpoints, storage uploads for cover and inline images, plus student participation flow.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event data model (planned)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>We plan to store:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>name, urlSlug, cover path, start/end, submissionDeadline, votingEndDate</li>
                <li>shortDescription, fullDescription (HTML), rules (HTML), prizes, tags, hashtag</li>
                <li>location, registrationLink, teamSize</li>
                <li>ranked, voterScope, ratingQueue</li>
                <li>visibility + toggles: enableCommunity, lockNewUploadsDuringVoting, hideResults, hideSubmissionsUntilEnd</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participation & submissions (design)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Target flow:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Students click <Badge variant="outline">Participate</Badge> to join the event roster.</li>
                <li>Store participants (userId, team name, role) and allow linking a project submission.</li>
                <li>Respect deadlines: submissions close at submissionDeadline; voting stops at votingEndDate.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications (planned)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Future additions:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li><Bell className="inline w-3 h-3 mr-1" /> Reminders before submissions/voting close.</li>
                <li>Announcements for new events and results publish.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>

    <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
            <DialogDescription>Select an image to upload and place into the HTML.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="file" accept="image/*" />
            <Input
              placeholder="Alt text"
              value={pendingAlt}
              onChange={(e) => setPendingAlt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageModal(false)}>Cancel</Button>
            <Button onClick={() => setShowImageModal(false)} disabled>
              Upload & Insert (wire to storage next)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
            <DialogDescription>Paste a URL to add to the description content.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="https://example.com"
            value={pendingLink}
            onChange={(e) => setPendingLink(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkModal(false)}>Cancel</Button>
            <Button onClick={() => setShowLinkModal(false)} disabled>
              Insert (wire to editor next)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
