import { useState, useEffect } from 'react';
import { placeholderDataUrl } from '../lib/placeholder';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage = ({ src, alt, className }: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholderDataUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    console.log(`LazyImage: Attempting to load image:`, src);
    setIsLoading(true);
    setHasError(false);
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to handle CORS
    img.src = src;
    
    img.onload = () => {
      console.log(`LazyImage: Successfully loaded image:`, src);
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = (error) => {
      console.error(`LazyImage: Failed to load image:`, src, error);
      setHasError(true);
      setIsLoading(false);
      // Keep placeholder as fallback
    };
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error(`LazyImage: Direct img onError for:`, src);
        setHasError(true);
      }}
    />
  );
};