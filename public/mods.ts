/**
 * 需要用的模块代码打包
 */
declare module './mods';

import * as TypeOri from 'typebox';
import * as ValueOri from 'typebox/value';
import * as Mods from './mods';

namespace TypeImported {
	export import Object = TypeOri.Object;
	export import String = TypeOri.String;
	export import Number = TypeOri.Number;
	export import Tuple = TypeOri.Tuple;
}

namespace ValueImported {
	export import Check = ValueOri.Check;
}

declare global {
	namespace globalThis {
		export import mods = Mods;
		export import Type = TypeImported;
		export import Value = ValueImported;
		export import TSchema = TypeOri.TSchema;
		export import Static = TypeOri.Static;

	}
}
export { default as Resumable } from 'resumablejs';
export { default as Pandoc } from './lib/pandoc';

globalThis.mods = Mods;
globalThis.Type = TypeImported;
globalThis.Value = ValueImported;


