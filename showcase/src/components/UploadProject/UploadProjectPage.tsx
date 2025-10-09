import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea-simple';
import { Badge } from '../ui/badge-simple';
import { Progress } from '../ui/progress-simple';
import { createClient } from '@supabase/supabase-js';
import { projectId as SUPABASE_PROJECT_ID, publicAnonKey } from '../../utils/supabase/info';
import { 
  Upload, 
  FileText, 
  Image, 
  Settings, 
  Eye, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';

interface UploadProjectPageProps {
  currentUser?: any;
  projectId?: string;
  onProjectCreated?: () => void;
  onProjectUpdated?: () => void;
}

type MediaType = 'image' | 'video' | 'file';

interface MediaItem {
  id: string;          // local uid
  type: MediaType;
  name?: string;       // original filename or label
  url: string;         // public URL (images/files) or embed URL (video)
  path?: string;       // storage path for uploads (images/files)
  isCover?: boolean;
  order: number;       // for sorting
  size?: number;       // file size (optional)
}

interface ProjectData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  tags: string[];
  price: number;
  isPublic: boolean;
  collaborators: string[];
  /** replace coverImage, screenshots, projectFiles with: */
  media: MediaItem[];
}

const STEPS = [
  { id: 1, title: 'Project Details', icon: FileText },
  { id: 2, title: 'Media & Files', icon: Upload },
  { id: 3, title: 'Customization', icon: Settings },
  { id: 4, title: 'Preview & Publish', icon: Eye }
];

const CATEGORIES = [
  'Game',
  'Animation', 
  'Art',
  'Other'
];

// Initialize Supabase client
const supabase = createClient(
  `https://${SUPABASE_PROJECT_ID}.supabase.co`,
  publicAnonKey
);

