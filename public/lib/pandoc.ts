import {
	WASI,
	OpenFile,
	File,
	ConsoleStdout,
	PreopenDirectory,
} from '@bjorn3/browser_wasi_shim';
import pandocImpl from './pandoc';

declare global {
	namespace globalThis {
		export import getPandoc = pandocImpl;
	}
}

async function getPandoc(wasmFile: Response | PromiseLike<Response>) {
	const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
	const fileIn = new File(new Uint8Array(), { readonly: true });
	const fileOut = new File(new Uint8Array(), { readonly: false });
	const wasi = new WASI(
		args,
		[],
		[
			new OpenFile(new File(new Uint8Array(), { readonly: true })),
			ConsoleStdout.lineBuffered(msg => console.log(`[WASI stdout] ${msg}`)),
			ConsoleStdout.lineBuffered(msg => console.warn(`[WASI stderr] ${msg}`)),
			new PreopenDirectory('/', new Map([
				['in', fileIn],
				['out', fileOut],
			])),
		],
		{ debug: false },
	);
	const { instance } = await WebAssembly.instantiateStreaming(
		wasmFile,
		{ wasi_snapshot_preview1: wasi.wasiImport },
	);

	const getFn = (key: string) => {
		const fn = instance.exports[key];
		if (typeof fn !== 'function') throw Error();
		return fn;
	};
	const getBuffer = () => {
		const { memory } = instance.exports;
		if (!(memory instanceof WebAssembly.Memory)) throw Error();
		return memory.buffer;
	};
	const getDataView = () => new DataView(getBuffer());

	// @ts-ignore
	wasi.initialize(instance);
	getFn('__wasm_call_ctors')();
	const argcPtr = getFn('malloc')(4);
	getDataView().setUint32(argcPtr, args.length, true);
	const argv = getFn('malloc')(4 * (args.length + 1));
	for (let i = 0; i < args.length; ++i) {
		const arg = getFn('malloc')(args[i].length + 1);
		new TextEncoder().encodeInto(
			args[i],
			new Uint8Array(getBuffer(), arg, args[i].length),
		);
		getDataView().setUint8(arg + args[i].length, 0);
		getDataView().setUint32(argv + 4 * i, arg, true);
	}
	getDataView().setUint32(argv + 4 * args.length, 0, true);
	const argvPtr = getFn('malloc')(4);
	getDataView().setUint32(argvPtr, argv, true);
	getFn('hs_init_with_rtsopts')(argcPtr, argvPtr);

	return (argsStr: string, input: string | Uint8Array<ArrayBufferLike>) => {
		const argsPtr = getFn('malloc')(argsStr.length);
		new TextEncoder().encodeInto(
			argsStr,
			new Uint8Array(getBuffer(), argsPtr, argsStr.length),
		);
		fileIn.data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
		getFn('wasm_main')(argsPtr, argsStr.length);
		return new TextDecoder('utf-8', { fatal: true }).decode(fileOut.data);
	};
}
namespace getPandoc {
	export const one = 1;
}
export default getPandoc;

globalThis.getPandoc = getPandoc;

