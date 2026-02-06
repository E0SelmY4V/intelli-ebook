import Pandoc, { OutListener } from './pandoc';

export interface MsgErr {
	type: 'Error';
	msg: string;
}
export interface MsgOut {
	type: 'Out';
	out: string;
}
export interface MsgUrl {
	type: 'Url';
	url: string;
}
export interface MsgReq {
	type: 'Req';
	id: number;
	args: Parameters<Pandoc['parseSync']>;
}
export interface MsgRes {
	type: 'Res';
	id: number;
	result: ReturnType<Pandoc['parseSync']>;
}
export type Msg
	= MsgErr
	| MsgOut
	| MsgUrl
	| MsgReq
	| MsgRes;
export type Listener = (ev: MessageEvent<Msg>) => void;

class Queue {
	protected runningNow = Promise.resolve();
	add(this: this, fn: () => Promise<void> | void) {
		this.runningNow = this.runningNow.then(fn);
	}
}

class Accer {
	readonly listeners: Set<OutListener>;
	constructor(listeners: Iterable<OutListener>) {
		this.listeners = new Set(listeners);
	}

	protected timer: ReturnType<typeof setTimeout> | null = null;
	protected acced: string[] = [];
	protected emit(this: this) {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		const info = this.acced.join('\n');
		this.acced = [];
		this.listeners.forEach(fn => fn(info));
	};
	push(this: this, n: string) {
		this.acced.push(n);
		this.timer ??= setTimeout(() => this.emit());
	}
}

export default class PandocWorker {
	protected readonly pandocPromise: Promise<Pandoc>;
	protected readonly queue = new Queue();
	protected readonly listener: Listener = ({ data }) => {
		if (data.type !== 'Req') return;
		this.queue.add(async () => {
			const pandoc = await this.pandocPromise;
			const result = pandoc.parseSync(...data.args);
			self.postMessage(
				{ type: 'Res', result, id: data.id } satisfies MsgRes,
				{ transfer: [result.data.buffer, ...result.medias.map(n => n.stream())] },
			);
		});
	};

	protected readonly errAccer = new Accer([
		msg => self.postMessage({ type: 'Error', msg } satisfies MsgErr),
	]);
	protected readonly outAccer = new Accer([
		out => self.postMessage({ type: 'Out', out } satisfies MsgOut),
	]);

	constructor(url: string) {
		addEventListener('message', this.listener);
		const pandoc = new Pandoc(
			fetch(url),
			{
				err: err => this.errAccer.push(err),
				out: out => this.outAccer.push(out),
			},
		);
		this.pandocPromise = pandoc.init().then(() => pandoc);
	}
}

function getUrl(): Promise<string> {
	return new Promise<string>(res => {
		const urlGetter: Listener = ({ data }) => {
			if (data.type !== 'Url') return;
			removeEventListener('message', urlGetter);
			res(data.url);
		};
		addEventListener('message', urlGetter);
	});
}

getUrl().then(url => new PandocWorker(url));

