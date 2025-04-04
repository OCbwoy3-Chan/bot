import { AtUri } from "@atproto/api";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";

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
	name: "atproto.get_record",
	description:
		"Retrieves raw Bluesky record data using the AT Protocol. This can be for posts, profiles, etc.",
	parameters: {
		required: ["uri"],
		type: SchemaType.OBJECT,
		description: "getAtprotoRecord parameters",
		properties: {
			uri: {
				description: "The record's URI (e.g., at://did:plc:...).",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	uri: "at://did:plc:s7cesz7cr6ybltaryy4meb6y/app.bsky.feed.post/3lguftq3iqc2n"
});

async function getPdsFromDid(did: string): Promise<string> {
	const didDoc = await fetchWithTimeout(`https://plc.directory/${did}`);
	const json = await didDoc.json();
	return (
		json.service.find((s: any) => s.id === "#atproto_pds")
			?.serviceEndpoint || ""
	);
}

async function func(args: any): Promise<any> {
	const uri = new AtUri(args.uri as string);
	const pds = await getPdsFromDid(uri.host);
	// console.log(`${pds}/xrpc/com.atproto.repo.getRecord?repo=${uri.host}&collection=${uri.collection}&rkey=${uri.rkey}`)
	// atproto get record no auth required hack
	const data = await fetchWithTimeout(
		`${pds}/xrpc/com.atproto.repo.getRecord?repo=${uri.host}&collection=${uri.collection}&rkey=${uri.rkey}`,
		{
			headers: {
				"Content-Type": "application/json"
			}
		}
	);
	return await data.json();
}

// func({uri: "at://did:plc:s7cesz7cr6ybltaryy4meb6y/app.bsky.feed.post/3lguftq3iqc2n"}).then(a=>console.log(a));

registerTool(func, meta);
