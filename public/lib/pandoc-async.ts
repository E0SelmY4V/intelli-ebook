import type Pandoc from './pandoc';
import type { Listener, MsgReq, MsgUrl } from './pandoc-worker';

declare global {
	const pandocWorkerCode: string;
}

export default class PandocAsync {
	protected readonly worker: Worker = new Worker(URL.createObjectURL(new Blob([pandocWorkerCode])));
	protected idNow = 0;
	protected readonly tasks = new Map<number, (result: ReturnType<Pandoc['parseSync']>) => void>();
	protected readonly listener: Listener = ({ data }) => {
		if (data.type !== 'Res') return;
		const res = this.tasks.get(data.id);
		if (!res) throw Error('no this task', { cause: data });
		this.tasks.delete(data.id);
		res(data.result);
	};
	constructor(url: URL) {
		this.worker.postMessage({ type: 'Url', url: url.toString() } satisfies MsgUrl);
		this.worker.addEventListener('message', this.listener);
	}
	parse(...args: Parameters<Pandoc['parseSync']>) {
		const id = ++this.idNow;
		const { promise, resolve } = Promise.withResolvers<ReturnType<Pandoc['parseSync']>>();
		this.tasks.set(id, resolve);
		this.worker.postMessage(
			{ type: 'Req', id, args } satisfies MsgReq,
			typeof args[1] === 'string' ? [] : [args[1].buffer],
		);
		return promise;
	}
}

