import React, { useState, useEffect } from 'react';

interface SupabaseImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  bucket?: string;
  supabase: any;
}

export function SupabaseImage({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  fallbackSrc = '/placeholder-project.svg',
  bucket = 'project-files',
  supabase
}: SupabaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setImageUrl(fallbackSrc);
        setLoading(false);
        return;
      }

      // If it's already a full URL or data URL, use it directly
      if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/')) {
        setImageUrl(src);
        setLoading(false);
        return;
      }

      // If it's a Supabase storage path, get signed URL
      try {
        // Check if it's a public URL first
        if (src.includes('supabase.co/storage/v1/object/public/')) {
          setImageUrl(src);
          setLoading(false);
          return;
        }

        // Try to get a signed URL for private files
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(src, 3600); // 1 hour expiry

        if (error) {
          console.warn('Error getting signed URL:', error);
          // Fall back to public URL
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(src);
          
          setImageUrl(publicUrlData.publicUrl);
        } else {
          setImageUrl(data?.signedUrl || fallbackSrc);
        }
      } catch (err) {
        console.error('Error loading image:', err);
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
        style={style}
      />
    );
  }

  return (
    <img
      src={error ? fallbackSrc : imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
}