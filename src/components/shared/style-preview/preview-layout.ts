import { EXTENDED_LOAD_SLOTS } from '../load/extended-load-layout';

export const PREVIEW_COMPACT_COL_X = [382, 442, 502, 562] as const;
export const PREVIEW_COMPACT_ROW_Y = [95, 278] as const;
/** Wider than legacy FULL_LOAD_COL_X so 54px bubbles do not overlap. */
export const PREVIEW_FULL_COL_X = [360, 425, 490, 555] as const;
export const PREVIEW_FULL_ROW_Y = [28, 146] as const;

export const previewColX = (compact: boolean, col: number) =>
	(compact ? PREVIEW_COMPACT_COL_X : PREVIEW_FULL_COL_X)[col];
export const previewRowY = (compact: boolean, row: number) =>
	(compact ? PREVIEW_COMPACT_ROW_Y : PREVIEW_FULL_ROW_Y)[row];

export const visiblePreviewSlots = (additionalLoad: number) =>
	EXTENDED_LOAD_SLOTS.filter((s) => s.load <= additionalLoad);

export const bubbleCenter = (
	compact: boolean,
	col: number,
	row: number,
	bubbleW: number,
	bubbleH: number,
) => ({
	x: previewColX(compact, col) + bubbleW / 2,
	y: previewRowY(compact, row) + bubbleH / 2,
});

export const previewHub = (compact: boolean) =>
	compact ? { x: 360, y: 218 } : { x: 330, y: 112 };