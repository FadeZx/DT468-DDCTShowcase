import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea-simple';
import { Badge } from '../ui/badge-simple';
import { Progress } from '../ui/progress-simple';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
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

interface ProjectData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  tags: string[];
  coverImage: File | null;
  screenshots: File[];
  projectFiles: File[];
  price: number;
  isPublic: boolean;
  collaborators: string[];
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
  `https://${projectId}.supabase.co`,
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
    coverImage: null,
    screenshots: [],
    projectFiles: [],
    price: 0,
    isPublic: true,
    collaborators: []
  });

  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState('');

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

  const handleFileUpload = (files: FileList | null, type: 'cover' | 'screenshots' | 'project') => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    switch (type) {
      case 'cover':
        setProjectData(prev => ({ ...prev, coverImage: fileArray[0] }));
        break;
      case 'screenshots':
        setProjectData(prev => ({ 
          ...prev, 
          screenshots: [...prev.screenshots, ...fileArray] 
        }));
        break;
      case 'project':
        setProjectData(prev => ({ 
          ...prev, 
          projectFiles: [...prev.projectFiles, ...fileArray] 
        }));
        break;
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
      
      // Generate or use existing project ID for folder structure
      const projectFolderId = editProjectId || generateFileId();
      
      // Upload files to Supabase Storage with organized structure
      let coverImageUrl = null;
      let uploadedFiles: any[] = [];

      if (projectData.coverImage) {
        const fileId = generateFileId();
        const fileExt = projectData.coverImage.name.split('.').pop();
        const coverPath = `projects/${projectFolderId}/images/originals/${fileId}.${fileExt}`;
        const result = await uploadFileToSupabase(projectData.coverImage, coverPath);
        coverImageUrl = result.url;
        
        // Save file metadata
        uploadedFiles.push({
          project_id: projectFolderId,
          file_name: projectData.coverImage.name,
          file_url: result.url,
          file_path: result.path,
          file_type: 'image',
          file_size: projectData.coverImage.size,
          is_cover: true
        });
      }

      // Upload screenshots
      for (const screenshot of projectData.screenshots) {
        const fileId = generateFileId();
        const fileExt = screenshot.name.split('.').pop();
        const screenshotPath = `projects/${projectFolderId}/images/originals/${fileId}.${fileExt}`;
        const result = await uploadFileToSupabase(screenshot, screenshotPath);
        
        uploadedFiles.push({
          project_id: projectFolderId,
          file_name: screenshot.name,
          file_url: result.url,
          file_path: result.path,
          file_type: 'image',
          file_size: screenshot.size,
          is_cover: false
        });
      }

      // Upload project files
      for (const file of projectData.projectFiles) {
        const fileId = generateFileId();
        const fileExt = file.name.split('.').pop();
        const filePath = `projects/${projectFolderId}/docs/${fileId}.${fileExt}`;
        const result = await uploadFileToSupabase(file, filePath);
        
        uploadedFiles.push({
          project_id: projectFolderId,
          file_name: file.name,
          file_url: result.url,
          file_path: result.path,
          file_type: 'document',
          file_size: file.size,
          is_cover: false
        });
      }

      // Create project record in database
      const projectRecord = {
        ...(editMode ? {} : { id: projectFolderId }), // Only set ID for new projects
        title: projectData.title,
        description: projectData.shortDescription,
        long_description: projectData.fullDescription,
        category: finalCategory,
        cover_image: coverImageUrl,
        author_id: currentUser.id,
        tags: projectData.tags,
        status: projectData.isPublic ? 'published' : 'draft',
        views: 0,
        downloads: 0,
        likes: 0,
        price: 0
      };

      if (editMode && editProjectId) {
        // Update existing project
        const { error: projectError } = await supabase
          .from('projects')
          .update(projectRecord)
          .eq('id', editProjectId);

        if (projectError) throw projectError;
        
        // Update project files if any new files were uploaded
        if (uploadedFiles.length > 0) {
          try {
            const { error: filesError } = await supabase
              .from('project_files')
              .upsert(uploadedFiles);
            
            if (filesError) {
              console.error('Error updating project files:', filesError);
              // Don't throw error for files, just log it
            }
          } catch (fileError) {
            console.error('Error with project files table:', fileError);
            // Continue without files if table doesn't exist
          }
        }
        
        alert('Project updated successfully!');
        if (onProjectUpdated) onProjectUpdated();
        
        // Navigate to home page
        window.location.href = '/';
      } else {
        // Create new project
        const { data, error: projectError } = await supabase
          .from('projects')
          .insert([projectRecord])
          .select()
          .single();

        if (projectError) throw projectError;
        
        // Insert project files
        if (uploadedFiles.length > 0) {
          try {
            const { error: filesError } = await supabase
              .from('project_files')
              .insert(uploadedFiles);
            
            if (filesError) {
              console.error('Error inserting project files:', filesError);
              // Don't throw error for files, just log it
            }
          } catch (fileError) {
            console.error('Error with project files table:', fileError);
            // Continue without files if table doesn't exist
          }
        }
        
        alert('Project created successfully!');
        if (onProjectCreated) onProjectCreated();
        
        // Navigate to home page
        window.location.href = '/';
      }
      
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(error.message || 'Failed to save project. Please try again.');
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
            <div>
              <label className="block text-sm font-medium mb-2">Cover Image *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {projectData.coverImage ? (
                  <div className="space-y-2">
                    <Image className="w-8 h-8 mx-auto text-green-500" />
                    <p className="text-sm text-green-600">{projectData.coverImage.name}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setProjectData(prev => ({ ...prev, coverImage: null }))}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">Upload a cover image for your project</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files, 'cover')}
                      className="hidden"
                      id="cover-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="cover-upload" className="cursor-pointer">
                        Choose Image
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Files *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">Upload your project files (ZIP, source code, etc.)</p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files, 'project')}
                    className="hidden"
                    id="project-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="project-upload" className="cursor-pointer">
                      Upload Files
                    </label>
                  </Button>
                </div>
              </div>
              {projectData.projectFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Uploaded Files:</p>
                  <div className="space-y-2">
                    {projectData.projectFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm flex-1">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <div>
                    <span className="font-medium">Cover Image: </span>
                    {projectData.coverImage ? 'Uploaded' : 'Not uploaded'}
                  </div>
                  <div>
                    <span className="font-medium">Project Files: </span>
                    {projectData.projectFiles.length} file(s)
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
      case 2:
        return projectData.coverImage && projectData.projectFiles.length > 0;
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