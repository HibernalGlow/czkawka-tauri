import { useAtom, useAtomValue } from 'jotai';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { currentToolAtom } from '~/atom/primitive';
import { currentToolDataAtom } from '~/atom/tools';
import { Button } from '~/components';
import { Badge } from '~/components/shadcn/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/shadcn/dialog';
import { Input } from '~/components/shadcn/input';
import { Label } from '~/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/shadcn/select';
import { Slider } from '~/components/shadcn/slider';
import { Tools } from '~/consts';
import { useBoolean } from '~/hooks';
import type {
  BaseEntry,
  DuplicateEntry,
  ImagesEntry,
  MusicEntry,
  VideosEntry,
} from '~/types';

// 筛选条件接口
interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number;
  label: string;
}

// 操作符
const OPERATORS = {
  EQUALS: 'equals',
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  GREATER_THAN: 'gt',
  LESS_THAN: 'lt',
  GREATER_EQUAL: 'gte',
  LESS_EQUAL: 'lte',
} as const;

// 相似度等级映射
const SIMILARITY_LEVELS = {
  'Very High': 95,
  High: 85,
  Medium: 75,
  Small: 60,
  'Very Small': 40,
  Minimal: 20,
} as const;

// 根据工具类型获取可用的筛选字段
function getAvailableFields(tool: string) {
  const commonFields = [
    { value: 'fileName', label: 'File Name', type: 'text' },
    { value: 'path', label: 'Path', type: 'text' },
    { value: 'size', label: 'Size', type: 'size' },
    { value: 'modifiedDate', label: 'Modified Date', type: 'date' },
  ];

  switch (tool) {
    case Tools.SimilarImages:
      return [
        ...commonFields,
        { value: 'similarity', label: 'Similarity', type: 'similarity' },
        { value: 'dimensions', label: 'Dimensions', type: 'text' },
        { value: 'width', label: 'Width', type: 'number' },
        { value: 'height', label: 'Height', type: 'number' },
      ];
    case Tools.SimilarVideos:
      return commonFields;
    case Tools.MusicDuplicates:
      return [
        ...commonFields,
        { value: 'trackTitle', label: 'Title', type: 'text' },
        { value: 'trackArtist', label: 'Artist', type: 'text' },
        { value: 'year', label: 'Year', type: 'number' },
        { value: 'bitrate', label: 'Bitrate', type: 'number' },
        { value: 'length', label: 'Length', type: 'text' },
        { value: 'genre', label: 'Genre', type: 'text' },
      ];
    case Tools.DuplicateFiles:
      return [...commonFields, { value: 'hash', label: 'Hash', type: 'text' }];
    default:
      return commonFields;
  }
}

// 根据字段类型获取可用的操作符
function getAvailableOperators(fieldType: string) {
  switch (fieldType) {
    case 'size':
    case 'number':
    case 'date':
      return [
        { value: OPERATORS.EQUALS, label: 'Equals' },
        { value: OPERATORS.GREATER_THAN, label: 'Greater than' },
        { value: OPERATORS.LESS_THAN, label: 'Less than' },
        { value: OPERATORS.GREATER_EQUAL, label: 'Greater or equal' },
        { value: OPERATORS.LESS_EQUAL, label: 'Less or equal' },
      ];
    case 'similarity':
      return [
        { value: OPERATORS.GREATER_THAN, label: 'Greater than' },
        { value: OPERATORS.LESS_THAN, label: 'Less than' },
        { value: OPERATORS.EQUALS, label: 'Equals' },
      ];
    case 'text':
    default:
      return [
        { value: OPERATORS.CONTAINS, label: 'Contains' },
        { value: OPERATORS.EQUALS, label: 'Equals' },
        { value: OPERATORS.STARTS_WITH, label: 'Starts with' },
        { value: OPERATORS.ENDS_WITH, label: 'Ends with' },
      ];
  }
}

// 解析文件大小字符串为字节数
function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/^([\d.]+)\s*([KMGTPE]?B?)$/i);
  if (!match) return 0;

  const [, num, unit] = match;
  const value = parseFloat(num);
  const multiplier =
    {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
    }[unit.toUpperCase()] || 1;

  return value * multiplier;
}

