/**
 * 需要用的模块代码打包
 */
declare module './mods';

import Type from 'typebox';
import * as self from './mods';

import localSelf = self;
import localType = Type;

declare global {
	namespace globalThis {
		export import mods = localSelf;
		export import Type = localType;
	}
}

export { default as Pandoc } from './lib/pandoc';
export { default as Resumable } from 'resumablejs';
export { default as Value } from 'typebox/value';

globalThis.mods = localSelf;
globalThis.Type = localType;


