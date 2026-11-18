/** 4×2 essential load grid (loads 1–8) used when additional_loads ≥ 5. */

export const COMPACT_LOAD_COL_X = [405, 441, 477, 513] as const;
export const COMPACT_LOAD_ROW_Y = [107, 290] as const;
export const FULL_LOAD_COL_X = [376, 413, 450, 487] as const;
export const FULL_LOAD_ROW_Y = [30, 149] as const;

/** Logical slot order: top row L1,L2,L5,L7 — bottom row L3,L4,L6,L8 */
export const EXTENDED_LOAD_SLOTS: ReadonlyArray<{
	load: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
	col: 0 | 1 | 2 | 3;
	row: 0 | 1;
}> = [
	{ load: 1, col: 0, row: 0 },
	{ load: 2, col: 1, row: 0 },
	{ load: 5, col: 2, row: 0 },
	{ load: 7, col: 3, row: 0 },
	{ load: 3, col: 0, row: 1 },
	{ load: 4, col: 1, row: 1 },
	{ load: 6, col: 2, row: 1 },
	{ load: 8, col: 3, row: 1 },
];

import { isStylePreview, previewExtraViewWidth } from '../style-preview/preview-tokens';

export const extraEssentialLoadViewWidth = (
	additionalLoad: number,
	stylePreview?: string,
): number => {
	if (isStylePreview(stylePreview)) {
		return previewExtraViewWidth(additionalLoad);
	}
	if (additionalLoad >= 8) return 88;
	if (additionalLoad >= 7) return 56;
	if (additionalLoad >= 5) return 24;
	return 0;
};
