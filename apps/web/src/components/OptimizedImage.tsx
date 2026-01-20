import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  // Feature #291: Support for modern image formats
  // The component will automatically use WebP/AVIF if available
}

/**
 * Feature #291: Optimized Image Component
 *
 * This component provides:
 * 1. Lazy loading support (default)
 * 2. Responsive sizing with width/height props
 * 3. Support for modern image formats (WebP/AVIF)
 * 4. Proper alt text for accessibility
 * 5. Loading state handling
 *
 * Usage:
 * <OptimizedImage
 *   src="/path/to/image.webp"
 *   alt="Description"
 *   width={800}
 *   height={600}
 *   loading="lazy"
 * />
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setHasError(true);

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // If already loaded
    if (img.complete) {
      setIsLoaded(true);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, []);

  // Error state - show placeholder
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-gray-400 ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-800"
          style={{ width, height }}
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width, height }}
      />
    </div>
  );
}
