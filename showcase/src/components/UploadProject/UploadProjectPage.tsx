import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea-simple';
import { Badge } from '../ui/badge-simple';
import { Progress } from '../ui/progress-simple';
import supabase from '../../utils/supabase/client';
import { uploadProjectFile, deleteProjectFile } from '../../utils/fileStorage';
import {
  Upload,
  FileText,
  Eye,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Users
} from 'lucide-react';

interface UploadProjectPageProps {
  currentUser?: any;
  projectId?: string;
  onProjectCreated?: () => void;
  onProjectUpdated?: () => void;
  initialProject?: any;
}

type MediaType = 'image' | 'video' | 'file';

type MediaSource = 'storage' | 'external' | 'local';

interface MediaItem {
  id: string;
  type: MediaType;
  name?: string;
  url: string;
  path?: string | null;
  isCover?: boolean;
  order: number;
  size?: number;
  mimeType?: string;
  fileType?: string;
  source?: MediaSource;
  status?: 'uploading' | 'uploaded' | 'error';
}

type MemberRole = 'owner' | 'maintainer' | 'editor' | 'viewer';

interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
}

interface ProjectData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  tags: string[];
  price: number;
  isPublic: boolean;
  members: Member[];
  coverImage?: MediaItem | null; // single cover for card/listing
  media: MediaItem[];            // gallery (images + video links + files)
}

const STEPS = [
  { id: 1, title: 'Project Details', icon: FileText },
  { id: 2, title: 'Media & Files', icon: Upload },
  { id: 3, title: 'Team & Settings', icon: Users },
  { id: 4, title: 'Preview & Publish', icon: Eye }
];

const CATEGORIES = [
  'Game',
  'Animation', 
  'Art',
  'Other'
];



const generateUUID = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? (crypto as any).randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

