import { ExplorerItem, File, FilePath } from '@sd/core';

export function isPath(item: ExplorerItem): item is Extract<ExplorerItem, { type: 'Path' }> {
	return item.type === 'Path';
}

export function isObject(item: ExplorerItem): item is Extract<ExplorerItem, { type: 'Object' }> {
	return item.type === 'Object';
}
