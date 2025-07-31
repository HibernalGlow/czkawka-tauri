import { Image } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ClickableImagePreview } from '~/views/clickable-image-preview';
import { ThumbnailLoader, isImageFile } from '~/utils/thumbnail-loader';

interface ThumbnailCellProps {
  path: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  enableLazyLoad?: boolean;
}

export function ThumbnailCell({ 
  path, 
  size = 'md', 
  className = '',
  enableLazyLoad = true 
}: ThumbnailCellProps) {
  const [thumbnailData, setThumbnailData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!enableLazyLoad);
  const imgRef = useRef<HTMLDivElement>(null);
  const abortedRef = useRef(false);
  
  // 根据size设置尺寸
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };
  
  const sizeClass = sizeClasses[size];
  const iconClass = iconSizes[size];
  
  // 检查是否是图片文件
  const isImage = isImageFile(path);
  
  // 使用Intersection Observer实现懒加载
  useEffect(() => {
    if (!enableLazyLoad) return;
    
    const element = imgRef.current;
    if (!element || !isImage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '100px', // 提前100px开始加载
        threshold: 0.1
      }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [isImage, enableLazyLoad]);
  
  // 当变为可见时加载缩略图
  useEffect(() => {
    if (!isVisible || !isImage) return;
    
    abortedRef.current = false;
    setIsLoading(true);
    setHasError(false);
    
    const loader = ThumbnailLoader.getInstance();
    
    loader.loadThumbnail(path)
      .then((dataUrl) => {
        if (!abortedRef.current) {
          setThumbnailData(dataUrl);
        }
      })
      .catch(() => {
        if (!abortedRef.current) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (!abortedRef.current) {
          setIsLoading(false);
        }
      });
    
    // 清理函数：取消请求
    return () => {
      abortedRef.current = true;
      loader.abortRequest(path);
    };
  }, [path, isVisible, isImage]);
  
  if (!isImage) {
    return (
      <div className={`${sizeClass} bg-gray-200 rounded flex items-center justify-center ${className}`}>
        <Image className={`${iconClass} text-gray-400`} />
      </div>
    );
  }
  
  return (
    <div ref={imgRef} className={`${sizeClass} ${className}`}>
      {!isVisible ? (
        <div className={`${sizeClass} bg-gray-100 rounded flex items-center justify-center`}>
          <Image className={`${iconClass} text-gray-300`} />
        </div>
      ) : isLoading ? (
        <div className={`${sizeClass} bg-gray-100 rounded flex items-center justify-center`}>
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : hasError || !thumbnailData ? (
        <div className={`${sizeClass} bg-gray-200 rounded flex items-center justify-center`}>
          <Image className={`${iconClass} text-gray-400`} />
        </div>
      ) : (
        <ClickableImagePreview path={path}>
          <img 
            src={thumbnailData} 
            alt="Thumbnail"
            className={`${sizeClass} object-cover rounded cursor-pointer hover:opacity-80 transition-opacity`}
          />
        </ClickableImagePreview>
      )}
    </div>
  );
}
