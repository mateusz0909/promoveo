import { useState, useEffect } from 'react';
import { placeholderDataUrl } from '../lib/placeholder';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage = ({ src, alt, className }: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholderDataUrl);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to handle CORS
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
    };
    
    img.onerror = (error) => {
      console.error(`LazyImage: Failed to load image:`, src, error);
      setImageSrc(placeholderDataUrl);
    };
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        console.error(`LazyImage: Direct img onError for:`, src);
        setImageSrc(placeholderDataUrl);
      }}
    />
  );
};