import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import supabase from '../../utils/supabase/client';
import { Plus, X, Users, Hash, Upload as UploadIcon, Image as ImageIcon, FileText, Link as LinkIcon, Bold, Italic, List, ChevronUp, ChevronDown } from 'lucide-react';
import { TagPicker } from '../TagPicker';
import { uploadProjectFile, deleteProjectFile, uploadWebGLBuildFromZip, deleteStoragePrefix } from '../../utils/fileStorage';

const FILE_CONTENT_OPTIONS = [
  { value: 'download', label: 'Download' },
  { value: 'executable', label: 'Executable' },
  { value: 'soundtrack', label: 'Soundtrack' },
  { value: 'source', label: 'Source code' },
  { value: 'document', label: 'Book or Document' },
  { value: 'video', label: 'Video' },
  { value: 'mod', label: 'Mod' },
  { value: 'graphics', label: 'Graphical assets' },
  { value: 'audio', label: 'Audio assets' },
  { value: 'instructions', label: 'Documentation / Instructions' },
] as const;
type FileContentKind = typeof FILE_CONTENT_OPTIONS[number]['value'];
const FILE_CONTENT_LABEL_MAP: Record<FileContentKind, string> = FILE_CONTENT_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {} as Record<FileContentKind, string>);
const DEFAULT_FILE_CONTENT: FileContentKind = 'download';

const getBaseFileType = (value?: string | null) => {
  if (!value) return '';
  const [base] = value.split(':');
  return base || value;
};
const getContentKindFromStored = (value?: string | null): FileContentKind | null => {
  if (!value) return null;
  const [, kind] = value.split(':');
  return (kind as FileContentKind) || null;
};

