import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				// Gzip and brotli the static assets at build time, so a Node server
				// with no reverse proxy in front of it still serves them compressed.
				precompress: true
			}),
			csp: {
				// Hashes the inline scripts SvelteKit emits, so hydration keeps
				// working while an injected <script> does not run.
				directives: {
					'script-src': ['self', 'strict-dynamic', 'https:'],
					'object-src': ['none'],
					'base-uri': ['self'],
					// Product photography is whatever the shop uploaded or imported.
					'img-src': ['self', 'data:', 'https:'],
					'frame-ancestors': ['none']
				}
			},
			typescript: {
				config: (config) => {
					config.include.push('../drizzle.config.ts');
				}
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
