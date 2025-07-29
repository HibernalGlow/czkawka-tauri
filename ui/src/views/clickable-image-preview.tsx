import { useAtom } from 'jotai';
import { sidebarImagePreviewAtom } from '~/atom/primitive';

interface ClickableImagePreviewProps {
  path: string;
  children: React.ReactNode;
  className?: string;
  disableDefaultStyles?: boolean;
}

export function ClickableImagePreview(props: ClickableImagePreviewProps) {
  const { children, path, className, disableDefaultStyles = false } = props;
  const [sidebarState, setSidebarState] = useAtom(sidebarImagePreviewAtom);

  const handleClick = () => {
    setSidebarState({
      ...sidebarState,
      isOpen: true,
      imagePath: path,
    });
  };

  const defaultClassName = disableDefaultStyles
    ? 'cursor-pointer'
    : 'cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 transition-colors';

  return (
    <div
      className={className || defaultClassName}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="点击预览图片"
    >
      {children}
    </div>
  );
}
