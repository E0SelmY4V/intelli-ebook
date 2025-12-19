import { build } from 'esbuild';
import * as fsp from 'node:fs/promises';

await build({
	entryPoints: ['common.ts', 'base-common.ts'],
	outdir: 'dist',
	format: 'esm',
	minifySyntax: true,
	minifyWhitespace: true,
	banner: { js: '"use strict";' },
});
const [baseCommonCode, commonCode] = (await Promise.all([
	fsp.readFile('dist/base-common.js'),
	fsp.readFile('dist/common.js'),
])).map(String);
build({
	entryPoints: ['mods.ts'],
	bundle: true,
	sourcemap: true,
	minify: true,
	outfile: 'dist/common.js',
	treeShaking: true,
	banner: { js: baseCommonCode },
	footer: { js: commonCode },
});

