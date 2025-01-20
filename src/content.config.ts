import { glob } from 'astro/loaders';
import { experimental_AstroContainer } from 'astro/container';
import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

interface Module {
	default: AstroComponentFactory,
	metadata?: Record<string, unknown>
}

type GlobResult = Record<string, () => Promise<Module>>

const AstroFileLoader = async (globResult: GlobResult): Promise<Loader> => {
	const container = await experimental_AstroContainer.create()
	return {
		name: 'astro-file-loader',
		load: async ({ store, generateDigest }) => {
			for (const [id, entry] of Object.entries(globResult)) {
				
				const mod = await entry();

				const renderedEl = await container.renderToString(mod.default)
				const digest = generateDigest({
					id,
					data: mod.metadata ?? {},
					rendered: {
						html: renderedEl,
					},
				})

				store.set({
					id,
					data: mod.metadata ?? {},
					rendered: {
						html: renderedEl
					},
					digest
				})
			}
		},
	}
}

const astro = defineCollection({
	loader: await AstroFileLoader(import.meta.glob('./components/*.astro') as unknown as GlobResult),
})

export const collections = { blog, astro };
