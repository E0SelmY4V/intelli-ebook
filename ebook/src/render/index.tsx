import { createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { Serialized } from '../storage';
import ShowBody from './ShowBody';

/**图片文件的位置 */
export const imgFolder = '/api/upload/files/';

export class MathJaxRenderer {
	constructor(
		readonly timeMs = 0,
		readonly groupSize = 10,
	) { }

	protected queue = Promise.resolve();
	protected async render(this: this, group: readonly HTMLElement[]) {
		// @ts-ignore
		await MathJax.startup.promise;
		// @ts-ignore
		MathJax.typeset(group);
		await timeout(this.timeMs);
	}
	add(this: this, eles: readonly HTMLElement[]) {
		let fromIdx = 0;
		while (fromIdx < eles.length) {
			const toIdx = fromIdx + this.groupSize;
			const group = eles.slice(fromIdx, toIdx);
			this.queue = this.queue.then(() => this.render(group));
			fromIdx = toIdx;
		}
	}
}

export const MathJaxRendererContext = createContext(new MathJaxRenderer());

export default function render(box: HTMLElement, serialized: Serialized, mathJaxRenderer?: MathJaxRenderer) {
	const showBody = <ShowBody serialized={serialized} hidden={false} />;
	createRoot(box).render(
		mathJaxRenderer
			? <MathJaxRendererContext value={mathJaxRenderer}>{showBody}</MathJaxRendererContext>
			: showBody,
	);
}

