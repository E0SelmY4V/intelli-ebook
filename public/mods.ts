import * as self from './mods';

import localSelf = self;

declare global {
	namespace globalThis {
		export import mods = localSelf;
	}
}

export { default as Pandoc } from './lib/pandoc';
export { default as Resumable } from 'resumablejs';

globalThis.mods = localSelf;


