import React, { useState, useEffect } from 'react';

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

      // If it's a valid URL or path, use it directly
      try {
        if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/')) {
          setImageUrl(src);
        } else {
          // For non-URL paths, use fallback
          setImageUrl(fallbackSrc);
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