import Pandoc from './pandoc';

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
	add(fn: () => Promise<void> | void) {
		this.runningNow = this.runningNow.then(fn);
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

	constructor(url: string) {
		addEventListener('message', this.listener);
		const pandoc = new Pandoc(
			fetch(url),
			{
				err: msg => self.postMessage({ type: 'Error', msg } satisfies MsgErr),
				out: out => self.postMessage({ type: 'Out', out } satisfies MsgOut),
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

