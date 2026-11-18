// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/return-json.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
export default {
	async fetch(request): Promise<Response> {
		const data = {
			hello: "world",
		};

		return Response.json(data);
	},
} satisfies ExportedHandler;
