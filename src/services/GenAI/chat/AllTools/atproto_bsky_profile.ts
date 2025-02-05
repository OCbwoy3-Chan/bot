import { BskyAgent } from "@atproto/api";
import { HandleResolver } from "@atproto/identity";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";

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
	name: "getBskyProfile",
	description:
		"Turns a DID or a handle into a Bluesky profile with the DID, Handle, Name, Description and PDS",
	parameters: {
		required: ["didOrHandle"],
		type: SchemaType.OBJECT,
		description: "getBskyProfile parameters",
		properties: {
			didOrHandle: {
				description: "The user's DID or handle",
				type: SchemaType.STRING,
			},
		},
	},
};

addTest(meta.name,{
	didOrHandle: "ocbwoy3.dev"
});

async function func(args: any): Promise<any> {
	let did = args.didOrHandle as string;

	if (!did.startsWith("did:")) {
		const hdlres = new HandleResolver({});
		did = (await hdlres.resolve(did)) || (args.didOrHandle as string);
	}

	const didDoc = await fetchWithTimeout(`https://plc.directory/${did}`);
	const didDocJson = await didDoc.json();
	const service = didDocJson.service.find(
		(s: any) =>
			s.id === "#atproto_pds" && s.type === "AtprotoPersonalDataServer"
	);

	if (!service) {
		throw new Error(
			"Cannot find #atproto_pds with type AtprotoPersonalDataServer in user's did doc"
		);
	}

	const pds = service.serviceEndpoint;

	// atproto get record no auth required hack
	const record = await fetchWithTimeout(`${pds}/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=app.bsky.actor.profile&rkey=self`,{
		headers: {
			'Content-Type': 'application/json',
		}
	});

	return await record.json();
}

registerTool(func, meta);
