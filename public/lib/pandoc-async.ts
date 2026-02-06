import type Pandoc from './pandoc';
import type { OutListener } from './pandoc';
import type { Listener, MsgReq, MsgUrl } from './pandoc-worker';

declare global {
	const pandocWorkerCode: string;
}

export const workerSource = URL.createObjectURL(new Blob([pandocWorkerCode]));
export interface InitConfig {
	url: URL;
	errListeners?: Iterable<OutListener>;
	outListeners?: Iterable<OutListener>;
}

export default class PandocAsync {
	protected readonly worker: Worker = new Worker(workerSource);
	protected idNow = 0;
	protected readonly tasks = new Map<number, (result: ReturnType<Pandoc['parseSync']>) => void>();
	protected readonly resCatcher: Listener = ({ data }) => {
		if (data.type !== 'Res') return;
		const res = this.tasks.get(data.id);
		if (!res) throw Error('no this task', { cause: data });
		this.tasks.delete(data.id);
		res(data.result);
	};

	readonly errListeners: Set<OutListener>;
	readonly outListeners: Set<OutListener>;
	protected readonly infoCatcher: Listener = ({ data }) => {
		switch (data.type) {
			case 'Error':
				this.errListeners.forEach(fn => fn(data.msg));
				break;
			case 'Out':
				this.outListeners.forEach(fn => fn(data.out));
				break;
		}
	};
	constructor(url: URL);
	constructor(initConfig: InitConfig);
	constructor(
		initConfig: URL | InitConfig,
	) {
		const {
			url,
			errListeners = [],
			outListeners = [],
		} = initConfig instanceof URL ? { url: initConfig } : initConfig;
		this.worker.addEventListener('message', this.resCatcher);
		this.errListeners = new Set(errListeners);
		this.outListeners = new Set(outListeners);
		this.worker.addEventListener('message', this.infoCatcher);
		this.worker.postMessage({ type: 'Url', url: url.toString() } satisfies MsgUrl);
	}
	parse(this: this, ...args: Parameters<Pandoc['parseSync']>) {
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

