import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { HandleResolver } from "@atproto/identity";
import { BskyAgent } from "@atproto/api";

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

const agent = new BskyAgent({
	service: "https://public.api.bsky.app",
});

async function func(args: any): Promise<any> {
	let did = args.didOrHandle as string;

	if (!did.startsWith("did:")) {
		const hdlres = new HandleResolver({});
		did = (await hdlres.resolve(did)) || (args.didOrHandle as string);
	}

	const didDoc = await fetch(`https://plc.directory/${did}`);
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

	const serviceEndpoint = service.serviceEndpoint;

	const { data: user } = await agent.app.bsky.actor.getProfile({
		actor: did,
	});

	return {
		userDid: did,
		joinDate: user.indexedAt,
		displayName: user.displayName,
		handle: user.handle,
		description: user.description,
		pds: serviceEndpoint,
		rawProfileRecord: user
	};
}

registerTool(func, meta);