const guessContentKind = (file: File): FileContentKind => {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.zip') || name.endsWith('.exe')) return 'executable';
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.flac')) return 'audio';
  if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi') || name.endsWith('.webm')) return 'video';
  if (name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
  if (name.includes('source')) return 'source';
  if (name.includes('soundtrack')) return 'soundtrack';
  if (name.includes('instructions') || name.includes('readme')) return 'instructions';
  return DEFAULT_FILE_CONTENT;
};

const supportsBrowserPlay = (file: File) => {
  const lower = (file.name || '').toLowerCase();
  return lower.endsWith('.zip');
};

const looksLikeWebGLName = (file: File) => {
  const lower = (file.name || '').toLowerCase();
  return /(webgl|html5|unity)/i.test(lower);
};

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

type PendingDocItem = {
  id: string;
  file: File;
  type: 'project' | 'document';
  contentKind: FileContentKind;
  playInBrowser: boolean;
  autoPlayable: boolean;
};

export default function UploadProjectPage({
  currentUser,
  projectId: editProjectId,
  onProjectUpdated,
  initialProject,
}: UploadProjectPageProps = {}) {
  const navigate = useNavigate();
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
  const [visibility, setVisibility] = useState<'unlisted' | 'public'>('unlisted');
  const [fullDescription, setFullDescription] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [files, setFiles] = useState<Array<any>>([]);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([]);
  const [pendingDocs, setPendingDocs] = useState<PendingDocItem[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  // Removed global make-cover toggle; cover is chosen per-image in previews

  const isEditing = Boolean(editProjectId);

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
        const { data } = await supabase.from('project_files').select('*').eq('project_id', editProjectId).order('created_at', { ascending: true });
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

  const detailsPrefilled = useRef(false);

  useEffect(() => {
    detailsPrefilled.current = false;
  }, [editProjectId]);

  useEffect(() => {
    if (!editProjectId || detailsPrefilled.current) return;
    const applyProjectDetails = (proj: any) => {
      setTitle(proj.title || '');
      setShortDescription(proj.description || '');
      setFullDescription(proj.full_description || '');
      const knownCategories = ['Art', 'Animation', 'Game', 'Simulation', 'Others'];
      const incomingCategory = proj.category || '';
      if (!incomingCategory) {
        setCategory('');
        setCustomCategory('');
      } else if (knownCategories.includes(incomingCategory)) {
        setCategory(incomingCategory);
        if (incomingCategory === 'Others') {
          setCustomCategory('');
        } else {
          setCustomCategory('');
        }
      } else {
        setCategory('Others');
        setCustomCategory(incomingCategory);
      }
      setVisibility(proj.visibility === 'public' ? 'public' : 'unlisted');
      detailsPrefilled.current = true;
    };

    if (initialProject) {
      applyProjectDetails(initialProject);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('title, description, category, full_description, visibility')
          .eq('id', editProjectId)
          .single();
        if (data) applyProjectDetails(data);
      } catch (error) {
        console.warn('Failed to load project details', error);
      }
    })();
  }, [editProjectId, initialProject]);

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
      visibility: 'unlisted',
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
      .order('created_at', { ascending: true });
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
      // Auto-mark the first image as cover if none selected yet
      const hasCover = next.some(item => isFileMedia(item) && item.type === 'image' && item.isCover);
      if (!hasCover) {
        const firstImageIndex = next.findIndex(item => isFileMedia(item) && item.type === 'image');
        if (firstImageIndex >= 0) {
          next[firstImageIndex] = { ...(next[firstImageIndex] as any), isCover: true };
        }
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
        const contentKind = guessContentKind(f);
        const supportsPlay = supportsBrowserPlay(f);
        const autoPlayable = supportsPlay && looksLikeWebGLName(f);
        next.push({
          id,
          file: f,
          type,
          contentKind,
          playInBrowser: autoPlayable,
          autoPlayable
        });
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

    if (checked) {
      setFiles(prev =>
        prev.map(file =>
          file.file_type === 'image'
            ? { ...file, is_cover: false }
            : file
        )
      );
    }
  };

  async function uploadPending(pid: string) {
    let coverChosenPath: string | null = null;
    let assignedDefaultCover = false;
    const hasExistingCover = (files || []).some(f => f.is_cover && f.file_type === 'image');
    const fileMedia = pendingMedia.filter(isFileMedia);
    const anyMarkedCover = fileMedia.some(m => m.type === 'image' && m.isCover);
    const baseTime = Date.now();
    if (anyMarkedCover) {
      await supabase.from('project_files').update({ is_cover: false }).eq('project_id', pid).eq('file_type', 'image');
    }
    for (let i = 0; i < pendingMedia.length; i++) {
      const item = pendingMedia[i];
      if (!isFileMedia(item)) {
        const created = new Date(baseTime + i).toISOString();
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
          is_cover: false,
          created_at: created
        };
        await supabase.from('project_files').insert([row]);
        continue;
      }
      const isImage = item.type === 'image';
      const res = await uploadProjectFile({ projectId: pid, fileType: item.type, file: item.file, generateThumbnail: isImage });
      const rowId = createTempId();
      const setAsCover = isImage && ((item.isCover === true) || (!hasExistingCover && !coverChosenPath && !assignedDefaultCover));
      const created = new Date(baseTime + i).toISOString();
      const row: any = {
        id: rowId,
        project_id: pid,
        file_name: item.file.name,
        file_url: res.fileUrl,
        file_path: res.filePath,
        file_type: item.type,
        file_size: item.file.size,
        mime_type: item.file.type,
        is_cover: setAsCover,
        created_at: created
      };
      await supabase.from('project_files').insert([row]);
      if (row.is_cover) {
        coverChosenPath = row.file_path;
        assignedDefaultCover = true;
      }
    }
    if (coverChosenPath) await supabase.from('projects').update({ cover_image: coverChosenPath }).eq('id', pid);
    let createdOffset = 0;
    for (let idx = 0; idx < pendingDocs.length; idx++) {
      const d = pendingDocs[idx];
      const canPlay = d.playInBrowser && supportsBrowserPlay(d.file);
      let processedWebgl = false;
      if (canPlay) {
        try {
          const webglUpload = await uploadWebGLBuildFromZip({ projectId: pid, zipFile: d.file, force: true });
          if (webglUpload) {
            const webglRowId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
            const created = new Date(baseTime + pendingMedia.length + idx + createdOffset).toISOString();
            const webglRow: any = {
              id: webglRowId,
              project_id: pid,
              file_name: `${d.file.name.replace(/\\.zip$/i, '')} (WebGL)`,
              file_url: webglUpload.indexUrl,
              file_path: webglUpload.indexPath,
              file_type: 'webgl',
              file_size: d.file.size,
              mime_type: 'text/html',
              is_cover: false,
              created_at: created
            };
            await supabase.from('project_files').insert([webglRow]);
            createdOffset += 1;
            processedWebgl = true;
          }
        } catch (err) {
          console.warn('WebGL upload failed, keeping raw archive only', err);
        }
      }

      if (processedWebgl) {
        continue;
      }

      const storedFileType = `${d.type}${d.contentKind ? `:${d.contentKind}` : ''}`;
      const res = await uploadProjectFile({ projectId: pid, fileType: storedFileType, file: d.file, generateThumbnail: false });
      const rowId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const created = new Date(baseTime + pendingMedia.length + idx + createdOffset).toISOString();
      const row: any = {
        id: rowId,
        project_id: pid,
        file_name: d.file.name,
        file_url: res.fileUrl,
        file_path: res.filePath,
        file_type: storedFileType,
        file_size: d.file.size,
        mime_type: d.file.type,
        is_cover: false,
        created_at: created
      };
      await supabase.from('project_files').insert([row]);
      createdOffset += 1;
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

  const toggleExistingCover = async (fileId: string, checked: boolean) => {
    const pid = editProjectId || newProjectId;
    if (!pid) return;

    if (checked) {
      setPendingMedia(prev =>
        prev.map(item =>
          isFileMedia(item) && item.type === 'image'
            ? { ...item, isCover: false }
            : item
        )
      );

      await handleSetCover(fileId);
      return;
    }

    try {
      await supabase
        .from('project_files')
        .update({ is_cover: false })
        .eq('id', fileId);

      await supabase
        .from('projects')
        .update({ cover_image: null })
        .eq('id', pid);

      await refreshFiles(pid);
    } catch {
      alert('Failed to update cover');
    }
  };

  const moveExistingMedia = (fileId: string, delta: number) => {
    setFiles(prev => {
      const mediaIndexes: number[] = [];
      prev.forEach((file, index) => {
        if (file.file_type === 'image' || file.file_type === 'video') {
          mediaIndexes.push(index);
        }
      });

      const currentIndex = prev.findIndex(f => f.id === fileId);
      if (currentIndex === -1) return prev;

      const positionInMedia = mediaIndexes.indexOf(currentIndex);
      if (positionInMedia === -1) return prev;

      const nextPosition = positionInMedia + delta;
      if (nextPosition < 0 || nextPosition >= mediaIndexes.length) return prev;

      const targetIndex = mediaIndexes[nextPosition];
      const updated = [...prev];
      const [moved] = updated.splice(currentIndex, 1);
      const adjustedTargetIndex = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
      updated.splice(adjustedTargetIndex, 0, moved);
      return updated;
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    const pid = editProjectId || newProjectId;
    if (!pid) return;
    const f = files.find(x => x.id === fileId);
    if (!f) return;
    try {
      if (f.file_type === 'webgl' && f.file_path) {
        const folderPrefix = f.file_path.includes('/') ? f.file_path.slice(0, f.file_path.lastIndexOf('/') + 1) : '';
        if (folderPrefix) {
          await deleteStoragePrefix(folderPrefix);
        } else {
          await deleteProjectFile(f.file_path);
        }
      } else if (f.file_path) {
        await deleteProjectFile(f.file_path);
      }
      await supabase.from('project_files').delete().eq('id', fileId);
      await refreshFiles(pid);
    } catch {
      alert('Failed to delete file');
    }
  };

  const persistFileOrder = async (pid: string) => {
    const mediaOnly = files.filter(f => f.file_type === 'image' || f.file_type === 'video');
    if (!mediaOnly.length) return;
    const base = Date.now();
    for (let i = 0; i < mediaOnly.length; i++) {
      const when = new Date(base + i).toISOString();
      await supabase.from('project_files').update({ created_at: when }).eq('id', mediaOnly[i].id);
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

  const categoryIsMissing = useMemo(() => {
    if (!category.trim()) return true;
    if (category === 'Others' && !customCategory.trim()) return true;
    return false;
  }, [category, customCategory]);

  const handleSaveProject = async () => {
    if (!currentUser) {
      alert('You must be logged in to save a project');
      return;
    }
    if (!title.trim()) {
      alert('Title is required');
      return;
    }
    if (categoryIsMissing) {
      alert('Category is required');
      return;
    }

    setIsUploading(true);
    try {
      const pid = await ensureProject();
      await uploadPending(pid);
      const finalCategory = (category === 'Others' ? (customCategory.trim() || 'Others') : category) || null;
      await supabase.from('projects').update({
        visibility,
        title: title?.trim(),
        description: shortDescription || null,
        category: finalCategory,
        full_description: fullDescription || null,
        tags
      }).eq('id', pid);

      const resolvedOwnerId = owner?.id || currentUser?.id || null;
      if (resolvedOwnerId) {
        await supabase.from('project_collaborators').upsert({
          project_id: pid,
          user_id: resolvedOwnerId,
          job_role: ownerJobRole || null,
          role: 'owner',
          invited_by: currentUser?.id
        }, { onConflict: 'project_id,user_id' });

        await supabase
          .from('project_collaborators')
          .delete()
          .eq('project_id', pid)
          .neq('user_id', resolvedOwnerId);

        if (members.length > 0) {
          const rows = members
            .filter(m => m.id !== resolvedOwnerId)
            .map(m => ({
              project_id: pid,
              user_id: m.id,
              job_role: m.role || null,
              role: 'member',
              invited_by: currentUser?.id
            }));
          if (rows.length) await supabase.from('project_collaborators').insert(rows);
        }
      }

      await persistFileOrder(pid);
      if (onProjectUpdated) await onProjectUpdated();
      navigate(`/projects/${pid}`, { replace: !!editProjectId });
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Failed to save');
    } finally {
      setIsUploading(false);
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

  // Unified upload/edit page UI
  if (loading && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
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
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditing ? 'Edit Project' : 'Create a New Project'}</h1>
          <p className="text-gray-600">Uploads and details - one page, like itch.io.</p>
        </div>

        {/* Details */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-semibold">Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title <span className="text-red-500">*</span></label>
                  <Input required aria-invalid={title.trim().length === 0} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
                  {title.trim().length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Title is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded-md h-9 px-2 bg-background text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-invalid={categoryIsMissing}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Art">Art</option>
                    <option value="Animation">Animation</option>
                    <option value="Game">Game</option>
                    <option value="Simulation">Simulation</option>
                    <option value="Others">Others</option>
                  </select>
                  {category === 'Others' && (
                    <div className="mt-2">
                      <label className="block text-xs text-muted-foreground mb-2">Specify category</label>
                      <Input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Type your category" />
                    </div>
                  )}
                  {categoryIsMissing && (
                    <p className="text-xs text-red-500 mt-1">Category is required</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Visibility</label>
                  <select className="w-full border rounded-md h-9 px-2 bg-background text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unlisted projects stay off the home page and search results, but you and your collaborators can access them via profile.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <TagPicker value={tags} onChange={setTags} suggestions={allTagSuggestions} placeholder="Add tags (press Enter)" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Project overview</label>
                <Textarea rows={3} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-liner shown in cards" />
              </div>
            </CardContent>
          </Card>

        {/* Description */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Description</h2>
              <div className="flex items-center gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<b>', '</b>')}><Bold className="w-3 h-3" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<i>', '</i>')}><Italic className="w-3 h-3" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<ul>\n<li>', '</li>\n</ul>')}><List className="w-3 h-3" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={() => wrapSelection('<a href="">', '</a>')}><LinkIcon className="w-3 h-3" /></Button>
              </div>
            </div>
            <Textarea ref={descRef} rows={10} value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Write your project page content (HTML allowed)" />
            <p className="text-xs text-muted-foreground">Tip: Basic HTML supported. Use buttons for quick formatting.</p>
          </CardContent>
        </Card>
        {/* Uploads (separated) */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            {/* Media */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> Media (images/videos)
                    </h2>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" size="sm" disabled={uploadingFiles} onClick={() => mediaInputRef.current?.click()}>
                            Add media
                        </Button>
                        <div className="flex gap-2">
                            <Input placeholder="Paste video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="h-9" />
                            <Button type="button" onClick={handleAddVideoUrl} size="sm">Add URL</Button>
                        </div>
                    </div>
                </div>

                {pendingMedia.length === 0 && files.filter(f => f.file_type === 'image' || f.file_type === 'video').length === 0 ? (
                    <div
                        className="border-2 border-dashed border-muted-foreground/30 rounded-lg px-8 py-12 text-center cursor-pointer hover:border-primary/70 transition-colors bg-muted/20"
                        onClick={() => mediaInputRef.current?.click()}
                    >
                        <input
                          ref={mediaInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          style={{ display: 'none' }}
                          onChange={(e) => chooseFiles(e.target.files)}
                        />
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
                            <UploadIcon className="w-10 h-10" />
                            <span className="font-medium">Drag & drop files or <span className="text-primary">browse</span></span>
                            <span className="text-xs">Supported formats: JPG, PNG, GIF, MP4, etc.</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <input
                          ref={mediaInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          style={{ display: 'none' }}
                          onChange={(e) => chooseFiles(e.target.files)}
                        />
                        {pendingMedia.length > 0 && (
                            <div className="space-y-3">
                                {pendingMedia.map((m, index) => (
                                    <div key={m.id} className="flex items-center gap-4 p-3 border rounded-md bg-background">
                                        {m.kind === 'url' ? (
                                            <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted flex items-center justify-center"><LinkIcon className="w-6 h-6" /></div>
                                        ) : (
                                            <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                                {m.type === 'image' ? (
                                                    <img src={URL.createObjectURL(m.file)} alt="preview" className="w-full h-full object-cover rounded-md" />
                                                ) : (
                                                    <FileText className="w-6 h-6 text-muted-foreground" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 text-sm">
                                            <div className="font-medium text-primary truncate">{m.kind === 'file' ? m.file.name : m.url}</div>
                                            <div className="text-xs text-muted-foreground truncate">{m.kind === 'file' ? `${m.file.type} - ${m.file.size.toLocaleString()} bytes` : 'Remote Video'}</div>
                                            {m.kind === 'file' && m.type === 'image' && (
                                                <label className="inline-flex items-center gap-2 text-xs mt-1">
                                                    <input type="checkbox" checked={!!m.isCover} onChange={(e) => togglePendingCover(m.id, e.target.checked)} />
                                                    <span>Use as cover</span>
                                                </label>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {pendingMedia.length > 1 && (
                                                <div className="inline-flex items-center rounded-md border bg-muted/50">
                                                    <Button
                                                      type="button"
                                                      size="icon"
                                                      variant="ghost"
                                                      className="rounded-none border-r border-border h-8 w-8"
                                                      onClick={() => movePendingMedia(m.id, -1)}
                                                      aria-label="Move up"
                                                      title="Move up"
                                                      disabled={index === 0}
                                                    >
                                                      <ChevronUp className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      size="icon"
                                                      variant="ghost"
                                                      className="rounded-none h-8 w-8"
                                                      onClick={() => movePendingMedia(m.id, 1)}
                                                      aria-label="Move down"
                                                      title="Move down"
                                                      disabled={index === pendingMedia.length - 1}
                                                    >
                                                      <ChevronDown className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => setPendingMedia(prev => prev.filter(x => x.id !== m.id))}><X className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(() => {
                            const mediaFiles = files.filter(f => f.file_type === 'image' || f.file_type === 'video');
                            if (mediaFiles.length === 0) return null;

                            return mediaFiles.map((f, idx) => (
                              <div key={f.id} className="flex items-center gap-4 p-3 border rounded-md bg-background">
                                <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                  {f.file_type === 'image' ? (
                                    <img src={f.file_url} alt={f.file_name} className="w-full h-full object-cover rounded-md" />
                                  ) : (
                                    <video src={f.file_url} className="w-full h-full object-cover rounded-md" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-sm">
                                  <div className="font-medium text-primary truncate">{f.file_name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{f.mime_type} - {(f.file_size || 0).toLocaleString()} bytes</div>
                                  {f.file_type === 'image' && (
                                    <label className="inline-flex items-center gap-2 text-xs mt-1">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!f.is_cover}
                                        onChange={(e) => toggleExistingCover(f.id, e.target.checked)}
                                      />
                                      <span>Use as cover</span>
                                    </label>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {mediaFiles.length > 1 && (
                                    <div className="inline-flex items-center rounded-md border bg-muted/50">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-none border-r border-border h-8 w-8"
                                        onClick={() => moveExistingMedia(f.id, -1)}
                                        aria-label="Move up"
                                        title="Move up"
                                        disabled={idx === 0}
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-none h-8 w-8"
                                        onClick={() => moveExistingMedia(f.id, 1)}
                                        aria-label="Move down"
                                        title="Move down"
                                        disabled={idx === mediaFiles.length - 1}
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteFile(f.id)}
                                    aria-label="Remove"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ));
                        })()}
                    </div>
                )}
            </div>

            <div className="border-t border-border -mx-6"></div>

            {/* Project files */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> Project Files</h2>
                    <Button type="button" variant="outline" size="sm" disabled={uploadingFiles} onClick={() => projectInputRef.current?.click()}>{uploadingFiles ? 'Uploading...' : 'Upload files'}</Button>
                </div>
                
                {pendingDocs.length === 0 && files.filter(f => !['image','video'].includes(f.file_type)).length === 0 ? (
                    <div
                        className="border-2 border-dashed border-muted-foreground/30 rounded-lg px-8 py-12 text-center cursor-pointer hover:border-primary/70 transition-colors bg-muted/20"
                        onClick={() => projectInputRef.current?.click()}
                    >
                        <input
                          ref={projectInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          style={{ display: 'none' }}
                          onChange={(e) => chooseFiles(e.target.files)}
                          accept=".zip,.rar,.7z,.tar,.gz,.dmg,.exe,.app,.pdf,.doc,.docx,.ppt,.pptx,.txt,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                        />
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
                            <UploadIcon className="w-10 h-10" />
                            <span className="font-medium">Drag & drop files or <span className="text-primary">browse</span></span>
                            <span className="text-xs">Archives, documents, executables, etc.</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <input
                          ref={projectInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          style={{ display: 'none' }}
                          onChange={(e) => chooseFiles(e.target.files)}
                          accept=".zip,.rar,.7z,.tar,.gz,.dmg,.exe,.app,.pdf,.doc,.docx,.ppt,.pptx,.txt,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pendingDocs.map(d => {
                                const supportsPlay = supportsBrowserPlay(d.file);
                                return (
                                    <div key={d.id} className="p-3 border rounded-md bg-background space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded bg-muted"><FileText className="w-5 h-5" /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate text-sm font-medium">{d.file.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{d.file.type} - {d.file.size.toLocaleString()} bytes</div>
                                            </div>
                                            <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => setPendingDocs(prev => prev.filter(x => x.id !== d.id))}><X className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-semibold mb-1">File content</label>
                                                <select className="w-full border rounded-md h-9 px-2 bg-background text-sm" value={d.contentKind} onChange={(e) => setPendingDocs(prev => prev.map(item => item.id === d.id ? { ...item, contentKind: e.target.value as FileContentKind } : item))}>
                                                    {FILE_CONTENT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                                </select>
                                            </div>
                                            {supportsPlay && (
                                                <div className="flex items-end pb-1">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" className="h-4 w-4" checked={d.playInBrowser} onChange={(e) => setPendingDocs(prev => prev.map(item => item.id === d.id ? { ...item, playInBrowser: e.target.checked } : item))} />
                                                        <span>Play in browser</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(files.filter(f => !['image','video'].includes(f.file_type))).map((f) => (
                                <div key={f.id} className="flex items-center gap-3 p-3 border rounded-md bg-background">
                                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded bg-muted"><FileText className="w-5 h-5" /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate text-sm font-medium">{f.file_name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {f.file_type === 'webgl' ? 'WebGL build' : `${FILE_CONTENT_LABEL_MAP[getContentKindFromStored(f.file_type) || DEFAULT_FILE_CONTENT] || 'File'}`} - {(f.file_size || 0).toLocaleString()} bytes
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteFile(f.id)} aria-label="Delete"><X className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Team</h3>
            <div className="space-y-2">
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
          <Button disabled={title.trim().length === 0 || isUploading} onClick={handleSaveProject}>
            {isUploading ? 'Saving...' : isEditing ? 'Save changes' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}





