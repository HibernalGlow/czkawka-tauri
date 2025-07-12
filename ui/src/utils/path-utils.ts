import type { Settings } from '~/types';

/**
 * 根据文件路径获取对应的目录编号
 * @param filePath 文件的完整路径
 * @param settings 应用设置
 * @returns 路径编号，如果没有匹配的目录则返回 null
 */
export function getPathNumber(filePath: string, settings: Settings): number | null {
  // 找到最长匹配的目录路径
  let matchedIndex = -1;
  let maxMatchLength = 0;
  
  for (let i = 0; i < settings.includedDirectories.length; i++) {
    const directory = settings.includedDirectories[i];
    // 标准化路径分隔符
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    const normalizedDirectory = directory.replace(/\\/g, '/');
    
    // 确保目录路径以 / 结尾，避免部分匹配问题
    const dirWithSlash = normalizedDirectory.endsWith('/') 
      ? normalizedDirectory 
      : normalizedDirectory + '/';
    
    if (normalizedFilePath.startsWith(dirWithSlash) || normalizedFilePath === normalizedDirectory) {
      if (normalizedDirectory.length > maxMatchLength) {
        maxMatchLength = normalizedDirectory.length;
        matchedIndex = i;
      }
    }
  }
  
  return matchedIndex >= 0 ? matchedIndex + 1 : null; // 编号从1开始
}

/**
 * 获取路径编号的显示文本
 * @param pathNumber 路径编号
 * @returns 格式化的编号文本
 */
export function getPathNumberDisplay(pathNumber: number | null): string {
  return pathNumber ? `#${pathNumber}` : '';
}

/**
 * 根据编号获取对应的目录路径
 * @param pathNumber 路径编号
 * @param settings 应用设置
 * @returns 目录路径，如果编号无效则返回 null
 */
export function getDirectoryByNumber(pathNumber: number, settings: Settings): string | null {
  const index = pathNumber - 1; // 编号从1开始，数组从0开始
  if (index >= 0 && index < settings.includedDirectories.length) {
    return settings.includedDirectories[index];
  }
  return null;
}
