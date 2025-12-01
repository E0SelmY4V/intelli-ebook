import { build } from 'esbuild';

build({
	entryPoints: ['mods.ts'],
	bundle: true,
	sourcemap: true,
	minify: true,
	outdir: 'dist',
	treeShaking: true,
});

build({
	entryPoints: ['common.ts'],
	outdir: 'dist',
	format: 'esm',
	minifySyntax: true,
	minifyWhitespace: true,
});