// 解析相似度字符串为数值
function parseSimilarity(similarity: string): number {
  if (similarity in SIMILARITY_LEVELS) {
    return SIMILARITY_LEVELS[similarity as keyof typeof SIMILARITY_LEVELS];
  }

  const match = similarity.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// 获取数值进行比较
function getNumericValue(item: any, field: string, fieldType: string): number {
  const value = item[field];

  switch (fieldType) {
    case 'size':
      return parseSizeToBytes(value);
    case 'similarity':
      return parseSimilarity(value);
    case 'number':
      return parseFloat(value) || 0;
    case 'date':
      return new Date(value).getTime();
    default:
      return 0;
  }
}

// 应用筛选条件
function applyFilters<T extends BaseEntry>(
  data: T[],
  conditions: FilterCondition[],
  availableFields: any[],
): T[] {
  if (conditions.length === 0) return data;

  return data.filter((item) => {
    return conditions.every((condition) => {
      const fieldConfig = availableFields.find(
        (f) => f.value === condition.field,
      );
      if (!fieldConfig) return true;

      const fieldValue = (item as any)[condition.field];
      if (fieldValue === undefined || fieldValue === null) return false;

      const fieldType = fieldConfig.type;

      // 对于数值类型字段使用数值比较
      if (
        fieldType === 'size' ||
        fieldType === 'number' ||
        fieldType === 'similarity' ||
        fieldType === 'date'
      ) {
        const itemValue = getNumericValue(item, condition.field, fieldType);
        const filterValue =
          typeof condition.value === 'number'
            ? condition.value
            : parseFloat(String(condition.value));

        switch (condition.operator) {
          case OPERATORS.EQUALS:
            return (
              Math.abs(itemValue - filterValue) <
              (fieldType === 'date' ? 86400000 : 0.1)
            ); // 日期容差1天
          case OPERATORS.GREATER_THAN:
            return itemValue > filterValue;
          case OPERATORS.LESS_THAN:
            return itemValue < filterValue;
          case OPERATORS.GREATER_EQUAL:
            return itemValue >= filterValue;
          case OPERATORS.LESS_EQUAL:
            return itemValue <= filterValue;
          default:
            return true;
        }
      }

      // 对于文本类型字段使用字符串比较
      const strValue = String(fieldValue).toLowerCase();
      const filterValue = String(condition.value).toLowerCase();

      switch (condition.operator) {
        case OPERATORS.EQUALS:
          return strValue === filterValue;
        case OPERATORS.CONTAINS:
          return strValue.includes(filterValue);
        case OPERATORS.STARTS_WITH:
          return strValue.startsWith(filterValue);
        case OPERATORS.ENDS_WITH:
          return strValue.endsWith(filterValue);
        default:
          return true;
      }
    });
  });
}

export function FileFilter() {
  const { t } = useTranslation();
  const open = useBoolean();
  const currentTool = useAtomValue(currentToolAtom);
  const [data, setData] = useAtom(currentToolDataAtom);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [currentField, setCurrentField] = useState('');
  const [currentOperator, setCurrentOperator] = useState('');
  const [currentValue, setCurrentValue] = useState('');

  const availableFields = getAvailableFields(currentTool);
  const currentFieldConfig = availableFields.find(
    (f) => f.value === currentField,
  );
  const availableOperators = getAvailableOperators(
    currentFieldConfig?.type || 'text',
  );

  // 保存原始数据
  const handleOpenDialog = () => {
    if (originalData.length === 0) {
      setOriginalData([...data]);
    }
    open.on();
  };

  // 添加筛选条件
  const addCondition = () => {
    if (!currentField || !currentOperator || !currentValue) return;

    const fieldLabel =
      availableFields.find((f) => f.value === currentField)?.label ||
      currentField;
    const operatorLabel =
      availableOperators.find((o) => o.value === currentOperator)?.label ||
      currentOperator;

    let processedValue: string | number = currentValue;
    let displayValue = currentValue;

    // 对特殊字段进行值处理
    if (
      currentFieldConfig?.type === 'similarity' &&
      currentValue in SIMILARITY_LEVELS
    ) {
      processedValue =
        SIMILARITY_LEVELS[currentValue as keyof typeof SIMILARITY_LEVELS];
      displayValue = currentValue;
    } else if (currentFieldConfig?.type === 'number') {
      processedValue = parseFloat(currentValue);
    }

    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: currentField,
      operator: currentOperator,
      value: processedValue,
      label: `${fieldLabel} ${operatorLabel} "${displayValue}"`,
    };

    setConditions((prev) => [...prev, newCondition]);
    setCurrentField('');
    setCurrentOperator('');
    setCurrentValue('');
  };

  // 移除筛选条件
  const removeCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  // 应用筛选
  const applyFilter = () => {
    const sourceData = originalData.length > 0 ? originalData : data;
    const filteredData = applyFilters(sourceData, conditions, availableFields);
    setData(filteredData);
    open.off();
  };

  // 清除所有筛选
  const clearFilters = () => {
    if (originalData.length > 0) {
      setData(originalData);
      setOriginalData([]);
    }
    setConditions([]);
    setCurrentField('');
    setCurrentOperator('');
    setCurrentValue('');
  };

  // 重置筛选
  const resetFilters = () => {
    if (originalData.length > 0) {
      setData(originalData);
    }
    setConditions([]);
  };

  // 渲染输入控件
  const renderValueInput = () => {
    if (!currentFieldConfig) {
      return (
        <Input
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          placeholder={t('Enter value')}
          disabled={!currentOperator}
        />
      );
    }

    switch (currentFieldConfig.type) {
      case 'similarity':
        return (
          <Select value={currentValue} onValueChange={setCurrentValue}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select similarity')} />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(SIMILARITY_LEVELS).map((level) => (
                <SelectItem key={level} value={level}>
                  {t(level as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'size':
        return (
          <Input
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="e.g., 1MB, 500KB"
            disabled={!currentOperator}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder={t('Enter value')}
            disabled={!currentOperator}
          />
        );
      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder={t('Enter value')}
            disabled={!currentOperator}
          />
        );
    }
  };

  return (
    <Dialog open={open.value} onOpenChange={open.set}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-1" />
          {t('Filter')}
          {conditions.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1 text-xs">
              {conditions.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Filter Files')}</DialogTitle>
          <DialogDescription>
            {t(
              'Add conditions to filter the file list based on specific criteria',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 当前筛选条件 */}
          {conditions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('Active Filters')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition) => (
                  <Badge
                    key={condition.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {condition.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 添加新条件 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('Add Filter Condition')}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">{t('Field')}</Label>
                <Select value={currentField} onValueChange={setCurrentField}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select field')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t('Operator')}</Label>
                <Select
                  value={currentOperator}
                  onValueChange={setCurrentOperator}
                  disabled={!currentField}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select operator')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t('Value')}</Label>
                <div className="flex gap-1">
                  {renderValueInput()}
                  <Button
                    size="sm"
                    onClick={addCondition}
                    disabled={
                      !currentField || !currentOperator || !currentValue
                    }
                  >
                    {t('Add')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={clearFilters}>
            {t('Clear All')}
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={resetFilters}>
              {t('Reset')}
            </Button>
            <Button onClick={applyFilter}>{t('Apply Filter')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