export default function UploadProjectPage({
  currentUser,
  projectId: editProjectId,
  onProjectCreated,
  onProjectUpdated,
  initialProject
}: UploadProjectPageProps = {}) {
  const editMode = !!editProjectId;
  const demoMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  const [projectFolderId] = useState(() => editProjectId || generateUUID());
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    tags: [],
    price: 0,
    isPublic: true,
    members: [],
    coverImage: null,
    media: []
  });

  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [externalFileName, setExternalFileName] = useState('');
  const [externalFileUrl, setExternalFileUrl] = useState('');

  const progress = (currentStep / STEPS.length) * 100;

  // Load existing project data in edit mode
  useEffect(() => {
    if (editMode && editProjectId) {
      // In demo/mock mode, if we have an initial project from in-memory state, use it and skip fetch
      if (initialProject) {
        const tags = Array.isArray(initialProject.tags)
          ? initialProject.tags
          : initialProject.tags
            ? String(initialProject.tags).split(',').map((t: string) => t.trim())
            : [];
        const mediaItems: MediaItem[] = [];
        if (initialProject.thumbnail) {
          mediaItems.push({
            id: generateUUID(),
            type: 'image',
            name: 'Cover',
            url: initialProject.thumbnail,
            path: `external:${initialProject.thumbnail}`,
            fileType: 'image',
            source: 'external',
            isCover: true,
            order: 0
          });
        }
        const memberEntries: Member[] = Array.isArray(initialProject.members)
          ? initialProject.members.map((m: any) => ({
              id: m.id,
              name: m.name,
              email: m.email || '',
              role: m.role || 'editor'
            }))
          : [];
        setProjectData(prev => ({
          ...prev,
          title: initialProject.title || '',
          shortDescription: initialProject.description || '',
          fullDescription: initialProject.longDescription || '',
          category: initialProject.category || '',
          tags,
          isPublic: true,
          media: mediaItems,
          members: memberEntries
        }));
        setLoading(false);
        return;
      }
      loadProjectData();
    }
  }, [editMode, editProjectId, initialProject]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', editProjectId)
        .single();

      if (error) throw error;

      if (project) {
        const tags = Array.isArray(project.tags)
          ? project.tags
          : typeof project.tags === 'string'
            ? project.tags.split(',').map((t: string) => t.trim())
            : [];

        let mediaItems: MediaItem[] = [];
        try {
          const { data: filesData } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', editProjectId)
            .order('created_at', { ascending: true });

          mediaItems = (filesData || []).map((file, index) => ({
            id: file.id || generateUUID(),
            type: file.file_type === 'image'
              ? 'image'
              : file.file_type === 'video'
                ? 'video'
                : 'file',
            name: file.file_name || undefined,
            url: file.file_url,
            path: file.file_path,
            size: file.file_size || undefined,
            mimeType: file.mime_type || undefined,
            fileType: file.file_type || undefined,
            source: file.file_path?.startsWith('projects/') ? 'storage' : 'external',
            isCover: !!file.is_cover,
            order: index
          }));
        } catch (filesError) {
          console.error('Error loading project files:', filesError);
        }

        let memberEntries: Member[] = [];
        try {
          const { data: memberLinks } = await supabase
            .from('project_collaborators')
            .select('user_id, role')
            .eq('project_id', editProjectId);

          if (memberLinks?.length) {
            const memberIds = memberLinks.map(link => link.user_id);
            const { data: memberProfiles } = await supabase
              .from('profiles')
              .select('id, name, email')
              .in('id', memberIds);

            memberEntries = (memberProfiles || []).map(profile => {
              const link = memberLinks.find(l => l.user_id === profile.id);
              return {
                id: profile.id,
                name: profile.name || profile.email || 'Member',
                email: profile.email || '',
                role: link?.role || 'viewer'
              };
            });
          }
        } catch (memberError) {
          console.error('Error loading members:', memberError);
        }

        setProjectData(prev => ({
          ...prev,
          title: project.title || '',
          shortDescription: project.description || '',
          fullDescription: project.long_description || '',
          category: project.category || '',
          tags,
          price: project.price || 0,
          isPublic: project.status === 'published',
          media: mediaItems,
          members: memberEntries
        }));

        if (!CATEGORIES.includes(project.category) && project.category) {
          setProjectData(prev => ({ ...prev, category: 'Other' }));
          setCustomCategory(project.category);
        }
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      // Fallback to initialProject in mock mode if available
      if (initialProject) {
        const tags = Array.isArray(initialProject.tags)
          ? initialProject.tags
          : initialProject.tags
            ? String(initialProject.tags).split(',').map((t: string) => t.trim())
            : [];
        const mediaItems: MediaItem[] = [];
        if (initialProject.thumbnail) {
          mediaItems.push({
            id: generateUUID(),
            type: 'image',
            name: 'Cover',
            url: initialProject.thumbnail,
            path: `external:${initialProject.thumbnail}`,
            fileType: 'image',
            source: 'external',
            isCover: true,
            order: 0
          });
        }
        const memberEntries: Member[] = Array.isArray(initialProject.members)
          ? initialProject.members.map((m: any) => ({
              id: m.id,
              name: m.name,
              email: m.email || '',
              role: m.role || 'editor'
            }))
          : [];
        setProjectData(prev => ({
          ...prev,
          title: initialProject.title || '',
          shortDescription: initialProject.description || '',
          fullDescription: initialProject.longDescription || '',
          category: initialProject.category || '',
          tags,
          isPublic: true,
          media: mediaItems,
          members: memberEntries
        }));
      } else {
        alert('Failed to load project data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addMediaItems = (items: MediaItem[]) => {
    setProjectData(prev => {
      const next = [...prev.media, ...items];
      if (!next.some(m => m.isCover)) {
        const firstImg = next.find(m => m.type === 'image');
        if (firstImg) firstImg.isCover = true;
      }
      return { ...prev, media: next.map((m, i) => ({ ...m, order: i })) };
    });
  };

  const setAsCover = (id: string) => {
    setProjectData(prev => {
      const cover = prev.media.find(m => m.id === id && m.type === 'image') || null;
      const media = prev.media.map(m => ({ ...m, isCover: m.id === id }));
      return { ...prev, coverImage: cover || prev.coverImage || null, media };
    });
  };

  const removeMedia = async (id: string) => {
    const target = projectData.media.find(m => m.id === id);
    if (target?.path && target.path.startsWith('projects/')) {
      try {
        await deleteProjectFile(target.path);
      } catch (error) {
        console.error('Failed to delete file from storage', error);
      }
    }

    setProjectData(prev => {
      const filtered = prev.media.filter(m => m.id !== id);
      filtered.forEach((m, i) => (m.order = i));
      if (!filtered.some(m => m.isCover) && filtered.some(m => m.type === 'image')) {
        const firstImg = filtered.find(m => m.type === 'image');
        if (firstImg) firstImg.isCover = true;
      }
      return { ...prev, media: filtered };
    });
  };

  const moveMedia = (from: number, to: number) => {
    setProjectData(prev => {
      const arr = [...prev.media];
      const item = arr.splice(from, 1)[0];
      arr.splice(to, 0, item);
      return { ...prev, media: arr.map((m, i) => ({ ...m, order: i })) };
    });
  };

  const handleUpload = async (files: FileList | null, kind: 'image' | 'file') => {
    if (!files?.length) return [] as MediaItem[];

    // 1) Immediately add placeholder entries with status 'uploading' so UI shows progress
    const placeholderItems: MediaItem[] = Array.from(files).map((file, idx) => ({
      id: generateUUID(),
      type: kind === 'image' ? 'image' : 'file',
      name: file.name,
      url: demoMode ? URL.createObjectURL(file) : '/placeholder-project.svg',
      path: null,
      order: projectData.media.length + idx,
      size: file.size,
      mimeType: file.type,
      fileType: kind === 'image' ? 'image' : 'document',
      source: demoMode ? 'local' : 'storage',
      status: 'uploading',
    }));
    addMediaItems(placeholderItems);

    // 2) Perform actual upload (or finalize demo object URLs), then update status and URLs
    const uploadedItems: MediaItem[] = [];
    for (let i = 0; i < placeholderItems.length; i++) {
      const file = Array.from(files)[i];
      const placeholder = placeholderItems[i];
      try {
        if (demoMode) {
          // Already have an object URL; mark as uploaded
          uploadedItems.push({ ...placeholder, status: 'uploaded' });
        } else {
          const uploadResult = await uploadProjectFile({
            projectId: projectFolderId,
            fileType: kind === 'image' ? 'image' : 'document',
            file,
          });
          uploadedItems.push({
            ...placeholder,
            url: uploadResult.fileUrl,
            path: uploadResult.filePath,
            mimeType: uploadResult.mimeType,
            source: 'storage',
            status: 'uploaded',
          });
        }
      } catch (err) {
        console.error('Upload failed', err);
        uploadedItems.push({ ...placeholder, status: 'error' });
      }
    }

    // 3) Replace placeholders with uploaded items by id
    setProjectData(prev => ({
      ...prev,
      media: prev.media.map(m => {
        const updated = uploadedItems.find(u => u.id === m.id);
        return updated ? updated : m;
      }).map((m, i) => ({ ...m, order: i }))
    }));

    return uploadedItems;
  };

  const toEmbedURL = (raw: string) => {
    try {
      const u = new URL(raw);
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (u.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
      } else if (u.hostname.includes('vimeo.com')) {
        const id = u.pathname.split('/').filter(Boolean).pop();
        if (id) return `https://player.vimeo.com/video/${id}`;
      }
    } catch {}
    return raw;
  };

  const addVideoByUrl = () => {
    const embed = toEmbedURL(videoInput.trim());
    if (!embed) return;
    addMediaItems([{
      id: generateUUID(),
      type: 'video',
      url: embed,
      name: 'Video',
      order: projectData.media.length,
      fileType: 'video',
      source: 'external',
      path: `external:${embed}`
    }]);
    setVideoInput('');
  };

  const addExternalFile = () => {
    const label = externalFileName.trim();
    const link = externalFileUrl.trim();
    if (!label || !link) {
      alert('Please provide a name and a valid URL for the file');
      return;
    }

    try {
      const validated = new URL(link);
      addMediaItems([{
        id: generateUUID(),
        type: 'file',
        name: label,
        url: validated.toString(),
        path: `external:${validated.toString()}`,
        fileType: 'document',
        source: 'external',
        order: projectData.media.length
      }]);
      setExternalFileName('');
      setExternalFileUrl('');
    } catch {
      alert('Please enter a valid URL');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !projectData.tags.includes(newTag.trim())) {
      setProjectData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProjectData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addMember = async () => {
    if (!newMember.trim()) return;

    try {
      // Search for user by email or username
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .or(`email.eq.${newMember.trim()},name.ilike.%${newMember.trim()}%`);

      if (error) throw error;

      if (users && users.length > 0) {
        const user = users[0];
        if (!projectData.members.some(member => member.id === user.id)) {
          setProjectData(prev => ({
            ...prev,
            members: [
              ...prev.members,
              {
                id: user.id,
                name: user.name || user.email || 'Member',
                email: user.email || '',
                role: 'editor'
              }
            ]
          }));
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
    setProjectData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('You must be logged in to create a project');
      return;
    }

    setIsUploading(true);

    try {
      const finalCategoryRaw = projectData.category === 'Other' ? customCategory : projectData.category;
      const finalCategory = finalCategoryRaw?.trim();
      if (!finalCategory) {
        alert('Please select a category for your project.');
        setIsUploading(false);
        return;
      }
      const targetProjectId = editProjectId || projectFolderId;

      const cover = projectData.coverImage || projectData.media.find(m => m.isCover && m.type === 'image') || null;

      const projectRecord = {
        title: projectData.title,
        description: projectData.shortDescription,
        long_description: projectData.fullDescription,
        category: finalCategory,
        owner_id: currentUser.id,
        tags: projectData.tags,
        status: projectData.isPublic ? 'published' : 'draft',
        price: projectData.price || 0,
        cover_image: cover?.url || null,
      };

      // Demo mode: save to sessionStorage and skip Supabase
      if (demoMode) {
        const key = 'demoProjects';
        const raw = sessionStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((p: any) => p.id !== targetProjectId);
        const toSave = [...filtered, projectRecord];
        sessionStorage.setItem(key, JSON.stringify(toSave));
        alert(editMode ? 'Project updated (demo)!' : 'Project created (demo)!');
        onProjectUpdated?.();
        onProjectCreated?.();
        window.location.href = '/?demo=1';
        return;
      }

      if (editMode && editProjectId) {
        const { error: projectError } = await supabase
          .from('projects')
          .update(projectRecord)
          .eq('id', editProjectId);
        if (projectError) throw projectError;
      } else {
        const { error: projectError } = await supabase
          .from('projects')
          .insert([{ ...projectRecord, id: targetProjectId }])
          .single();
        if (projectError) throw projectError;
        // Note: Skipping initial insert into project_collaborators due to RLS; relies on owner_id on projects.
      }

      const filesPayload = projectData.media.map(m => ({
        id: m.id || generateUUID(),
        project_id: targetProjectId,
        file_name: m.name || `${m.type}-${m.order + 1}`,
        file_url: m.url,
        file_path: m.path || `external:${m.url}`,
        file_type: m.fileType || (m.type === 'image' ? 'image' : m.type === 'video' ? 'video' : 'document'),
        file_size: m.size || null,
        mime_type: m.mimeType || null,
        is_cover: projectData.coverImage ? (m.id === projectData.coverImage.id) : !!m.isCover
      }));

      if (editMode) {
        await supabase.from('project_files').delete().eq('project_id', targetProjectId);
      }

      if (filesPayload.length) {
        const { error: filesError } = await supabase.from('project_files').insert(filesPayload);
        if (filesError) throw filesError;
      }

      // Skip members on create. When editing, we also skip modifying members here to avoid RLS issues.
      // Members can be managed later in a dedicated Edit screen.
      /* if (editMode) {
        await supabase.from('project_collaborators').delete().eq('project_id', targetProjectId);
      } */

      /* if (projectData.members.length) {
        const memberRows = projectData.members.map(member => ({
          project_id: targetProjectId,
          user_id: member.id,
          role: member.role || 'editor',
          invited_by: currentUser.id
        }));

        // Try upsert; if blocked by RLS, silently skip (owner can manage members via dedicated UI later)
        const { error: memberErr } = await supabase
          .from('project_collaborators')
          .upsert(memberRows, { onConflict: 'project_id,user_id' });
        // Intentionally ignore RLS or other errors here. Members can be added later in Edit.
      } */

      alert(editMode ? 'Project updated!' : 'Project created!');
      onProjectUpdated?.();
      onProjectCreated?.();
      window.location.href = '/';
    } catch (e:any) {
      console.error(e);
      alert(e.message || 'Failed to save project');
      // Cleanup: if project creation failed, remove any uploaded storage files for this draft
      try {
        if (!editMode && !demoMode) {
          const toDelete = projectData.media.filter(m => m.source === 'storage' && typeof m.path === 'string' && m.path.startsWith('projects/'));
          for (const m of toDelete) {
            try { await deleteProjectFile(m.path as string); } catch {}
          }
        }
      } catch {}
    } finally {
      setIsUploading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Project Title *</label>
              <Input
                placeholder="Enter your project title"
                value={projectData.title}
                onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description *</label>
              <Input
                placeholder="A brief description of your project (max 100 characters)"
                value={projectData.shortDescription}
                onChange={(e) => setProjectData(prev => ({ ...prev, shortDescription: e.target.value }))}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {projectData.shortDescription.length}/100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                style={{ 
                  backgroundColor: '#d1d5db !important', 
                  color: '#374151 !important',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
                value={projectData.category}
                onChange={(e) => {
                  setProjectData(prev => ({ ...prev, category: e.target.value }));
                  if (e.target.value !== 'Other') {
                    setCustomCategory('');
                  }
                }}
              >
                <option value="" style={{ backgroundColor: '#d1d5db', color: '#9ca3af' }}>Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category} style={{ backgroundColor: '#d1d5db', color: '#374151' }}>{category}</option>
                ))}
              </select>
              
              {projectData.category === 'Other' && (
                <div className="mt-2">
                  <Input
                    placeholder="Please specify your category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg"
                    style={{ 
                      backgroundColor: '#d1d5db !important', 
                      color: '#374151 !important',
                      padding: '12px'
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Description</label>
              <Textarea
                placeholder=""
                value={projectData.fullDescription}
                onChange={(e) => setProjectData(prev => ({ ...prev, fullDescription: e.target.value }))}
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {projectData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Cover selection is now part of gallery items below (use the checkbox on an image). */}

            {/* Gallery images uploader */}
            <label className="block text-sm font-medium mb-2">Gallery Images</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <input
                id="img-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const input = e.currentTarget;
                  const files = e.target.files;
                  (async () => {
                    await handleUpload(files, 'image');
                    input.value = '';
                  })();
                }}
              />
              <Button asChild variant="outline"><label htmlFor="img-upload">Upload Images</label></Button>
            </div>

            {/* Video link */}
            <label className="block text-sm font-medium mb-2">Add Video (YouTube/Vimeo)</label>
            <div className="flex gap-2 mb-6">
              <Input placeholder="Paste video URL" value={videoInput} onChange={e=>setVideoInput(e.target.value)} />
              <Button onClick={addVideoByUrl}><Plus className="w-4 h-4"/></Button>
            </div>

            {/* Files */}
            <label className="block text-sm font-medium mb-2">Project Files</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const input = e.currentTarget;
                  const files = e.target.files;
                  (async () => {
                    await handleUpload(files, 'file');
                    input.value = '';
                  })();
                }}
              />
              <Button asChild variant="outline"><label htmlFor="file-upload">Upload Files</label></Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Attach File via URL</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Display name"
                  value={externalFileName}
                  onChange={(e) => setExternalFileName(e.target.value)}
                />
                <Input
                  placeholder="https://example.com/your-file"
                  value={externalFileUrl}
                  onChange={(e) => setExternalFileUrl(e.target.value)}
                />
                <Button type="button" onClick={addExternalFile}>
                  Attach
                </Button>
              </div>
            </div>

            {/* Sortable gallery */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[...projectData.media]
                .sort((a,b)=>a.order-b.order)
                .map((m, idx) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', String(idx)); }}
                  onDragOver={(e)=>e.preventDefault()}
                  onDrop={(e)=>{ const from = Number(e.dataTransfer.getData('text/plain')); moveMedia(from, idx); }}
                  className="p-3 rounded-lg border bg-white flex gap-3 items-start"
                >
                  <div className="w-24 h-16 shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center relative">
                    {m.type === 'image' ? (
                      <img 
                        src={m.url || '/placeholder-project.svg'} 
                        className="w-full h-full object-cover" 
                        alt={m.name || 'Media item'}
                      />
                    ) : m.type === 'video' ? (
                      <span className="text-xs">Video</span>
                    ) : (
                      <span className="text-xs">File</span>
                    )}
                    {m.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {m.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center text-white text-xs">
                        Failed
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">{m.type}</Badge>
                      {m.isCover && <Badge>Cover</Badge>}
                      {m.status && <Badge variant="outline">{m.status}</Badge>}
                    </div>
                    <div className="text-xs text-gray-600 truncate">{m.name || m.url}</div>
                    <div className="flex gap-2 mt-2">
                      {m.type === 'image' && (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={!!m.isCover}
                            onChange={(e)=>{ if(e.target.checked) setAsCover(m.id); }}
                          />
                          Cover
                        </label>
                      )}
                      <Button size="sm" variant="outline" onClick={()=>removeMedia(m.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Visibility</label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    checked={projectData.isPublic}
                    onChange={() => setProjectData(prev => ({ ...prev, isPublic: true }))}
                  />
                  <label htmlFor="public">Public - Anyone can view and download</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    checked={!projectData.isPublic}
                    onChange={() => setProjectData(prev => ({ ...prev, isPublic: false }))}
                  />
                  <label htmlFor="private">Private - Only you can view</label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Members</label>
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Enter email or username to add member"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMember()}
                  />
                  <Button onClick={addMember} size="sm" className="sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Add Member
                  </Button>
                </div>

                {projectData.members.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Current Members:</p>
                    <div className="space-y-2">
                      {projectData.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="text-sm">
                            <span className="font-medium">{member.name}</span>
                            {member.email && (
                              <span className="text-xs text-gray-500 block">{member.email}</span>
                            )}
                            <span className="text-xs text-gray-500 ml-2 capitalize">({member.role || 'editor'})</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Project Guidelines</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure your project is original work or properly attributed</li>
                <li>• Include clear documentation and setup instructions</li>
                <li>• Use appropriate tags to help others discover your project</li>
                <li>• Consider adding a demo or live link if applicable</li>
                {projectData.members.length > 0 && (
                  <li>• Members with edit roles will have edit access to this project</li>
                )}
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Project Preview</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{projectData.title || 'Untitled Project'}</h4>
                  <p className="text-sm text-gray-600">{projectData.shortDescription}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{projectData.category}</Badge>
                  {projectData.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-medium">Description:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {projectData.fullDescription || 'No description provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Visibility: </span>
                    {projectData.isPublic ? 'Public' : 'Private'}
                  </div>
                  {(() => {
                    const cover = projectData.coverImage || projectData.media.find(m => m.isCover && m.type==='image');
                    return (
                      <div>
                        <span className="font-medium">Cover: </span>
                        {cover ? <span className="text-green-700">Set</span> : <span className="text-red-600">Not set</span>}
                      </div>
                    );
                  })()}
                  <div>
                    <span className="font-medium">Media items: </span>
                    {projectData.media.length} item(s)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Ready to Publish</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your project is ready to be published. Click "Publish Project" to make it live.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return projectData.title && projectData.shortDescription && projectData.category;
      case 2: {
        // Allow proceeding even without media in Step 2 to unblock uploads; we'll warn at publish time if needed
        return true;
      }
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Show loading state when fetching project data in edit mode
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
            {editMode ? 'Edit Your Project' : 'Upload Your Project'}
          </h1>
          <p className="text-gray-600">
            {editMode ? 'Update your project details and files' : 'Share your amazing work with the community'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                      isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                      'border-gray-300 bg-white text-gray-400'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      Step {step.id}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "w-5 h-5" })}
              {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              try {
                return renderStepContent();
              } catch (err) {
                console.error('Step render error:', err);
                return (
                  <div className="p-4 text-red-600">
                    Something went wrong loading this step. Please try again or reload.
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {editMode ? 'Update Project' : 'Publish Project'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}