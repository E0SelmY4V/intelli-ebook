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
		export import Pandoc = Mods.PandocOri;
		export import PandocTypes = PandocTypesOri;
	}
}
export { default as Resumable } from 'resumablejs';
export { default as PandocOri } from './lib/pandoc';

globalThis.mods = Mods;
globalThis.z = zOri;
globalThis.Pandoc = Mods.PandocOri;
globalThis.PandocTypes = PandocTypesOri;


