/**
 * 需要用的模块代码打包
 */
declare module './mods';

import * as zOri from 'zod';
import * as PandocTypesOri from './lib/pandoc-type';
import * as Mods from './mods';

declare global {
	namespace globalThis {
		export import mods = Mods;
		export import z = zOri;
		export import PandocAsync = Mods.PandocAsyncOri;
		export import PandocTypes = PandocTypesOri;
	}
}
export { default as Resumable } from 'resumablejs';
export { default as PandocAsyncOri } from './lib/pandoc-async';

globalThis.mods = Mods;
globalThis.z = zOri;
globalThis.PandocAsync = Mods.PandocAsyncOri;
globalThis.PandocTypes = PandocTypesOri;


