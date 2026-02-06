import { build } from 'esbuild';
import * as fsp from 'node:fs/promises';
import { join, dirname } from 'node:path';

const mjDir = dirname(new URL(import.meta.resolve('mathjax')).pathname);
const distDir = dirname(new URL(import.meta.resolve('./dist/main.js')).pathname);

fsp.cp(join(mjDir, 'tex-chtml.js'), join(distDir, 'tex-chtml.js'));
fsp.cp(join(mjDir, 'sre'), join(distDir, 'sre'), { recursive: true });
build({
	entryPoints: ['src/main.ts'],
	bundle: true,
	sourcemap: true,
	minify: true,
	outdir: 'dist',
	treeShaking: true,
});

