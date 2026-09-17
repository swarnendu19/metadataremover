// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://metadataremovertool.com',
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'es', 'ja', 'fr', 'de', 'pt', 'ko', 'it', 'id'],
		routing: { prefixDefaultLocale: false },
	},
	build: { inlineStylesheets: 'always' },
	vite: { plugins: [tailwindcss()] },
});
