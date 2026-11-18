import { svg } from 'lit';
import { StylePreviewId, previewTokens } from './preview-tokens';

/** Rounded quadratic branch from hub to each load bubble. */
export const renderPreviewBranch = (
	id: string,
	hubX: number,
	hubY: number,
	targetX: number,
	targetY: number,
	display: boolean,
	colour: string,
	lineWidth: number,
	powerW: number,
	preview: StylePreviewId,
	disableAnimations: boolean,
) => {
	if (!display) {
		return svg``;
	}
	const t = previewTokens(preview);
	const midX = (hubX + targetX) / 2;
	const d = `M ${hubX} ${hubY} Q ${midX} ${hubY} ${targetX} ${targetY}`;
	const speed = Math.min(4, Math.max(1.2, Math.abs(powerW) / 1200));
	const dur = `${speed}s`;

	return svg`
		<path
			id="${id}"
			d="${d}"
			fill="none"
			stroke="${colour}"
			stroke-width="${lineWidth}"
			stroke-linecap="${t.flowCap}"
			stroke-opacity="${t.flowOpacity}"
			stroke-dasharray="${t.flowDash}"
			pointer-events="none"
		>
			${
				disableAnimations
					? ''
					: svg`<animate
							attributeName="stroke-dashoffset"
							from="0"
							to="-26"
							dur="${dur}"
							repeatCount="indefinite"
						/>`
			}
		</path>
	`;
};