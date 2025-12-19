import { build } from 'esbuild';

build({
	entryPoints: ['src/main.ts'],
	bundle: true,
	sourcemap: true,
	minify: true,
	outdir: 'dist',
	treeShaking: true,
});

