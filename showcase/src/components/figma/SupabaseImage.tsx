import React, { useState, useEffect } from 'react';
import { getFileUrl, getBestFileUrl } from '../../utils/fileStorage';

interface SupabaseImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  bucket?: string;
}

export function SupabaseImage({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  fallbackSrc = '/placeholder-project.svg',
  bucket = 'project-files'
}: SupabaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (!src) {
          setImageUrl(fallbackSrc);
          return;
        }

        // Strip known prefixes like external:
        const raw = src.startsWith('external:') ? src.replace(/^external:/, '') : src;
        console.log('[SupabaseImage] resolve src:', { src, raw });

        // If it's a full URL, data URL, or absolute path, use directly
        if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('/')) {
          console.log('[SupabaseImage] using direct URL', raw);
          setImageUrl(raw);
          return;
        }

        // If it looks like a Supabase Storage path (e.g., projects/...), resolve to public URL
        if (raw.startsWith('projects/')) {
          try {
            const url = await getBestFileUrl(raw, 3600);
            console.log('[SupabaseImage] signed/public URL:', url);
            setImageUrl(url);
          } catch (e) {
            console.warn('[SupabaseImage] signed URL failed, fallback public URL', e);
            const url = getFileUrl(raw);
            setImageUrl(url);
          }
          return;
        }

        // Fallback if unknown format
        console.warn('[SupabaseImage] unknown src format, fallback');
        setImageUrl(fallbackSrc);
      } catch (err) {
        console.error('[SupabaseImage] Error loading image:', err);
        setError(true);
        setImageUrl(fallbackSrc);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [src, fallbackSrc, bucket]);

  const handleError = () => {
    setError(true);
    setImageUrl(fallbackSrc);
  };

  if (loading) {
    return (
      <div 
        className={`bg-muted animate-pulse ${className}`}
        style={{ display: 'block', ...style }}
      />
    );
  }

  return (
    <img
      key={imageUrl}
      src={error ? fallbackSrc : imageUrl}
      alt={alt}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: (className?.includes('object-contain') ? 'contain' : className?.includes('object-cover') ? 'cover' : undefined), ...style }}
      onError={(e) => {
        console.error('[SupabaseImage] onError', { src: error ? fallbackSrc : imageUrl });
        handleError();
      }}
      onLoad={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        console.log('[SupabaseImage] onLoad', { src: img.currentSrc || img.src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      }}
      loading="lazy"
    />
  );
}