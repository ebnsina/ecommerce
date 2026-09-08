import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',

			// Two idioms this codebase uses on purpose: `_` for a binding that
			// exists only to be skipped ({#each} indices, positional discards), and
			// `const { key, ...rest } = obj` to drop a key. Both read as unused to
			// the rule and are the clearest way to write what they do.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					ignoreRestSiblings: true
				}
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			/**
			 * Off, deliberately.
			 *
			 * The rule wants every href and goto wrapped in `resolve()` so links
			 * survive being served under a base path. This app is not: it is
			 * adapter-node at the root of its own domain, and the one prefix it
			 * does have — the shop at /demo — is already centralised in
			 * $lib/paths.ts, which is the thing that would need to change if it
			 * moved again.
			 *
			 * So the rule costs a wrapper on a hundred-odd links and buys nothing
			 * today. Turn it back on the day `kit.paths.base` is set in
			 * vite.config.ts, and fix the links then — that is the change that
			 * makes it real.
			 */
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
