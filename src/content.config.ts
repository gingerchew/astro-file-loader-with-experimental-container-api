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

const AstroFileLoader = async ({ base, pattern }: Record<string, string>): Promise<Loader> => {
	const container = await experimental_AstroContainer.create()
	return {
		name: 'astro-file-loader',
		load: async (context) => {

			const fromGlob = import.meta.glob('./content/astro/*.astro');
			
			for (const [id, entry] of Object.entries(fromGlob)) {
				
				const mod = await entry() as {
					default: AstroComponentFactory,
					metadata?: Record<string, unknown>
				};

				const renderedEl = await container.renderToString(mod.default)
				
				context.store.set({
					id,
					data: mod.metadata ?? {},
					rendered: {
						html: renderedEl
					}
					// body: (await entry()) as string
				})
			}
		},
	}
}

const astro = defineCollection({
	loader: await AstroFileLoader({ base: './content/astro', pattern: '*.astro' }),
})

export const collections = { blog, astro };
