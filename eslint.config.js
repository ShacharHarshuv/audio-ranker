import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{
		ignores: [
			'.history/',
			'.svelte-kit/',
			'build/',
			'dist/',
			'coverage/',
			'eslint.config.js',
			'svelte.config.js'
		]
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/require-each-key': 'off',
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"VariableDeclarator[id.type='ObjectPattern'][init.type='CallExpression'][init.callee.name='$props']:not([id.typeAnnotation])",
					message:
						'Destructured $props() must be explicitly typed (e.g. `let { ... }: Props = $props()`).'
				}
			]
		}
	}
);
