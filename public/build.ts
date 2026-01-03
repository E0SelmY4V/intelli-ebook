import { build } from 'esbuild';
import * as fsp from 'node:fs/promises';
import postcss from 'postcss';
import Prefixwrap from 'postcss-prefixwrap';

async function typoStyle() {
	const oriCss = await fsp.readFile('lib/typo/typo.css');
	const scpoed = (await postcss()
		.use(Prefixwrap('.typobox'))
		.process(oriCss)
		.async())
		.css;
	await fsp.writeFile('dist/typo.css', scpoed);
}
async function commonScript() {
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
	await build({
		entryPoints: ['mods.ts'],
		bundle: true,
		sourcemap: true,
		minify: true,
		outfile: 'dist/common.js',
		treeShaking: true,
		banner: { js: baseCommonCode },
		footer: { js: commonCode },
	});
}

await Promise.all([
	commonScript(),
	typoStyle(),
]);

