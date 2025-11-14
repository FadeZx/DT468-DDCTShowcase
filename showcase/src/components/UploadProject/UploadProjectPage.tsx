import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import supabase from '../../utils/supabase/client';
import { Plus, X, Users, Crown, Hash, Upload as UploadIcon, Image as ImageIcon, FileText, Link as LinkIcon, Bold, Italic, List, Star, MoveUp, MoveDown } from 'lucide-react';
import { TagPicker } from '../TagPicker';
import { uploadProjectFile, deleteProjectFile } from '../../utils/fileStorage';

interface UploadProjectPageProps {
  currentUser?: any;
  projectId?: string;
  onProjectCreated?: () => void;
  onProjectUpdated?: () => void;
  initialProject?: any;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

type FilePendingMediaItem = {
  id: string;
  kind: 'file';
  file: File;
  type: 'image' | 'video';
  isCover?: boolean;
};

type UrlPendingMediaItem = {
  id: string;
  kind: 'url';
  url: string;
  type: 'video';
};

type PendingMediaItem = FilePendingMediaItem | UrlPendingMediaItem;

export default function UploadProjectPage({
  currentUser,
  projectId: editProjectId,
  onProjectUpdated,
}: UploadProjectPageProps = {}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [newMember, setNewMember] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState<any | null>(null);
  const [ownerJobRole, setOwnerJobRole] = useState<string>("");

  const [tags, setTags] = useState<string[]>([]);
  const [allTagSuggestions, setAllTagSuggestions] = useState<string[]>([]);
  // New-upload mode state
  const [newProjectId, setNewProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [visibility, setVisibility] = useState<'draft' | 'private' | 'unlisted' | 'public'>('draft');
  const [fullDescription, setFullDescription] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [files, setFiles] = useState<Array<any>>([]);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([]);
  const [pendingDocs, setPendingDocs] = useState<Array<{ id: string; file: File; type: 'project'|'document' }>>([]);
  const [videoUrl, setVideoUrl] = useState('');
  // Removed global make-cover toggle; cover is chosen per-image in previews

  const createTempId = () =>
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const getVideoEmbedUrl = (rawUrl: string) => {
    const url = String(rawUrl || '');
    const youtubeMatch = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/);
    if (youtubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch?.[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  const isFileMedia = (item: PendingMediaItem): item is FilePendingMediaItem => item.kind === 'file';
  const VIDEO_PREVIEW_WIDTH = 200; // pixels
  const FILE_PREVIEW_DIMENSIONS = { width: 200, height: 135 }; // pixels

  useEffect(() => {
    // Always load tag suggestions; only load collaborators for edit mode
    loadAllTags();
    if (editProjectId) {
      loadMembers();
      loadOwner();
      loadProjectTags();
      // load existing files for edit mode display if needed later
      (async () => {
        const { data } = await supabase.from('project_files').select('*').eq('project_id', editProjectId).order('created_at', { ascending: false });
        setFiles(data || []);
      })();
    }
  }, [editProjectId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data: memberLinks } = await supabase
        .from('project_collaborators')
        .select('user_id, job_role')
        .eq('project_id', editProjectId);

      if (memberLinks?.length) {
        const memberIds = memberLinks.map(link => link.user_id);
        const { data: memberProfiles } = await supabase
          .from('profiles')
          .select('id, name, email, avatar')
          .in('id', memberIds);

        const memberEntries = (memberProfiles || []).map(profile => {
          const link = memberLinks.find(l => l.user_id === profile.id);
          return {
            id: profile.id,
            name: profile.name || profile.email || 'Member',
            email: profile.email || '',
            role: (link as any)?.job_role || 'contributor',
            avatar: profile.avatar || null,
          };
        });

        setMembers(memberEntries);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };



  const loadProjectTags = async () => {
    try {
      const { data: proj } = await supabase.from("projects").select("tags").eq("id", editProjectId).single();
      const t:any = proj?.tags;
      if (Array.isArray(t)) setTags(t.filter(Boolean));
      else if (typeof t === "string") setTags(t.split(",").map((s:string)=>s.trim()).filter(Boolean));
    } catch (e) {}
  };
  const loadAllTags = async () => {
    try {
      const { data: rows } = await supabase.from("projects").select("tags");
      const set = new Set<string>();
      (rows||[]).forEach((r:any)=>{
        const t:any = r?.tags;
        if (Array.isArray(t)) t.forEach((x:string)=> set.add((x||"").trim()));
        else if (typeof t === "string") t.split(",").forEach((x:string)=> set.add((x||"").trim()));
      });
      setAllTagSuggestions(Array.from(set).filter(Boolean).sort());
    } catch (e) {}
  };

  // Helpers for new upload mode
  const ensureProject = async (): Promise<string> => {
    if (editProjectId) return editProjectId;
    if (newProjectId) return newProjectId;
    if (!currentUser?.id) throw new Error('Please sign in to create a project.');
    const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const resolvedCategory = (category === 'Others' ? (customCategory.trim() || 'Others') : category) || null;
    const payload: any = {
      id,
      title: title?.trim() || 'Untitled Project',
      owner_id: currentUser.id,
      author_id: currentUser.id,
      visibility: 'draft',
      category: resolvedCategory,
      description: shortDescription || null,
      full_description: fullDescription || null,
      tags: tags || []
    };
    const { error } = await supabase.from('projects').insert([payload]);
    if (error) throw error;
    setNewProjectId(id);
    return id;
  };

  const refreshFiles = async (pid: string) => {
    const { data } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', pid)
      .order('created_at', { ascending: false });
    setFiles(data || []);
  };

  const chooseFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const items = Array.from(fileList);
    setPendingMedia(prev => {
      const next = [...prev];
      for (const f of items) {
        const id = createTempId();
        const isImage = (f.type || '').startsWith('image/');
        const isVideo = (f.type || '').startsWith('video/');
        if (isImage || isVideo) next.push({ id, kind: 'file', file: f, type: isImage ? 'image' : 'video', isCover: false });
      }
      return next;
    });
    setPendingDocs(prev => {
      const next = [...prev];
      for (const f of items) {
        const isImage = (f.type || '').startsWith('image/');
        const isVideo = (f.type || '').startsWith('video/');
        if (isImage || isVideo) continue;
        const extMatch = (f.name || '').toLowerCase().match(/\.(zip|rar|7z|exe|app|dmg|tar|gz)$/);
        const type = extMatch ? 'project' : 'document';
        const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        next.push({ id, file: f, type });
      }
      return next;
    });
  };

  const movePendingMedia = (id: string, delta: number) => {
    setPendingMedia(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const reordered = [...prev];
      const [item] = reordered.splice(index, 1);
      reordered.splice(nextIndex, 0, item);
      return reordered;
    });
  };

  const handleAddVideoUrl = () => {
    const url = (videoUrl || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      alert('Enter a valid http(s) URL');
      return;
    }
    setPendingMedia(prev => [...prev, { id: createTempId(), kind: 'url', url, type: 'video' }]);
    setVideoUrl('');
  };

  const togglePendingCover = (id: string, checked: boolean) => {
    setPendingMedia(prev =>
      prev.map(item => {
        if (!isFileMedia(item) || item.type !== 'image') return item;
        if (item.id === id) return { ...item, isCover: checked };
        return checked ? { ...item, isCover: false } : item;
      })
    );
  };

  async function uploadPending(pid: string) {
    let coverChosenPath: string | null = null;
    let assignedDefaultCover = false;
    const hasExistingCover = (files || []).some(f => f.is_cover && f.file_type === 'image');
    const fileMedia = pendingMedia.filter(isFileMedia);
    const anyMarkedCover = fileMedia.some(m => m.type === 'image' && m.isCover);
    if (anyMarkedCover) {
      await supabase.from('project_files').update({ is_cover: false }).eq('project_id', pid).eq('file_type', 'image');
    }
    for (let i = 0; i < pendingMedia.length; i++) {
      const item = pendingMedia[i];
      if (!isFileMedia(item)) {
        const rowId = createTempId();
        const row: any = {
          id: rowId,
          project_id: pid,
          file_name: item.url,
          file_url: item.url,
          file_path: null,
          file_type: 'video',
          file_size: 0,
          mime_type: 'text/url',
          is_cover: false
        };
        await supabase.from('project_files').insert([row]);
        continue;
      }
      const isImage = item.type === 'image';
      const res = await uploadProjectFile({ projectId: pid, fileType: item.type, file: item.file, generateThumbnail: isImage });
      const rowId = createTempId();
      const setAsCover = isImage && ((item.isCover === true) || (!hasExistingCover && !coverChosenPath && !assignedDefaultCover));
      const row: any = {
        id: rowId,
        project_id: pid,
        file_name: item.file.name,
        file_url: res.fileUrl,
        file_path: res.filePath,
        file_type: item.type,
        file_size: item.file.size,
        mime_type: item.file.type,
        is_cover: setAsCover
      };
      await supabase.from('project_files').insert([row]);
      if (row.is_cover) {
        coverChosenPath = row.file_path;
        assignedDefaultCover = true;
      }
    }
    if (coverChosenPath) await supabase.from('projects').update({ cover_image: coverChosenPath }).eq('id', pid);
    for (const d of pendingDocs) {
      const res = await uploadProjectFile({ projectId: pid, fileType: d.type, file: d.file, generateThumbnail: false });
      const rowId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const row: any = {
        id: rowId,
        project_id: pid,
        file_name: d.file.name,
        file_url: res.fileUrl,
        file_path: res.filePath,
        file_type: d.type,
        file_size: d.file.size,
        mime_type: d.file.type,
        is_cover: false
      };
      await supabase.from('project_files').insert([row]);
    }
    setPendingMedia([]);
    setPendingDocs([]);
    await refreshFiles(pid);
  }

  const handleSetCover = async (fileId: string) => {
    const pid = editProjectId || newProjectId;
    if (!pid) return;
    try {
      const selected = files.find(f => f.id === fileId);
      if (!selected) return;
      await supabase.from('project_files').update({ is_cover: false }).eq('project_id', pid).eq('file_type', 'image');
      await supabase.from('project_files').update({ is_cover: true }).eq('id', fileId);
      await supabase.from('projects').update({ cover_image: selected.file_path }).eq('id', pid);
      await refreshFiles(pid);
    } catch {
      alert('Failed to set cover');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const pid = editProjectId || newProjectId;
    if (!pid) return;
    const f = files.find(x => x.id === fileId);
    if (!f) return;
    try {
      await deleteProjectFile(f.file_path);
      await supabase.from('project_files').delete().eq('id', fileId);
      await refreshFiles(pid);
    } catch {
      alert('Failed to delete file');
    }
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = fullDescription.slice(0, start);
    const selected = fullDescription.slice(start, end);
    const after = fullDescription.slice(end);
    const next = `${before}${prefix}${selected}${suffix}${after}`;
    setFullDescription(next);
    requestAnimationFrame(() => {
      try { el.selectionStart = start + prefix.length; el.selectionEnd = end + prefix.length; el.focus(); } catch {}
    });
  };

  const handleSaveDraft = async () => {
    try {
      const pid = await ensureProject();
      // Upload any staged files first
      await uploadPending(pid);
      const payload: any = {
        title: title?.trim() || 'Untitled Project',
        description: shortDescription || null,
        category: category || null,
        visibility,
        full_description: fullDescription || null,
        tags: tags || []
      };
      await supabase.from('projects').update(payload).eq('id', pid);
      await supabase.from('project_collaborators').upsert({ project_id: pid, user_id: currentUser?.id, job_role: ownerJobRole || null, role: 'owner', invited_by: currentUser?.id }, { onConflict: 'project_id,user_id' });
      if (members.length > 0) {
        const rows = members.filter(m => m.id !== currentUser?.id).map(m => ({ project_id: pid, user_id: m.id, job_role: m.role || null, role: 'member', invited_by: currentUser?.id }));
        if (rows.length) await supabase.from('project_collaborators').insert(rows);
      }
      alert('Draft saved');
    } catch (e: any) {
      alert(e?.message || 'Failed to save');
    }
  };

  const loadOwner = async () => {
    try {
      const { data: proj } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', editProjectId)
        .single();
      const ownerId = proj?.owner_id;
      if (!ownerId) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, name, email, avatar')
        .eq('id', ownerId)
        .single();
      if (prof) {
        setOwner(prof);
        // fetch owner's job_role if present
        const { data: ownerCollab } = await supabase
          .from('project_collaborators')
          .select('job_role')
          .eq('project_id', editProjectId)
          .eq('user_id', ownerId)
          .maybeSingle();
        setOwnerJobRole(ownerCollab?.job_role || "");
      }
    } catch (e) {
      console.warn('Failed to load owner', e);
    }
  };

  const addMember = async () => {
    if (!newMember.trim()) return;

    try {
      // Search for user by email or username
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar')
        .or(`email.eq.${newMember.trim()},name.ilike.%${newMember.trim()}%`);

      if (error) throw error;

      if (users && users.length > 0) {
        const user = users[0];
        if (!members.some(member => member.id === user.id)) {
          setMembers(prev => [
            ...prev,
            {
              id: user.id,
              name: user.name || user.email || 'Member',
              email: user.email || '',
              role: 'editor',
              avatar: user.avatar || null,
            }
          ]);
          setNewMember('');
        } else {
          alert('User is already a member');
        }
      } else {
        alert('User not found');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      alert('Error searching for user');
    }
  };

  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('You must be logged in to manage project members');
      return;
    }

    if (!editProjectId) {
      alert('No project ID provided');
      return;
    }

    setIsUploading(true);

    try {
      // Upsert owner job role row (cannot be removed by policies)
      if (owner?.id) {
        const { error: upsertOwnerErr } = await supabase
          .from('project_collaborators')
          .upsert({
            project_id: editProjectId,
            user_id: owner.id,
            job_role: ownerJobRole || null,
            role: 'owner',
            invited_by: currentUser?.id,
          }, { onConflict: 'project_id,user_id' });
        if (upsertOwnerErr) throw upsertOwnerErr;
      }

      // Delete existing non-owner collaborators
      await supabase
        .from('project_collaborators')
        .delete()
        .eq('project_id', editProjectId)
        .neq('user_id', owner?.id || '00000000-0000-0000-0000-000000000000');

      // Insert collaborators (non-owners)
      if (members.length > 0) {
        const memberRows = members
          .filter(m => m.id !== owner?.id)
          .map(member => ({
            project_id: editProjectId,
            user_id: member.id,
            job_role: member.role || null,
            role: 'member',
            invited_by: currentUser?.id
          }));

        if (memberRows.length) {
          const { error: memberErr } = await supabase
            .from('project_collaborators')
            .insert(memberRows);
          if (memberErr) throw memberErr;
        }
      }

      // Save tags to project
      await supabase.from('projects').update({ tags }).eq('id', editProjectId);

      alert('Edit Saved');
      if (editProjectId) {
        window.location.href = `/projects/${editProjectId}`;
      } else {
        window.location.href = '/';
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to update project members');
    } finally {
      setIsUploading(false);
    }
  };

  // New upload page UI (no projectId)
  if (!editProjectId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Project</h1>
            <p className="text-gray-600">Uploads and details â€” one page, like itch.io.</p>
          </div>

          {/* Details */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-xl font-semibold">Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
                  <Input required aria-invalid={title.trim().length === 0} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
                  {title.trim().length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Title is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full border rounded-md h-9 px-2 bg-background" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select category</option>
                    <option value="Art">Art</option>
                    <option value="Animation">Animation</option>
                    <option value="Game">Game</option>
                    <option value="Simulation">Simulation</option>
                    <option value="Others">Others</option>
                  </select>
                  {category === 'Others' && (
                    <div className="mt-2">
                      <label className="block text-xs text-muted-foreground mb-1">Specify category</label>
                      <Input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Type your category" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Visibility</label>
                  <select className="w-full border rounded-md h-9 px-2 bg-background" value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
                    <option value="draft">Draft</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short description</label>
                <Textarea rows={3} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-liner shown in cards" />
              </div>
            </CardContent>
          </Card>

          {/* Uploads (separated) */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-6">
              {/* Media */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><UploadIcon className="w-5 h-5" /> Media (images/videos)</h2>
                  <div className="flex items-center gap-3">
                    <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => chooseFiles(e.target.files)} />
                    <Button type="button" disabled={uploadingFiles} onClick={() => mediaInputRef.current?.click()}><UploadIcon className="w-4 h-4 mr-2" /> {uploadingFiles ? 'Uploading...' : 'Upload media'}</Button>
                    <div className="flex gap-2">
                      <Input placeholder="Paste video URL (YouTube, etc.)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                      <Button type="button" onClick={handleAddVideoUrl}>Add URL</Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">First uploaded image becomes the cover. You can change it below.</p>
                {pendingMedia.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {pendingMedia.map((m, index) => (
                      <div key={m.id} className="flex items-center gap-4 p-3 border rounded-md bg-background">
                        {m.kind === 'url' ? (
                          <div className="flex-shrink-0" style={{ width: VIDEO_PREVIEW_WIDTH }}>
                            <div className="aspect-video rounded-md overflow-hidden bg-muted">
                              <iframe
                                src={getVideoEmbedUrl(m.url)}
                                className="w-full h-full"
                                title={`Video preview ${index + 1}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center"
                            style={{ width: FILE_PREVIEW_DIMENSIONS.width, height: FILE_PREVIEW_DIMENSIONS.height }}
                          >
                            {m.type === 'image' ? (
                              <img
                                src={URL.createObjectURL(m.file)}
                                alt="preview"
                                className="max-w-full max-h-full object-cover"
                              />
                            ) : (
                              <FileText className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-sm">
                          {m.kind === 'file' ? (
                            <div className="flex flex-col gap-1">
                              <div className="font-medium text-primary truncate">{m.file.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{m.file.type} · {m.file.size.toLocaleString()} bytes</div>
                              {m.type === 'image' && (
                                <label className="inline-flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={!!m.isCover}
                                    onChange={(e) => togglePendingCover(m.id, e.target.checked)}
                                  />
                                  Make cover
                                </label>
                              )}
                            </div>
                          ) : (
                            <>
                              <a href={m.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline truncate">{m.url}</a>
                              <div className="text-xs text-muted-foreground">Video URL</div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Move up"
                            disabled={index === 0}
                            onClick={() => movePendingMedia(m.id, -1)}
                          >
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Move down"
                            disabled={index === pendingMedia.length - 1}
                            onClick={() => movePendingMedia(m.id, 1)}
                          >
                            <MoveDown className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => setPendingMedia(prev => prev.filter(x => x.id !== m.id))}><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(files.filter(f => f.file_type === 'image' || f.file_type === 'video')).map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 border rounded-md bg-background">
                      <div className="w-12 h-12 flex items-center justify-center rounded bg-muted">
                        {f.file_type === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{f.file_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{f.mime_type} Â· {(f.file_size || 0).toLocaleString()} bytes</div>
                      </div>
                      {f.file_type === 'image' && (
                        <Button size="sm" variant={f.is_cover ? 'default' : 'outline'} onClick={() => handleSetCover(f.id)} className="mr-2">
                          <Star className="w-3 h-3 mr-1" /> {f.is_cover ? 'Cover' : 'Set cover'}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteFile(f.id)} aria-label="Delete"><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {(files.filter(f => f.file_type === 'image' || f.file_type === 'video')).length === 0 && (
                    <div className="text-sm text-muted-foreground">No media uploaded yet.</div>
                  )}
                </div>
              </div>

              {/* Project files */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><UploadIcon className="w-5 h-5" /> Project Files</h2>
                  <div className="flex items-center gap-2">
                    <input
                      ref={projectInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => chooseFiles(e.target.files)}
                      accept=".zip,.rar,.7z,.tar,.gz,.dmg,.exe,.app,.pdf,.doc,.docx,.ppt,.pptx,.txt,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                    />
                    <Button type="button" disabled={uploadingFiles} onClick={() => projectInputRef.current?.click()}><UploadIcon className="w-4 h-4 mr-2" /> {uploadingFiles ? 'Uploading...' : 'Upload files'}</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingDocs.map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-3 border rounded-md bg-background">
                      <div className="w-12 h-12 flex items-center justify-center rounded bg-muted">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{d.file.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{d.file.type} · {d.file.size.toLocaleString()} bytes</div>
                      </div>
                      <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => setPendingDocs(prev => prev.filter(x => x.id !== d.id))}><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {(files.filter(f => f.file_type === 'project' || f.file_type === 'document')).map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 border rounded-md bg-background">
                      <div className="w-12 h-12 flex items-center justify-center rounded bg-muted">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{f.file_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{f.mime_type} Â· {(f.file_size || 0).toLocaleString()} bytes</div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteFile(f.id)} aria-label="Delete"><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {(files.filter(f => f.file_type === 'project' || f.file_type === 'document')).length === 0 && (
                    <div className="text-sm text-muted-foreground">No project files uploaded yet.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Description</h2>
                <div className="flex items-center gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<b>', '</b>')}><Bold className="w-3 h-3" /></Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<i>', '</i>')}><Italic className="w-3 h-3" /></Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<ul>\n<li>', '</li>\n</ul>')}><List className="w-3 h-3" /></Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<a href=\"\">', '</a>')}><LinkIcon className="w-3 h-3" /></Button>
                </div>
              </div>
              <Textarea ref={descRef} rows={10} value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Write your project page content (HTML allowed)" />
              <p className="text-xs text-muted-foreground">Tip: Basic HTML supported. Use buttons for quick formatting.</p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Tags</h3>
              </div>
              <TagPicker value={tags} onChange={setTags} suggestions={allTagSuggestions} placeholder="Add tags (press Enter)" />
            </CardContent>
          </Card>

          {/* Team */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Team</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Add Member by Email</label>
                <div className="flex gap-2">
                  <Input placeholder="Enter email address" value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addMember()} className="flex-1" />
                  <Button onClick={addMember} size="default"><Plus className="w-4 h-4 mr-2" />Add</Button>
                </div>
              </div>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback>{member.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeMember(member.id)} aria-label="Remove"><X className="w-4 h-4" /></Button>
                  </div>
                ))}
                {members.length === 0 && <div className="text-sm text-muted-foreground">No members yet.</div>}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">

            <Button disabled={title.trim().length === 0} onClick={async () => {
              try {
                const pid = await ensureProject();
                await uploadPending(pid);
                const finalCategory = (category === 'Others' ? (customCategory.trim() || 'Others') : category) || null;
                await supabase.from('projects').update({ visibility, title: title?.trim(), description: shortDescription || null, category: finalCategory, full_description: fullDescription || null, tags }).eq('id', pid);
                window.location.href = `/projects/${pid}`;
              } catch (e: any) { alert(e?.message || 'Failed to save'); }
            }}>Save</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading project data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Project Members
          </h1>
          <p className="text-gray-600">
            Invite team members to collaborate on this project
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Card>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">Project Tags</h3>
                  </div>
                  <TagPicker value={tags} onChange={setTags} suggestions={allTagSuggestions} placeholder="Add tags (press Enter)" />
                  <p className="text-xs text-muted-foreground">Max 10 tags. Use common words users might search for.</p>
                </CardContent>
              </Card>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Add Member by Email</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email address"
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addMember()}
                        className="flex-1"
                      />
                      <Button onClick={addMember} size="default">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter the email address of an existing user. They will be added immediately without needing to accept.
                    </p>
                  </div>

                  {members.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Project Members ({members.length + (owner ? 1 : 0)})</h3>
                      <div className="space-y-2">
                        {owner && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={owner.avatar || undefined} />
                                <AvatarImage src="/placeholder-avatar.svg" />
                                <AvatarFallback>
                                  {owner.name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                  {owner.name || owner.email}
                                  <span className="inline-flex items-center text-xs text-amber-500">
                                    <Crown className="w-3 h-3 mr-1" /> Owner
                                  </span>
                                </p>
                                <div className="mt-1">
                                  <label className="text-xs text-muted-foreground mr-2">Job role</label>
                                  <select
                                    className="text-xs border rounded px-2 py-1 bg-background"
                                    value={ownerJobRole}
                                    onChange={(e) => setOwnerJobRole(e.target.value)}
                                  >
                                    <option value="">(none)</option>
                                    <option value="contributor">Contributor</option>
                                    <option value="programmer">Programmer</option>
                                    <option value="artist">Artist</option>
                                    <option value="designer">Designer</option>
                                    <option value="modeler">Modeler</option>
                                    <option value="animator">Animator</option>
                                    <option value="sound">Sound</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            {/* owner cannot be removed â€” no action shown */}
                          </div>
                        )}
                        {members.filter(member => member.id !== (owner?.id || '')).map(member => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={member.avatar || undefined} />
                                <AvatarImage src="/placeholder-avatar.svg" />
                                <AvatarFallback>
                                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                <div className="mt-1">
                                  <label className="text-xs text-muted-foreground mr-2">Job role</label>
                                  <select
                                    className="text-xs border rounded px-2 py-1 bg-background"
                                    value={member.role}
                                    onChange={(e) => {
                                      const role = e.target.value;
                                      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role } : m));
                                    }}
                                  >
                                    <option value="contributor">Contributor</option>
                                    <option value="programmer">Programmer</option>
                                    <option value="artist">Artist</option>
                                    <option value="designer">Designer</option>
                                    <option value="modeler">Modeler</option>
                                    <option value="animator">Animator</option>
                                    <option value="sound">Sound</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(member.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {members.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No members added yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add members by entering their email above</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            size="lg"
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />Save</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}











