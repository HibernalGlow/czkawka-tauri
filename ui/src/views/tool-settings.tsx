import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { currentToolAtom } from '~/atom/primitive';
import { settingsAtom } from '~/atom/settings';
import {
  Button,
  CheckboxWithLabel,
  InputNumber,
  OperationButton,
  Select,
  Slider,
  Switch,
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
import {
  BigFilesSearchMode,
  DuplicatesAvailableHashType,
  DuplicatesCheckMethod,
  SimilarImagesHashAlgorithm,
  SimilarImagesResizeAlgorithm,
  SimilarMusicAudioCheckType,
  Tools,
} from '~/consts';
import { useBoolean, useT } from '~/hooks';
import { ipc } from '~/ipc';

// 通用路径显示设置组件
function PathDisplaySettings() {
  const t = useT();

  return (
    <FormItem
      name="reversePathDisplay"
      label={t('Reverse path display')}
      description={t('Reverse path display hint')}
      comp="switch"
    >
      <Switch />
    </FormItem>
  );
}

// 通用图片设置组件
function ImageDisplaySettings() {
  const settings = useAtomValue(settingsAtom);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<{
    count: number;
    size: string;
  } | null>(null);
  const t = useT();

  const loadCacheStats = useCallback(async () => {
    try {
      const [count, sizeBytes] = await ipc.getThumbnailCacheStats();
      const sizeStr =
        sizeBytes > 1024 * 1024
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${(sizeBytes / 1024).toFixed(1)} KB`;
      setCacheStats({ count, size: sizeStr });
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }, []);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await ipc.clearThumbnailCache();
      await loadCacheStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearingCache(false);
    }
  };

  useEffect(() => {
    if (settings.similarImagesEnableThumbnails) {
      loadCacheStats();
    }
  }, [settings.similarImagesEnableThumbnails, loadCacheStats]);

  return (
    <>
      <FormItem
        name="similarImagesEnableThumbnails"
        label={t('Enable thumbnails')}
        comp="switch"
      >
        <Switch />
      </FormItem>
      {settings.similarImagesEnableThumbnails && (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          <div className="text-sm text-muted-foreground">
            {t('Thumbnail cache')}
          </div>
          {cacheStats && (
            <div className="text-xs text-muted-foreground">
              {cacheStats.count} {t('files')}, {cacheStats.size}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            disabled={clearingCache}
            className="h-8 px-3"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            {clearingCache ? t('Clearing...') : t('Clear cache')}
          </Button>
        </div>
      )}
      <FormItem
        name="similarImagesShowImagePreview"
        label={t('Show image preview')}
        comp="switch"
      >
        <Switch />
      </FormItem>
    </>
  );
}

// 通用视频设置组件
function VideoDisplaySettings() {
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  return (
    <>
      <FormItem
        name="similarVideosEnableThumbnails"
        label={t('Enable video thumbnails')}
        comp="switch"
      >
        <Switch />
      </FormItem>
    </>
  );
}

const toolsWithoutSettings = new Set<string>([
  // 移除所有工具，因为现在所有工具都有路径显示设置
]);

// 简单工具设置组件（只有路径显示选项）
function SimpleToolSettings() {
  return (
    <>
      <ImageDisplaySettings />
      <PathDisplaySettings />
    </>
  );
}

const settingsCompMap: Record<
  string,
  (props: {
    showControls?: boolean;
    showAlgorithms?: boolean;
  }) => React.JSX.Element
> = {
  [Tools.DuplicateFiles]: DuplicateFilesSettings,
  [Tools.BigFiles]: BigFilesSettings,
  [Tools.SimilarImages]: SimilarImagesSettings,
  [Tools.SimilarVideos]: SimilarVideosSettings,
  [Tools.MusicDuplicates]: MusicDuplicatesSettings,
  [Tools.BrokenFiles]: BrokenFilesSettings,
  [Tools.EmptyFolders]: SimpleToolSettings,
  [Tools.EmptyFiles]: SimpleToolSettings,
  [Tools.TemporaryFiles]: SimpleToolSettings,
  [Tools.InvalidSymlinks]: SimpleToolSettings,
  [Tools.BadExtensions]: SimpleToolSettings,
};

export function ToolSettings({
  inPanel = false,
  showControls = true,
  showAlgorithms = true,
}: {
  inPanel?: boolean;
  showControls?: boolean;
  showAlgorithms?: boolean;
}) {
  const currentTool = useAtomValue(currentToolAtom);
  const [settings, setSettings] = useAtom(settingsAtom);
  const dialogOpen = useBoolean();
  const t = useT();

  if (toolsWithoutSettings.has(currentTool)) {
    return null;
  }

  const descMap: Record<string, string> = {
    [Tools.DuplicateFiles]: t('Duplicate files settings'),
    [Tools.BigFiles]: t('Big files settings'),
    [Tools.SimilarImages]: t('Similar images settings'),
    [Tools.SimilarVideos]: t('Similar videos settings'),
    [Tools.MusicDuplicates]: t('Music duplicates settings'),
    [Tools.BrokenFiles]: t('Broken files settings'),
  };

  const desc = descMap[currentTool];

  const handleSettingsChange = (v: Record<string, any>) => {
    setSettings((old) => ({ ...old, ...v }));
  };

  const SettingsComponent = settingsCompMap[currentTool] || Fallback;

  const renderSettings = () => {
    if (!showControls && !showAlgorithms) {
      return null;
    }

    return (
      <Form
        value={settings}
        onChange={handleSettingsChange}
        className={inPanel ? 'space-y-3' : ''}
      >
        <SettingsComponent
          showControls={showControls}
          showAlgorithms={showAlgorithms}
        />
      </Form>
    );
  };

  if (inPanel) {
    return (
      <div className="w-full h-full overflow-auto p-2 hide-scrollbar">
        {renderSettings()}
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen.value} onOpenChange={dialogOpen.set}>
      <DialogTrigger asChild>
        <OperationButton>
          <Settings2 />
          {t('Tool settings')}
        </OperationButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Tool settings')}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        {renderSettings()}
      </DialogContent>
    </Dialog>
  );
}

function Fallback() {
  return <div>Something wrong</div>;
}

function DuplicateFilesSettings({
  showControls = true,
  showAlgorithms = true,
}: {
  showControls?: boolean;
  showAlgorithms?: boolean;
}) {
  const t = useT();
  const settings = useAtomValue(settingsAtom);

  return (
    <>
      {showAlgorithms && (
        <>
          <FormItem
            name="duplicatesSubCheckMethod"
            label={t('Check method')}
            comp="select"
          >
            <Select
              options={[
                { label: t('Hash'), value: DuplicatesCheckMethod.Hash },
                { label: t('Name'), value: DuplicatesCheckMethod.Name },
                { label: t('Size'), value: DuplicatesCheckMethod.Size },
                {
                  label: t('Size and name'),
                  value: DuplicatesCheckMethod.SizeAndName,
                },
              ]}
            />
          </FormItem>
          <FormItem
            name="duplicatesSubAvailableHashType"
            label={t('Hash type')}
            comp="select"
          >
            <Select
              options={[
                { label: 'Blake3', value: DuplicatesAvailableHashType.Blake3 },
                { label: 'CRC32', value: DuplicatesAvailableHashType.CRC32 },
                { label: 'XXH3', value: DuplicatesAvailableHashType.XXH3 },
              ]}
            />
          </FormItem>
        </>
      )}
      {showControls && (
        <>
          <FormItem
            name="duplicatesSubNameCaseSensitive"
            label={t('Case sensitive')}
            comp="switch"
          >
            <Switch />
          </FormItem>
          <FormItem
            name="duplicateGroupSizeThreshold"
            label={t('Min group size')}
            comp="slider"
            suffix={<span>≥{settings.duplicateGroupSizeThreshold}</span>}
          >
            <Slider min={1} max={10} />
          </FormItem>
        </>
      )}
      <ImageDisplaySettings />
      <PathDisplaySettings />
    </>
  );
}

function BigFilesSettings({
  showControls = true,
  showAlgorithms = true,
}: {
  showControls?: boolean;
  showAlgorithms?: boolean;
}) {
  const t = useT();

  return (
    <>
      {showAlgorithms && (
        <FormItem
          name="biggestFilesSubMethod"
          label={t('Checked files')}
          comp="select"
        >
          <Select
            options={[
              { label: t('Biggest'), value: BigFilesSearchMode.BiggestFiles },
              { label: t('Smallest'), value: BigFilesSearchMode.SmallestFiles },
            ]}
          />
        </FormItem>
      )}
      {showControls && (
        <FormItem
          name="biggestFilesSubNumberOfFiles"
          label={t('Number of lines')}
          comp="input-number"
        >
          <InputNumber minValue={1} />
        </FormItem>
      )}
      <ImageDisplaySettings />
      <PathDisplaySettings />
    </>
  );
}

function SimilarImagesSettings({
  showControls = true,
  showAlgorithms = true,
}: {
  showControls?: boolean;
  showAlgorithms?: boolean;
}) {
  const settings = useAtomValue(settingsAtom);
  const setSettings = useSetAtom(settingsAtom);
  const t = useT();

  const _handlePresetClick = (value: number) => {
    setSettings((prev) => ({ ...prev, similarImagesSubSimilarity: value }));
  };

  return (
    <>
      {showAlgorithms && (
        <>
          <FormItem
            name="similarImagesSubHashSize"
            label={t('Hash size')}
            comp="select"
          >
            <Select
              options={['8', '16', '32', '64'].map((value) => ({
                label: value,
                value,
              }))}
            />
          </FormItem>
          <FormItem
            name="similarImagesSubResizeAlgorithm"
            label={t('Resize algorithm')}
            comp="select"
          >
            <Select
              options={Object.values(SimilarImagesResizeAlgorithm).map(
                (value) => ({
                  label: value,
                  value,
                }),
              )}
            />
          </FormItem>
          <FormItem
            name="similarImagesSubHashAlg"
            label={t('Hash type')}
            comp="select"
          >
            <Select
              options={Object.values(SimilarImagesHashAlgorithm).map(
                (value) => ({
                  label: value,
                  value,
                }),
              )}
            />
          </FormItem>
        </>
      )}
      {showControls && (
        <>
          <FormItem
            name="similarImagesSubSimilarity"
            label={t('Max difference')}
            comp="slider"
            suffix={<span>({settings.similarImagesSubSimilarity}/40)</span>}
          >
            <Slider min={0} max={40} />
          </FormItem>
          <FormItem
            name="similarImagesFolderThreshold"
            label="文件夹阈值"
            comp="slider"
            suffix={<span>{settings.similarImagesFolderThreshold} </span>}
          >
            <Slider min={1} max={50} />
          </FormItem>
          <FormItem
            name="similarImagesSubIgnoreSameSize"
            label={t('Ignore same size')}
            comp="select"
          >
            <Switch />
          </FormItem>
        </>
      )}
      <ImageDisplaySettings />
      {showAlgorithms && <PathDisplaySettings />}
    </>
  );
}

function SimilarVideosSettings({
  showControls = true,
  showAlgorithms: _showAlgorithms = true,
}: {
  showControls?: boolean;
  showAlgorithms?: boolean;
}) {
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  return (
    <>
      {showControls && (
        <>
          <FormItem
            name="similarVideosSubSimilarity"
            label={t('Max difference')}
            comp="slider"
            suffix={<span>({settings.similarVideosSubSimilarity}/20)</span>}
          >
            <Slider min={0} max={20} />
          </FormItem>
          <FormItem
            name="similarVideosSubIgnoreSameSize"
            label={t('Ignore same size')}
            comp="switch"
          >
            <Switch />
          </FormItem>
          <FormItem
            name="similarVideosSkipForwardAmount"
            label={t('Skip forward (s)')}
            description={t('Skip forward desc')}
            comp="slider"
            suffix={<span>{settings.similarVideosSkipForwardAmount}s</span>}
          >
            <Slider min={0} max={300} />
          </FormItem>
          <FormItem
            name="similarVideosVidHashDuration"
            label={t('Hash duration (s)')}
            description={t('Hash duration desc')}
            comp="slider"
            suffix={<span>{settings.similarVideosVidHashDuration}s</span>}
          >
            <Slider min={2} max={60} />
          </FormItem>
          <FormItem
            name="similarVideosCropDetect"
            label={t('Crop detect')}
            description={t('Crop detect desc')}
            comp="select"
          >
            <Select
              options={[
                { label: t('Letterbox'), value: 'letterbox' },
                { label: t('Motion'), value: 'motion' },
                { label: t('None'), value: 'none' },
              ]}
            />
          </FormItem>
        </>
      )}
      <VideoDisplaySettings />
      <PathDisplaySettings />
    </>
  );
}

function MusicDuplicatesSettings({
  showControls = true,
  showAlgorithms = true,
}: {
  showControls?: boolean;
  showAlgorithms?: boolean;
}) {
  const settings = useAtomValue(settingsAtom);
  const t = useT();

  return (
    <>
      {showAlgorithms && (
        <FormItem
          name="similarMusicSubAudioCheckType"
          label={t('Audio check type')}
          comp="select"
        >
          <Select
            options={Object.values(SimilarMusicAudioCheckType).map((value) => ({
              label: t(value),
              value,
            }))}
          />
        </FormItem>
      )}
      {showControls &&
        settings.similarMusicSubAudioCheckType ===
          SimilarMusicAudioCheckType.Tags && (
          <>
            <FormItem
              name="similarMusicSubApproximateComparison"
              label={t('Approximate tag comparison')}
              comp="switch"
            >
              <Switch />
            </FormItem>
            <span className="text-center">{t('Compared tags')}</span>
            <div className="grid grid-cols-3 gap-2 *:pl-4">
              <FormItem name="similarMusicSubTitle" comp="checkbox">
                <CheckboxWithLabel label={t('Title')} />
              </FormItem>
              <FormItem name="similarMusicSubArtist" comp="checkbox">
                <CheckboxWithLabel label={t('Artist')} />
              </FormItem>
              <FormItem name="similarMusicSubBitrate" comp="checkbox">
                <CheckboxWithLabel label={t('Bitrate')} />
              </FormItem>
              <FormItem name="similarMusicSubGenre" comp="checkbox">
                <CheckboxWithLabel label={t('Genre')} />
              </FormItem>
              <FormItem name="similarMusicSubYear" comp="checkbox">
                <CheckboxWithLabel label={t('Year')} />
              </FormItem>
              <FormItem name="similarMusicSubLength" comp="checkbox">
                <CheckboxWithLabel label={t('Length')} />
              </FormItem>
            </div>
          </>
        )}
      {showControls &&
        settings.similarMusicSubAudioCheckType ===
          SimilarMusicAudioCheckType.Fingerprint && (
          <>
            <FormItem
              name="similarMusicSubMaximumDifferenceValue"
              label={t('Max difference')}
              comp="slider"
              suffix={
                <span>
                  ({settings.similarMusicSubMaximumDifferenceValue}/10)
                </span>
              }
            >
              <Slider min={0} max={10} />
            </FormItem>
            <FormItem
              name="similarMusicSubMinimalFragmentDurationValue"
              label={t('Minimal fragment duration')}
              comp="slider"
              suffix={
                <span>
                  {settings.similarMusicSubMinimalFragmentDurationValue}
                </span>
              }
            >
              <Slider min={0} max={180} />
            </FormItem>
            <FormItem
              name="similarMusicCompareFingerprintsOnlyWithSimilarTitles"
              label={t('Compare only with similar titles')}
              comp="switch"
            >
              <Switch />
            </FormItem>
          </>
        )}
      <ImageDisplaySettings />
      <PathDisplaySettings />
    </>
  );
}

function BrokenFilesSettings({
  showControls = true,
  showAlgorithms: _showAlgorithms = true,
}: {
  showControls?: boolean;
  showAlgorithms?: boolean;
}) {
  const t = useT();

  return (
    <>
      {showControls && (
        <>
          <span className="text-center">{t('Type of files to check')}</span>
          <div className="grid grid-cols-4 justify-items-center">
            <FormItem name="brokenFilesSubAudio" comp="checkbox">
              <CheckboxWithLabel label={t('Audio')} />
            </FormItem>
            <FormItem name="brokenFilesSubPdf" comp="checkbox">
              <CheckboxWithLabel label={t('Pdf')} />
            </FormItem>
            <FormItem name="brokenFilesSubArchive" comp="checkbox">
              <CheckboxWithLabel label={t('Archive')} />
            </FormItem>
            <FormItem name="brokenFilesSubImage" comp="checkbox">
              <CheckboxWithLabel label={t('Image')} />
            </FormItem>
          </div>
        </>
      )}
      <ImageDisplaySettings />
      <PathDisplaySettings />
    </>
  );
}
