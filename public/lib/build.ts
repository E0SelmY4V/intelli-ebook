import { build } from 'esbuild';

build({
	entryPoints: ['test.ts'],
	bundle: true,
	sourcemap: true,
	minify: true,
	outdir: '../dist',
});