export default function UploadProjectPage({ 
  currentUser, 
  projectId: editProjectId, 
  onProjectCreated, 
  onProjectUpdated 
}: UploadProjectPageProps = {}) {
  const editMode = !!editProjectId;
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    tags: [],
    price: 0,
    isPublic: true,
    collaborators: [],
    media: []
  });

  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState('');
  const [videoInput, setVideoInput] = useState('');

  const progress = (currentStep / STEPS.length) * 100;

  // Load existing project data in edit mode
  useEffect(() => {
    if (editMode && editProjectId) {
      loadProjectData();
    }
  }, [editMode, editProjectId]);

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
        // Prefill form with existing project data
        setProjectData(prev => ({
          ...prev,
          title: project.title || '',
          shortDescription: project.description || '',
          fullDescription: project.long_description || '',
          category: project.category || '',
          tags: Array.isArray(project.tags) ? project.tags : 
                typeof project.tags === 'string' ? project.tags.split(',').map((t: string) => t.trim()) : [],
          price: project.price || 0,
          isPublic: project.status === 'published'
        }));

        // Set custom category if it's "Other"
        if (!CATEGORIES.includes(project.category) && project.category) {
          setProjectData(prev => ({ ...prev, category: 'Other' }));
          setCustomCategory(project.category);
        }
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      alert('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const newUID = () =>
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

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
    setProjectData(prev => ({
      ...prev,
      media: prev.media.map(m => ({ ...m, isCover: m.id === id }))
    }));
  };

  const removeMedia = (id: string) => {
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

  const handleUpload = async (files: FileList | null, kind: 'image' | 'file', projectFolderId: string) => {
    if (!files?.length) return [];
    const results: MediaItem[] = [];
    for (const file of Array.from(files)) {
      const fileId = newUID();
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const subdir = kind === 'image' ? 'images/originals' : 'docs';
      const path = `projects/${projectFolderId}/${subdir}/${fileId}.${ext}`;
      const { path: saved, url } = await uploadFileToSupabase(file, path);
      results.push({
        id: newUID(),
        type: kind,
        name: file.name,
        url,
        path: saved,
        size: file.size,
        isCover: false,
        order: projectData.media.length + results.length
      });
    }
    return results;
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
      id: newUID(),
      type: 'video',
      url: embed,
      name: 'Video',
      order: projectData.media.length
    }]);
    setVideoInput('');
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

  const addCollaborator = async () => {
    if (!newCollaborator.trim()) return;
    
    try {
      // Search for user by email or username
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .or(`email.eq.${newCollaborator.trim()},name.ilike.%${newCollaborator.trim()}%`);

      if (error) throw error;

      if (users && users.length > 0) {
        const user = users[0];
        if (!projectData.collaborators.includes(user.email)) {
          setProjectData(prev => ({
            ...prev,
            collaborators: [...prev.collaborators, user.email]
          }));
          setNewCollaborator('');
        } else {
          alert('User is already a collaborator');
        }
      } else {
        alert('User not found');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      alert('Error searching for user');
    }
  };

  const removeCollaborator = (collaboratorToRemove: string) => {
    setProjectData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(collab => collab !== collaboratorToRemove)
    }));
  };

  const uploadFileToSupabase = async (file: File, path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .upload(path, file);

      if (error) throw error;
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(data.path);
      
      return { path: data.path, url: publicUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const generateFileId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('You must be logged in to create a project');
      return;
    }

    setIsUploading(true);

    try {
      const finalCategory = projectData.category === 'Other' ? customCategory : projectData.category;
      const projectFolderId = editProjectId || newUID();

      const cover = projectData.media.find(m => m.isCover && m.type === 'image')
              || projectData.media.find(m => m.type === 'image');

      const projectRecord = {
        ...(editMode ? {} : { id: projectFolderId }),
        title: projectData.title,
        description: projectData.shortDescription,
        long_description: projectData.fullDescription,
        category: finalCategory,

        author_id: currentUser.id,
        tags: projectData.tags,
        status: projectData.isPublic ? 'published' : 'draft',
        views: 0, downloads: 0, likes: 0,
        price: projectData.price || 0
      };

      if (editMode && editProjectId) {
        const { error: projectError } = await supabase
          .from('projects')
          .update(projectRecord)
          .eq('id', editProjectId);
        if (projectError) throw projectError;
      } else {
        const { error: projectError } = await supabase
          .from('projects')
          .insert([projectRecord])
          .single();
        if (projectError) throw projectError;
      }

      if (projectData.media.length) {
        const payload = projectData.media.map(m => ({
          id: (crypto as any).randomUUID?.() || newUID(),
          project_id: editProjectId || projectFolderId,
          type: m.type,
          url: m.url,
          path: m.path || null,
          name: m.name || null,
          is_cover: !!m.isCover,
          order: m.order,
          size: m.size || null
        }));
        const { error: mediaErr } = await supabase.from('project_media').upsert(payload, { onConflict: 'id' });
        if (mediaErr) console.error('media upsert error', mediaErr);
      }

      alert(editMode ? 'Project updated!' : 'Project created!');
      onProjectUpdated?.();
      onProjectCreated?.();
      window.location.href = '/';
    } catch (e:any) {
      console.error(e);
      alert(e.message || 'Failed to save project');
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
            {/* Images uploader */}
            <label className="block text-sm font-medium mb-2">Images</label>
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
                  const folder = editProjectId || newUID();
                  (async () => {
                    const items = await handleUpload(files, 'image', folder);
                    addMediaItems(items);
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
                  const folder = editProjectId || newUID();
                  (async () => {
                    const items = await handleUpload(files, 'file', folder);
                    addMediaItems(items);
                    input.value = '';
                  })();
                }}
              />
              <Button asChild variant="outline"><label htmlFor="file-upload">Upload Files</label></Button>
            </div>

            {/* Sortable gallery */}
            <div className="grid sm:grid-cols-2 gap-4">
              {projectData.media
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
                  <div className="w-24 h-16 shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    {m.type === 'image' ? (
                      <img src={m.url} className="w-full h-full object-cover" />
                    ) : m.type === 'video' ? (
                      <span className="text-xs">Video</span>
                    ) : (
                      <span className="text-xs">File</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">{m.type}</Badge>
                      {m.isCover && <Badge>Cover</Badge>}
                    </div>
                    <div className="text-xs text-gray-600 truncate">{m.name || m.url}</div>
                    <div className="flex gap-2 mt-2">
                      {m.type !== 'file' && (
                        <Button size="sm" variant="outline" onClick={()=>setAsCover(m.id)}>
                          Set as cover
                        </Button>
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

            {editMode && (
              <div>
                <label className="block text-sm font-medium mb-2">Collaborators</label>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email or username to invite collaborator"
                      value={newCollaborator}
                      onChange={(e) => setNewCollaborator(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCollaborator()}
                    />
                    <Button onClick={addCollaborator} size="sm">
                      <Plus className="w-4 h-4" />
                      Invite
                    </Button>
                  </div>
                  
                  {projectData.collaborators.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Current Collaborators:</p>
                      <div className="space-y-2">
                        {projectData.collaborators.map(collaborator => (
                          <div key={collaborator} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{collaborator}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeCollaborator(collaborator)}
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
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Project Guidelines</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure your project is original work or properly attributed</li>
                <li>• Include clear documentation and setup instructions</li>
                <li>• Use appropriate tags to help others discover your project</li>
                <li>• Consider adding a demo or live link if applicable</li>
                {editMode && <li>• Collaborators will have edit access to this project</li>}
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
                    const cover = projectData.media.find(m => m.isCover && m.type==='image')
                               || projectData.media.find(m => m.type==='image');
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
        const hasImage = projectData.media.some(m => m.type === 'image');
        const hasPlayableOrFile = projectData.media.some(m => m.type === 'file' || m.type === 'video');
        return hasImage && hasPlayableOrFile;
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
            {renderStepContent()}
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