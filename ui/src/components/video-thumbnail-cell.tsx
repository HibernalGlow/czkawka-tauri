import { Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VideoThumbnailCellProps {
  path: string;
  size?: 'sm' | 'md' | 'lg' | 'dynamic';
  className?: string;
  enableLazyLoad?: boolean;
  dynamicSize?: number;
  onClick?: () => void;
}

import { useVideoServer } from '~/hooks/use-video-server';

export function VideoThumbnailCell({
  path,
  size = 'md',
  className = '',
  enableLazyLoad = true,
  dynamicSize,
  onClick,
}: VideoThumbnailCellProps) {
  const [thumbnailData, setThumbnailData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!enableLazyLoad);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getVideoUrl } = useVideoServer();
  const videoUrl = getVideoUrl(path);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  let sizeClass: string;
  let iconClass: string;
  let thumbnailStyle: React.CSSProperties = {};

  if (size === 'dynamic' && dynamicSize) {
    const thumbnailSize = Math.max(20, Math.min(dynamicSize - 8, 200));
    sizeClass = '';
    iconClass =
      thumbnailSize < 40
        ? 'w-3 h-3'
        : thumbnailSize < 80
          ? 'w-4 h-4'
          : 'w-6 h-6';
    thumbnailStyle = {
      width: `${thumbnailSize}px`,
      height: `${thumbnailSize}px`,
      minWidth: `${thumbnailSize}px`,
      minHeight: `${thumbnailSize}px`,
      flexShrink: 0,
    };
  } else {
    sizeClass = sizeClasses[size as keyof typeof sizeClasses];
    iconClass = iconSizes[size as keyof typeof iconSizes];
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoad) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(element);
          }
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      },
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [enableLazyLoad]);

  // Generate thumbnail when visible
  useEffect(() => {
    if (!isVisible || !videoUrl) return;

    setIsLoading(true);
    setHasError(false);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    const handleLoadedMetadata = () => {
      // Seek to 1 second or 10% of video duration
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnailData(dataUrl);
          setIsLoading(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error generating video thumbnail:', error);
        setHasError(true);
        setIsLoading(false);
      } finally {
        video.remove();
      }
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      video.remove();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    video.src = videoUrl;

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.remove();
    };
  }, [videoUrl, isVisible]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${sizeClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={thumbnailStyle}
      onClick={handleClick}
    >
      {!isVisible ? (
        <div
          className={`${sizeClass} bg-gray-100 rounded flex items-center justify-center`}
          style={thumbnailStyle}
        >
          <Video className={`${iconClass} text-gray-300`} />
        </div>
      ) : isLoading ? (
        <div
          className={`${sizeClass} bg-gray-100 rounded flex items-center justify-center`}
          style={thumbnailStyle}
        >
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : hasError || !thumbnailData ? (
        <div
          className={`${sizeClass} bg-gray-200 rounded flex items-center justify-center`}
          style={thumbnailStyle}
        >
          <Video className={`${iconClass} text-gray-400`} />
        </div>
      ) : (
        <div className="relative group">
          <img
            src={thumbnailData}
            alt="Video thumbnail"
            className={`${sizeClass} object-cover rounded ${onClick ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
            style={thumbnailStyle}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 rounded-full p-2">
              <Video className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
