import JSZip from 'jszip';
import supabase from './supabase/client';
// IMPORTANT: Reuse the app's singleton Supabase client to avoid multiple GoTrueClient instances

export interface FileUploadOptions {
  projectId: string;
  fileType: 'image' | 'video' | 'document' | 'project' | 'thumbnail' | 'export';
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
    case 'video':
      return `projects/${projectId}/videos/${fileId}.${extension}`;
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

const WEBGL_MIME_MAP: Record<string, string> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.unityweb': 'application/octet-stream',
  '.mem': 'application/octet-stream',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.manifest': 'application/json'
};

function inferMimeTypeFromName(name: string): string {
  const lower = name.toLowerCase();
  const lastDot = lower.lastIndexOf('.');
  const ext = lastDot >= 0 ? lower.slice(lastDot) : '';
  if (ext && WEBGL_MIME_MAP[ext]) return WEBGL_MIME_MAP[ext];
  if (lower.endsWith('/')) return 'application/octet-stream';
  return 'application/octet-stream';
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

function normalizeZipPath(path: string, rootPrefix: string) {
  const normalized = path.replace(/\\/g, '/');
  const normalizedRoot = rootPrefix.replace(/\\/g, '/');
  if (normalizedRoot && normalized.startsWith(normalizedRoot)) {
    return normalized.slice(normalizedRoot.length).replace(/^\/+/, '');
  }
  const trimmed = normalized.startsWith('./') ? normalized.slice(2) : normalized;
  const safeParts = trimmed.split('/').filter(part => part && part !== '..');
  return safeParts.join('/');
}

async function detectWebGLZip(zipFile: File) {
  if (!zipFile.name.toLowerCase().endsWith('.zip')) return null;
  const zip = await JSZip.loadAsync(zipFile);
  const entryNames = Object.keys(zip.files);
  const indexEntry = entryNames.find((name) => !zip.files[name].dir && name.toLowerCase().endsWith('index.html'));
  if (!indexEntry) return null;
  const hasRuntime = entryNames.some((name) => {
    const lower = name.toLowerCase();
    return lower.endsWith('.wasm') || lower.endsWith('.data') || lower.endsWith('.unityweb') || lower.includes('/build/');
  });
  if (!hasRuntime) return null;
  const rootPrefix = indexEntry.includes('/') ? indexEntry.slice(0, indexEntry.lastIndexOf('/') + 1) : '';
  return { zip, indexEntry, rootPrefix };
}

export async function uploadWebGLBuildFromZip(params: { projectId: string; zipFile: File; folderName?: string; }) {
  const detection = await detectWebGLZip(params.zipFile);
  if (!detection) return null;

  const { zip, indexEntry, rootPrefix } = detection;
  const bucket = 'project-files';
  const baseFolder = `projects/${params.projectId}/webgl/${params.folderName || generateFileId()}/`;
  const uploadedPaths: string[] = [];

  try {
    const entries = Object.entries(zip.files);
    for (const [name, entry] of entries) {
      if (entry.dir) continue;
      const relative = normalizeZipPath(name, rootPrefix);
      const destination = `${baseFolder}${relative}`;
      const mime = inferMimeTypeFromName(relative);
      const fileBytes = await entry.async('uint8array');
      const blob = new File([fileBytes], relative, { type: mime });
      const { error } = await supabase.storage.from(bucket).upload(destination, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: mime
      });
      if (error) throw error;
      uploadedPaths.push(destination);
    }

    const relativeIndex = normalizeZipPath(indexEntry, rootPrefix);
    const indexPath = `${baseFolder}${relativeIndex}`;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(indexPath);

    return {
      indexPath,
      indexUrl: urlData.publicUrl,
      basePath: baseFolder,
      uploadedFiles: uploadedPaths.length
    };
  } catch (error) {
    if (uploadedPaths.length) {
      try {
        await supabase.storage.from(bucket).remove(uploadedPaths);
      } catch (cleanupError) {
        console.warn('Failed cleaning up partial WebGL upload', cleanupError);
      }
    }
    console.error('Error uploading WebGL build:', error);
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

export async function listAllInPrefix(prefix: string) {
  const bucket = 'project-files';
  const results: Array<{ path: string; name: string; id?: string; updated_at?: string; created_at?: string; last_accessed_at?: string; metadata?: any; size?: number; type?: 'file' | 'folder'; }> = [];
  async function listDir(path: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
    if (error) return;
    for (const item of data || []) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      if (item.id) {
        // supabase-js v2 returns Object with type property
      }
      // Supabase list doesn't return size in folders; we keep as is
      // We need to distinguish files vs folders via item.metadata == null and possibility of item.name containing '.'; but Supabase returns item as { name, id?, updated_at?, created_at?, last_accessed_at?, metadata? }
      const isFolder = !item.id && !item.metadata; // heuristic; folders have no id/metadata
      if (isFolder) {
        await listDir(fullPath);
      } else {
        results.push({ path: fullPath, name: item.name, id: (item as any).id, updated_at: (item as any).updated_at, created_at: (item as any).created_at, last_accessed_at: (item as any).last_accessed_at, metadata: (item as any).metadata, size: (item as any).metadata?.size, type: 'file' });
      }
    }
  }
  await listDir(prefix.replace(/^\/+|\/+$|^\.+/g, ''));
  return results;
}

export async function deleteStoragePrefix(prefix: string): Promise<number> {
  const bucket = 'project-files';
  const normalized = prefix.replace(/^\/+|\/+$/g, '');
  const entries = await listAllInPrefix(normalized);
  if (!entries.length) return 0;
  const { error } = await supabase.storage.from(bucket).remove(entries.map((e) => e.path));
  if (error) {
    throw error;
  }
  return entries.length;
}

export async function listProjectStorage(projectId: string) {
  const prefix = `projects/${projectId}`;
  return listAllInPrefix(prefix);
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
  // Try signed URL for private buckets; fall back to public URL
  try {
    // @ts-ignore - we will return synchronously after kicking off signed URL; fallback below
    const signed = (supabase.storage as any).from(bucket).createSignedUrl;
  } catch {}
  // Public URL fallback
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getBestFileUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
  const bucket = 'project-files';
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);
    if (!error && data?.signedUrl) return data.signedUrl;
  } catch {}
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// Prefer URLs that instruct the browser to download (Content-Disposition)
export async function getDownloadUrl(
  filePath: string,
  fileName?: string,
  expiresInSeconds = 3600
): Promise<string> {
  const bucket = 'project-files';
  // Try signed URL with download disposition
  try {
    const { data, error } = await (supabase.storage
      .from(bucket)
      // @ts-expect-error: options typing differs by sdk version; runtime supports { download }
      .createSignedUrl(filePath, expiresInSeconds, { download: fileName || true }));
    if (!error && data?.signedUrl) return data.signedUrl;
  } catch {}

  // Fallback: public URL with download hint (SDK may append ?download)
  try {
    // @ts-expect-error: older typings may not include options
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath, { download: fileName || true });
    if (data?.publicUrl) return data.publicUrl;
  } catch {}

  // Last resort: append ?download param manually
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const base = data?.publicUrl || '';
    if (!base) return base;
    const url = new URL(base);
    url.searchParams.set('download', String(fileName || ''));
    return url.toString();
  } catch {}

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// Remove any storage files under projects/<id>/ that no longer exist in the projects table
export async function cleanupOrphanedProjectStorage(): Promise<{ removed: number; kept: number }> {
  const bucket = 'project-files';
  // 1) Load existing project IDs
  let existingIds = new Set<string>();
  try {
    const { data: rows } = await (supabase
      .from('projects')
      .select('id'));
    (rows || []).forEach((r: any) => { if (r?.id) existingIds.add(String(r.id)); });
  } catch (e) {
    console.warn('cleanupOrphanedProjectStorage: failed to fetch projects', e);
  }

  // 2) List all files under projects/
  const entries = await listAllInPrefix('projects');
  const toRemove: string[] = [];
  let kept = 0;
  for (const e of entries) {
    const path = String(e.path || '');
    const m = path.match(/^projects\/([^/]+)\//);
    const pid = m ? m[1] : '';
    if (pid && !existingIds.has(pid)) {
      toRemove.push(path);
    } else {
      kept += 1;
    }
  }

  // 3) Remove orphaned files
  let removed = 0;
  if (toRemove.length) {
    const { error } = await supabase.storage.from(bucket).remove(toRemove);
    if (error) {
      console.warn('cleanupOrphanedProjectStorage: remove error', error);
    } else {
      removed = toRemove.length;
    }
  }
  return { removed, kept };
}
