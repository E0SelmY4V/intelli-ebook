import { build } from 'esbuild';

build({
	entryPoints: ['pandoc.ts'],
	bundle: true,
	sourcemap: true,
	minify: true,
	outdir: '../dist',
});

