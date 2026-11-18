import { svg } from 'lit';
import { sunsynkPowerFlowCardConfig } from '../../../types';
import { DataDto } from '../../../types';
import { Utils } from '../../../helpers/utils';
import { createTextWithPopup } from '../../../helpers/text-utils';
import { renderIcon } from '../../../helpers/render-icon';
import { StylePreviewId, previewTokens } from './preview-tokens';
import { previewColX, previewRowY } from './preview-layout';

type LoadIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const loadField = (
	loadIndex: LoadIndex,
	data: DataDto,
	config: sunsynkPowerFlowCardConfig,
) => {
	const names = {
		1: config.load.load1_name,
		2: config.load.load2_name,
		3: config.load.load3_name,
		4: config.load.load4_name,
		5: config.load.load5_name,
		6: config.load.load6_name,
		7: config.load.load7_name,
		8: config.load.load8_name,
	};
	const switches = {
		1: config.load.load1_switch,
		2: config.load.load2_switch,
		3: config.load.load3_switch,
		4: config.load.load4_switch,
		5: config.load.load5_switch,
		6: config.load.load6_switch,
		7: config.load.load7_switch,
		8: config.load.load8_switch,
	};
	const colours = {
		1: data.dynamicColourEssentialLoad1,
		2: data.dynamicColourEssentialLoad2,
		3: data.dynamicColourEssentialLoad3,
		4: data.dynamicColourEssentialLoad4,
		5: data.dynamicColourEssentialLoad5,
		6: data.dynamicColourEssentialLoad6,
		7: data.dynamicColourEssentialLoad7,
		8: data.dynamicColourEssentialLoad8,
	};
	const icons = {
		1: data.iconEssentialLoad1,
		2: data.iconEssentialLoad2,
		3: data.iconEssentialLoad3,
		4: data.iconEssentialLoad4,
		5: data.iconEssentialLoad5,
		6: data.iconEssentialLoad6,
		7: data.iconEssentialLoad7,
		8: data.iconEssentialLoad8,
	};
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
	const entities = {
		1: 'essential_load1',
		2: 'essential_load2',
		3: 'essential_load3',
		4: 'essential_load4',
		5: 'essential_load5',
		6: 'essential_load6',
		7: 'essential_load7',
		8: 'essential_load8',
	} as const;

	return {
		name: names[loadIndex],
		switch: switches[loadIndex],
		colour: colours[loadIndex],
		icon: icons[loadIndex],
		state: states[loadIndex],
		entity: entities[loadIndex],
	};
};

export const renderEssentialBubble = (
	loadIndex: LoadIndex,
	col: number,
	row: number,
	compact: boolean,
	data: DataDto,
	config: sunsynkPowerFlowCardConfig,
	preview: StylePreviewId,
) => {
	const { additionalLoad, auto_scale, decimalPlaces } = {
		additionalLoad: data.additionalLoad,
		auto_scale: config.load.auto_scale,
		decimalPlaces: data.decimalPlaces,
	};
	if (loadIndex > additionalLoad) {
		return svg``;
	}

	const t = previewTokens(preview);
	const x = previewColX(compact, col);
	const y = previewRowY(compact, row);
	const f = loadField(loadIndex, data, config);
	const power =
		f.state?.toPowerString(auto_scale, decimalPlaces) ?? `${0} W`;
	const shortName =
		f.name && f.name.length > 11 ? `${f.name.slice(0, 10)}…` : f.name;

	return svg`<g id="sp-bubble-${loadIndex}" class="sp-bubble">
		<rect
			x="${x}"
			y="${y}"
			width="${t.bubbleW}"
			height="${t.bubbleH}"
			rx="${t.bubbleRadius}"
			ry="${t.bubbleRadius}"
			fill="${t.bubbleFill}"
			stroke="${f.colour}"
			stroke-width="1.2"
			style="filter: ${t.flowGlow}"
			pointer-events="all"
		/>
		${renderIcon(
			f.switch,
			f.icon,
			`essload${loadIndex}-small-icon`,
			x + 4,
			y + (t.bubbleH - t.iconSize) / 2,
			t.iconSize,
			t.iconSize,
			true,
			true,
		)}
		${createTextWithPopup(
			`sp-power-${loadIndex}`,
			x + t.iconSize + 14,
			y + 15,
			!!f.state?.isValid(),
			`st3 st8 ${t.powerClass}`,
			f.colour,
			power,
			(e) => Utils.handlePopup(e, config.entities[f.entity]),
		)}
		<text
			x="${x + t.iconSize + 14}"
			y="${y + 30}"
			class="st3 st8 left-align ${t.nameClass}"
			fill="${f.colour}"
		>
			${shortName}
		</text>
	</g>`;
};