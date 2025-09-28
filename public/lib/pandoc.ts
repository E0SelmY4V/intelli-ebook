import {
	ConsoleStdout,
	Directory,
	File,
	OpenFile,
	PreopenDirectory,
	wasi,
	WASI,
} from '@bjorn3/browser_wasi_shim';
import PandocImpl from './pandoc';

declare global {
	namespace globalThis {
		export import Pandoc = PandocImpl;
	}
}

class Pandoc {
	protected readonly fileIn = new File(new Uint8Array(), { readonly: true });
	protected readonly fileOut = new File(new Uint8Array(), { readonly: false });
	protected readonly fs = new PreopenDirectory('/', new Map([
		['in', this.fileIn],
		['out', this.fileOut],
	]));
	protected readonly wasi: WASI;
	constructor(
		readonly wasmFile: Response | PromiseLike<Response>,
		{
			err = (msg: string) => console.log(`[WASI stdout] ${msg}`),
			out = (msg: string) => console.log(`[WASI stderr] ${msg}`),
		} = {},
	) {
		this.wasi = new WASI(
			Pandoc.args,
			[],
			[
				new OpenFile(new File(new Uint8Array(), { readonly: true })),
				ConsoleStdout.lineBuffered(out),
				ConsoleStdout.lineBuffered(err),
				this.fs,
			],
			{ debug: false },
		);
	}

	private insObj: null | {
		instance: WebAssembly.Instance;
		getFn(key: string): Function;
		getBuffer(): ArrayBuffer;
		getDataView(): DataView;
	} = null;
	async init() {
		if (this.insObj) return;

		const instance = (await WebAssembly.instantiateStreaming(
			this.wasmFile,
			{ wasi_snapshot_preview1: this.wasi.wasiImport },
		)).instance;

		const getFn = (key: string) => {
			const fn = instance.exports[key];
			if (typeof fn !== 'function') throw Error(key);
			return fn;
		};
		const getBuffer = () => {
			const { memory } = instance.exports;
			if (!(memory instanceof WebAssembly.Memory)) throw Error('memory');
			return memory.buffer;
		};
		const getDataView = () => new DataView(getBuffer());

		// @ts-ignore
		this.wasi.initialize(instance);
		getFn('__wasm_call_ctors')();
		const argcPtr = getFn('malloc')(4);
		getDataView().setUint32(argcPtr, Pandoc.args.length, true);
		const argv = getFn('malloc')(4 * (Pandoc.args.length + 1));
		for (let i = 0; i < Pandoc.args.length; ++i) {
			const arg = getFn('malloc')(Pandoc.args[i].length + 1);
			new TextEncoder().encodeInto(
				Pandoc.args[i],
				new Uint8Array(getBuffer(), arg, Pandoc.args[i].length),
			);
			getDataView().setUint8(arg + Pandoc.args[i].length, 0);
			getDataView().setUint32(argv + 4 * i, arg, true);
		}
		getDataView().setUint32(argv + 4 * Pandoc.args.length, 0, true);
		const argvPtr = getFn('malloc')(4);
		getDataView().setUint32(argvPtr, argv, true);
		getFn('hs_init_with_rtsopts')(argcPtr, argvPtr);

		this.insObj = { instance, getFn, getBuffer, getDataView };
	}

	protected getMedia(mediaFolder: string): Map<string, Uint8Array> {
		const { ret, inode_obj: mediaNode } = this.fs.path_lookup(mediaFolder, 0);
		if (ret !== wasi.ERRNO_SUCCESS || !(mediaNode instanceof Directory)) throw Error(mediaFolder);
		const medias = new Map<string, Uint8Array>();
		for (const [name, file] of mediaNode.contents.entries()) {
			if (!(file instanceof File)) throw Error(name);
			medias.set(name, file.data);
		}
		mediaNode.contents.clear();
		return medias;
	}

	parseSync(argsStr: string, input: string | Uint8Array<ArrayBufferLike>, mediaFolder = 'media') {
		const { getFn, getBuffer } = this.insObj ?? (() => { throw Error('Not inited'); })();
		const argsPtr = getFn('malloc')(argsStr.length);
		new TextEncoder().encodeInto(
			argsStr,
			new Uint8Array(getBuffer(), argsPtr, argsStr.length),
		);
		this.fileIn.data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
		getFn('wasm_main')(argsPtr, argsStr.length);
		const data = this.fileOut.data;
		this.fileOut.data = new Uint8Array();
		this.fileIn.data = new Uint8Array();
		const medias = this.getMedia(mediaFolder);
		return { data, medias };
	}

	async parse(...arg: Parameters<Pandoc['parseSync']>) {
		await this.init();
		return this.parseSync(...arg);
	}
}
namespace Pandoc {
	export const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
}
export default Pandoc;

globalThis.Pandoc = Pandoc;

