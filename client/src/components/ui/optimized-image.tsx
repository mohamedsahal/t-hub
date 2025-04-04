import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  lazyLoad?: boolean;
  placeholderColor?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component for better image loading performance
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Smooth fade-in effect
 * - Placeholder color until image loads
 * - Error handling with fallback
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  lazyLoad = true,
  placeholderColor = '#f3f4f6',
  className = '',
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Handle successful image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image loading error
  const handleError = () => {
    setIsError(true);
    if (onError) onError();
  };

  useEffect(() => {
    const imageElement = imgRef.current;
    if (!imageElement || !lazyLoad) return;

    // Setup IntersectionObserver for lazy loading
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imageElement) {
            // Start loading the image when it becomes visible
            if (imageElement.dataset.src) {
              imageElement.src = imageElement.dataset.src;
              delete imageElement.dataset.src;
            }
            // Disconnect the observer once the image starts loading
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      }, {
        rootMargin: '200px 0px', // Start loading images 200px before they enter the viewport
        threshold: 0.01,
      });
      
      observerRef.current.observe(imageElement);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      if (imageElement.dataset.src) {
        imageElement.src = imageElement.dataset.src;
        delete imageElement.dataset.src;
      }
    }

    return () => {
      // Clean up observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazyLoad, src]);

  // Determine the source attribute based on lazy loading
  const srcAttribute = lazyLoad ? undefined : src;
  const dataSrcAttribute = lazyLoad ? src : undefined;

  // Style for the image wrapper
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
    backgroundColor: placeholderColor,
    overflow: 'hidden',
  };

  // If there's an error, show a placeholder with the alt text
  if (isError) {
    return (
      <div 
        style={wrapperStyle} 
        className={`optimized-image-error ${className}`}
        role="img"
        aria-label={alt}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '1rem',
          color: '#6b7280',
          textAlign: 'center',
          fontSize: '0.875rem',
        }}>
          {alt || 'Image failed to load'}
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle} className={`optimized-image-container ${className}`}>
      <img
        ref={imgRef}
        src={srcAttribute}
        data-src={dataSrcAttribute}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
        loading={lazyLoad ? 'lazy' : undefined}
        {...props}
      />
    </div>
  );
}