import { open } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { CircleHelp, Folder, Palette, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { initCurrentPresetAtom } from '~/atom/preset';
import { platformSettingsAtom } from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  Button,
  InputNumber,
  Label,
  ScrollArea,
  Slider,
  Switch,
  Textarea,
  TooltipButton,
  toastError,
} from '~/components';
import { Form, FormItem } from '~/components/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/shadcn/dialog';
import { Input } from '~/components/shadcn/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/shadcn/tabs';
import { MAXIMUM_FILE_SIZE } from '~/consts';
import { useBoolean, useT } from '~/hooks';
import { eventPreventDefault } from '~/utils/event';
import { PresetSelect } from './preset-select';
import { ThemePanel } from './theme-panel';

export function SettingsButton() {
  const dialogOpen = useBoolean();
  const isPreventDialogClose = useBoolean();
  const initCurrentPreset = useSetAtom(initCurrentPresetAtom);
  const t = useT();

  useEffect(() => {
    initCurrentPreset();
  }, []);

  return (
    <Dialog
      open={dialogOpen.value}
      onOpenChange={(open) => {
        if (isPreventDialogClose.value) {
          return;
        }
        dialogOpen.set(open);
      }}
      checkOpenedSelect={false}
    >
      <DialogTrigger asChild>
        <TooltipButton tooltip={t('Settings')}>
          <Settings />
        </TooltipButton>
      </DialogTrigger>
      <DialogContent className="max-w-[700px] outline-none">
        <DialogHeader>
          <DialogTitle>{t('Settings')}</DialogTitle>
          <DialogDescription>{t('Application settings')}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="h-[550px] flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('General settings')}
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('Theme settings')}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="general"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <PresetSelect
              onPreventDialogCloseChange={isPreventDialogClose.set}
            />
            <SettingsContent />
          </TabsContent>
          <TabsContent
            value="theme"
            className="flex-1 h-[480px] overflow-hidden"
          >
            <ThemePanel />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SettingsContent() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const platformSettings = useAtomValue(platformSettingsAtom);
  const t = useT();

  const handleSettingsChange = (v: Record<string, any>) => {
    setSettings((prev) => ({ ...prev, ...v }));
  };

  const handleOpenCacheFolder = () => {
    if (!platformSettings.cacheDirPath) {
      return;
    }
    openPath(platformSettings.cacheDirPath).catch((err) => {
      toastError(t('Failed to open cache folder'), err);
    });
  };

  const handleBrowseFolder = async (settingKey: string) => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected) {
        handleSettingsChange({ [settingKey]: selected });
      }
    } catch (error) {
      toastError(t('Failed to select folder'), error);
    }
  };

  return (
    <ScrollArea className="flex-1">
      <Form className="pr-3" value={settings} onChange={handleSettingsChange}>
        <GroupTitle>{t('General settings')}</GroupTitle>
        <FormItem
          name="excludedItems"
          label={t('Excluded items')}
          comp="textarea"
        >
          <Textarea rows={2} />
        </FormItem>
        <FormItem
          name="allowedExtensions"
          label={t('Allowed extensions')}
          comp="textarea"
        >
          <Textarea rows={2} />
        </FormItem>
        <FormItem
          name="excludedExtensions"
          label={t('Excluded extensions')}
          comp="textarea"
        >
          <Textarea rows={2} />
        </FormItem>
        <div className="flex items-center gap-2">
          <Label className="flex-shrink-0">{t('File size')}(KB):</Label>
          <FormItem name="minimumFileSize" comp="input-number">
            <InputNumber minValue={16} maxValue={MAXIMUM_FILE_SIZE} />
          </FormItem>
          ~
          <FormItem name="maximumFileSize" comp="input-number">
            <InputNumber minValue={16} maxValue={MAXIMUM_FILE_SIZE} />
          </FormItem>
        </div>
        <FormItem
          name="recursiveSearch"
          label={t('Recursive search')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem name="useCache" label={t('Use cache')} comp="switch">
          <Switch />
        </FormItem>
        <FormItem
          name="saveAlsoAsJson"
          label={t('Also save cache as JSON file')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="moveDeletedFilesToTrash"
          label={t('Move deleted files to trash')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="referencePathKeywords"
          label={t('Reference path keywords')}
          description={t('Reference path keywords hint')}
          comp="textarea"
        >
          <Textarea rows={1} placeholder="#compare" />
        </FormItem>

        <div className="flex flex-col gap-2 py-2">
          <Label>{t('Cache folder path')}</Label>
          <div className="flex gap-2">
            <Input
              value={settings.customCacheFolderPath}
              onChange={(e) =>
                handleSettingsChange({ customCacheFolderPath: e.target.value })
              }
              placeholder={platformSettings.cacheDirPath || t('System default')}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => handleBrowseFolder('customCacheFolderPath')}
              className="flex-shrink-0"
            >
              <Folder className="h-4 w-4 mr-1" />
              {t('Browse')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 py-2">
          <Label>{t('Config folder path')}</Label>
          <div className="flex gap-2">
            <Input
              value={settings.customConfigFolderPath}
              onChange={(e) =>
                handleSettingsChange({ customConfigFolderPath: e.target.value })
              }
              placeholder={t('System default')}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => handleBrowseFolder('customConfigFolderPath')}
              className="flex-shrink-0"
            >
              <Folder className="h-4 w-4 mr-1" />
              {t('Browse')}
            </Button>
          </div>
        </div>

        <FormItem
          name="threadNumber"
          label={
            <span className="inline-flex items-center">
              {t('Thread number')}
              <TooltipButton
                tooltip={t('Thread number tip')}
                onClick={eventPreventDefault}
              >
                <CircleHelp />
              </TooltipButton>
            </span>
          }
          comp="slider"
          suffix={
            <span>
              {settings.threadNumber}/{platformSettings.availableThreadNumber}
            </span>
          }
        >
          <Slider min={1} max={platformSettings.availableThreadNumber} />
        </FormItem>
        <GroupTitle>{t('Duplicate Files')}</GroupTitle>
        <FormItem
          name="duplicateMinimalHashCacheSize"
          label={`${t('Minimal size of cached files')} - ${t('Hash')} (KB)`}
          comp="input-number"
        >
          <InputNumber minValue={1} />
        </FormItem>
        <FormItem
          name="duplicateMinimalPrehashCacheSize"
          label={`${t('Minimal size of cached files')} - ${t('Prehash')} (KB)`}
          comp="input-number"
        >
          <InputNumber minValue={1} />
        </FormItem>
        <FormItem
          name="duplicateImagePreview"
          label={t('Image preview')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="duplicateHideHardLinks"
          label={t('Hide hard links')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="duplicateUsePrehash"
          label={t('Use prehash')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="duplicateDeleteOutdatedEntries"
          label={t('Delete automatically outdated entries')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <GroupTitle>{t('Similar Images')}</GroupTitle>
        <FormItem
          name="similarImagesShowImagePreview"
          label={t('Image preview')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="similarImagesHideHardLinks"
          label={t('Hide hard links')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="similarImagesDeleteOutdatedEntries"
          label={t('Delete automatically outdated entries')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <GroupTitle>{t('Similar Videos')}</GroupTitle>
        <FormItem
          name="similarVideosHideHardLinks"
          label={t('Hide hard links')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <FormItem
          name="similarVideosDeleteOutdatedEntries"
          label={t('Delete automatically outdated entries')}
          comp="switch"
        >
          <Switch />
        </FormItem>
        <GroupTitle>{t('Music Duplicates')}</GroupTitle>
        <FormItem
          name="similarMusicDeleteOutdatedEntries"
          label={t('Delete automatically outdated entries')}
          comp="switch"
        >
          <Switch />
        </FormItem>
      </Form>
      <GroupTitle>{t('Other')}</GroupTitle>
      <Button variant="secondary" onClick={handleOpenCacheFolder}>
        {t('Open cache folder')}
      </Button>
    </ScrollArea>
  );
}

function GroupTitle(props: { children?: React.ReactNode }) {
  const { children } = props;

  return <h3 className="w-full text-center">{children}</h3>;
}
