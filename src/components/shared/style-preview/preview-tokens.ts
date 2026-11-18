export type StylePreviewId = 'a' | 'b';

export const isStylePreview = (v?: string): v is StylePreviewId =>
	v === 'a' || v === 'b';

export const previewTokens = (id: StylePreviewId) => {
	if (id === 'a') {
		return {
			id,
			label: 'Soft glass',
			bubbleFill: 'var(--sp-bubble-fill, rgba(95, 182, 173, 0.14))',
			bubbleStroke: 'var(--sp-bubble-stroke, rgba(95, 182, 173, 0.55))',
			bubbleRadius: 18,
			bubbleW: 54,
			bubbleH: 38,
			nameClass: 'sp-name-a',
			powerClass: 'sp-power-a',
			flowCap: 'round',
			flowOpacity: 0.92,
			flowDash: '6 10',
			flowGlow: '0 0 4px rgba(95,182,173,0.35)',
			iconSize: 18,
		};
	}
	return {
		id,
		label: 'Neon rail',
		bubbleFill: 'var(--sp-bubble-fill, rgba(15, 23, 42, 0.35))',
		bubbleStroke: 'var(--sp-bubble-stroke, rgba(34, 211, 238, 0.85))',
		bubbleRadius: 14,
		bubbleW: 50,
		bubbleH: 36,
		nameClass: 'sp-name-b',
		powerClass: 'sp-power-b',
		flowCap: 'square',
		flowOpacity: 1,
		flowDash: '3 7',
		flowGlow: 'none',
		iconSize: 16,
	};
};

export const previewExtraViewWidth = (additionalLoad: number): number => {
	if (additionalLoad >= 8) return 180;
	if (additionalLoad >= 7) return 110;
	if (additionalLoad >= 5) return 60;
	return 0;
};