import supabase from './supabase/client';
// IMPORTANT: Reuse the app's singleton Supabase client to avoid multiple GoTrueClient instances

export interface FileUploadOptions {
  projectId: string;
  fileType: 'image' | 'document' | 'project' | 'thumbnail' | 'export';
  file: File;
  generateThumbnail?: boolean;
}

export interface FileUploadResult {
  fileId: string;
  filePath: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  thumbnailUrl?: string;
}

export function generateFilePath(
  projectId: string,
  fileType: string,
  fileId: string,
  extension: string
): string {
  switch (fileType) {
    case 'image':
      return `projects/${projectId}/images/originals/${fileId}.${extension}`;
    case 'thumbnail':
      return `projects/${projectId}/images/thumbs/${fileId}_320.${extension}`;
    case 'document':
    case 'project':
      return `projects/${projectId}/docs/${fileId}.${extension}`;
    case 'export':
      return `projects/${projectId}/exports/${Date.now()}-${fileType}.pdf`;
    default:
      return `projects/${projectId}/tmp/${fileId}.${extension}`;
  }
}

export function generateFileId(): string {
  return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
}

export async function uploadProjectFile({
  projectId,
  fileType,
  file,
  generateThumbnail = false
}: FileUploadOptions): Promise<FileUploadResult> {
  try {
    const fileId = generateFileId();
    const extension = file.name.split('.').pop() || '';
    const filePath = generateFilePath(projectId, fileType, fileId, extension);

    // Upload original file
    const bucket = 'project-files';
    // Ensure bucket exists (if not, the upload will fail with 400). Consider creating it in Supabase dashboard.
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const result: FileUploadResult = {
      fileId,
      filePath,
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType,
      mimeType: file.type
    };

    // Generate thumbnail for images if requested
    if (generateThumbnail && fileType === 'image' && file.type.startsWith('image/')) {
      try {
        const thumbnailFile = await createThumbnail(file, 320);
        const thumbnailPath = generateFilePath(projectId, 'thumbnail', fileId, extension);
        
        const { error: thumbError } = await supabase.storage
          .from(bucket)
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(thumbnailPath);
          
          result.thumbnailUrl = thumbUrlData.publicUrl;
        }
      } catch (thumbError) {
        console.warn('Failed to generate thumbnail:', thumbError);
      }
    }

    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

async function createThumbnail(file: File, maxWidth: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw resized image
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(thumbnailFile);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      }, file.type, 0.8);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function deleteProjectFile(filePath: string) {
  try {
    const bucket = 'project-files';
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export function getFileUrl(filePath: string): string {
  const bucket = 'project-files';
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}