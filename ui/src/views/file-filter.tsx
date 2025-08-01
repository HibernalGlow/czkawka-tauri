import { useAtom } from 'jotai';
import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { filterPanelAtom } from '~/atom/primitive';
import { Button } from '~/components';

export function FileFilter() {
  const { t } = useTranslation();
  const [_panelState, setPanelState] = useAtom(filterPanelAtom);

  const openFilterPanel = () => {
    setPanelState((prev) => ({ ...prev, isOpen: true }));
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openFilterPanel}
      className="gap-2"
    >
      <Filter className="h-4 w-4" />
      {t('Filter')}
    </Button>
  );
}
