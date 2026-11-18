import { svg } from 'lit';
import { DataDto, sunsynkPowerFlowCardConfig } from '../../../types';
import { StylePreviewId } from './preview-tokens';
import {
	bubbleCenter,
	previewHub,
	visiblePreviewSlots,
} from './preview-layout';
import { previewTokens } from './preview-tokens';
import { renderEssentialBubble } from './render-essential-bubble';
import { renderPreviewBranch } from './render-preview-flow';

const loadColourFor = (load: number, data: DataDto): string => {
	const map: Record<number, string> = {
		1: data.dynamicColourEssentialLoad1,
		2: data.dynamicColourEssentialLoad2,
		3: data.dynamicColourEssentialLoad3,
		4: data.dynamicColourEssentialLoad4,
		5: data.dynamicColourEssentialLoad5,
		6: data.dynamicColourEssentialLoad6,
		7: data.dynamicColourEssentialLoad7,
		8: data.dynamicColourEssentialLoad8,
	};
	return map[load] ?? data.loadColour;
};

const loadStateW = (load: number, data: DataDto): number => {
	const states = {
		1: data.stateEssentialLoad1,
		2: data.stateEssentialLoad2,
		3: data.stateEssentialLoad3,
		4: data.stateEssentialLoad4,
		5: data.stateEssentialLoad5,
		6: data.stateEssentialLoad6,
		7: data.stateEssentialLoad7,
		8: data.stateEssentialLoad8,
	};
	return states[load]?.toPower?.(false) ?? 0;
};

export const renderEssentialLoadPreview = (
	data: DataDto,
	config: sunsynkPowerFlowCardConfig,
	preview: StylePreviewId,
	compact: boolean,
) => {
	if (!data || typeof data.additionalLoad !== 'number') {
		return svg``;
	}
	const t = previewTokens(preview);
	const hub = previewHub(compact);
	const slots = visiblePreviewSlots(data.additionalLoad);
	const branches = slots.map((slot) => {
		const center = bubbleCenter(
			compact,
			slot.col,
			slot.row,
			t.bubbleW,
			t.bubbleH,
		);
		const lw = Math.max(
			data.minLineWidth,
			Math.min(
				config.max_line_width ?? 4,
				1 + Math.abs(loadStateW(slot.load, data)) / 2000,
			),
		);
		return renderPreviewBranch(
			`sp-flow-${slot.load}`,
			hub.x,
			hub.y,
			center.x,
			center.y,
			true,
			loadColourFor(slot.load, data),
			lw,
			loadStateW(slot.load, data),
			preview,
			!!config.disable_animations,
		);
	});

	const bubbles = slots.map((slot) =>
		renderEssentialBubble(
			slot.load,
			slot.col,
			slot.row,
			compact,
			data,
			config,
			preview,
		),
	);

	return svg`<g id="essential-load-preview" class="sp-load-layer">
		${branches}
		${bubbles}
	</g>`;
};