/**
 * 需要用的模块代码打包
 */
declare module './mods';

import * as zOri from 'zod';
import * as PandocTypesOri from './lib/pandoc';
import * as Mods from './mods';

namespace zImported {
	export import object = zOri.object;
	export import tuple = zOri.tuple;
	export import string = zOri.string;
	export import number = zOri.number;
	export import ZodTuple = zOri.ZodTuple;
	export import ZodType = zOri.ZodType;
	export type infer<T> = zOri.infer<T>;
	export type output<T> = zOri.output<T>;
	export type input<T> = zOri.input<T>;
}

declare global {
	namespace globalThis {
		export import mods = Mods;
		export import z = zImported;
		export import Pandoc = Mods.PandocOri;
		export import PandocTypes = PandocTypesOri;
	}
}
export { default as Resumable } from 'resumablejs';
export { default as PandocOri } from './lib/pandoc';

globalThis.mods = Mods;
globalThis.z = zImported;
globalThis.Pandoc = Mods.PandocOri;
globalThis.PandocTypes = PandocTypesOri;


