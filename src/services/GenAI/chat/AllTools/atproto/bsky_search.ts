import { BskyAgent } from "@atproto/api";
import { HandleResolver } from "@atproto/identity";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";
import { agent } from "./libatproto";

async function fetchWithTimeout(url: string, opts?: any) {
	const timeout = 2500;

	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	const response = await fetch(url, {
		...opts,
		signal: controller.signal
	});
	clearTimeout(id);

	if (controller.signal.aborted) {
		throw new Error(`Took too long to fetch ${url} (>${timeout}ms)`);
	}

	return response;
}

const meta: FunctionDeclaration = {
	name: "atproto.search",
	description: "Returns posts from Bluesky based on the query.",
	parameters: {
		required: ["query"],
		type: SchemaType.OBJECT,
		description: "searchBskyPosts parameters",
		properties: {
			query: {
				description: "Text to search for, keep this short (1-3 words)",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	query: "Yaoi PartyBeetle Regretevator"
});

async function func(args: any): Promise<any> {
	if (!args.query) {
		throw new Error(
			"Provide a fucking query, Gemini!"
		);
	}
	// this is fucking stupid because atproto should not force me to write out the ENTIRE FUCKING LEXICON NAME when the users could do agent.searchPosts
	// but they didnt add that wtf
	const {
		data: { posts, cursor }
	} = await agent.app.bsky.feed.searchPosts({
		q: args.query,
		limit: 50,
		sort: "top"
	});

	return {
		cursor,
		posts: posts.map((a) => {
			const blobs: { type: string; alt?: string; url: string }[] = [];
			if ((a.record as any).embed) {
				if (
					(a.record as any).embed.$type ===
					"app.bsky.embed.images"
				) {
					(
						(a.record as any).embed.images as {
							type: string;
							alt: string;
							image: { $type: "blob"; ref: { $link: string } };
						}[]
					).forEach((blob) => {
						blobs.push({
							type: "image",
							alt: blob.alt,
							url: blob.image.ref.$link
						});
					});
				}
			}
			if ((a.record as any).embed) {
				if (
					(a.record as any).embed.$type ===
					"app.bsky.embed.video"
				) {
					const vid = (a.record as any).embed as {
						type: string;
						video: { $type: "blob"; ref: { $link: string } };
					};
					blobs.push({
						type: "video",
						url: vid.video.ref.$link
					});
				}
			}
			return {
				uri: a.uri,
				text: (a.record as any).text,
				// blobs: blobs,
				replyCount: a.replyCount,
				likeCount: a.likeCount,
				repostCount: a.repostCount,
				quoteRepostCount: a.quoteCount,
				author: a.author
			};
		})
	};
	/*
	x.posts.forEach(a=>{
		a.blobs.forEach(y=>console.log(y))
	})
	*/
}

registerTool(func, meta);
