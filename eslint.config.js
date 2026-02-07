/**@import { ConfigArray } from 'typescript-eslint'; */
import eslintReact from "@eslint-react/eslint-plugin";
import eslint from '@eslint/js';
import accurtypeStyle from 'eslint-config-accurtype-style';
import { defineConfig } from 'eslint/config';
import { getDirname } from 'esm-entry';
import tseslint from 'typescript-eslint';

/**@type {ConfigArray} */
const config = defineConfig(
	...accurtypeStyle,
	eslint.configs.recommended,
	...tseslint.configs.stylisticTypeChecked,
	eslintReact.configs['recommended-typescript'],
	{
		name: 'TS Base Config',
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: getDirname(import.meta.url),
				project: [
					'tsconfig.json',
					'public/tsconfig.json',
					'ebook/tsconfig.json',
				],
			},
		},
	},
	{
		name: 'Opt Rules',
		rules: {
			'no-unused-vars': 'off',
			'no-undef': 'off',
		},
	},
	{
		name: 'Global Ignore',
		ignores: [
			'**/*.md',
			'.*',
			'eslint.config.js',
			'cz-config.cjs',
			'**/dist',
		],
	},
);

export default config;
