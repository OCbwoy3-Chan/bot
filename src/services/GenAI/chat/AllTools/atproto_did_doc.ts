import { HandleResolver } from "@atproto/identity";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "resolveDidDoc",
	description:
		'Turns a DID or a handle into a PDS, rotation keys, the ATProto did doc. The AT Protocol used for the Social Media Platform called "Bluesky". When calling it a Personal Data Server, add AT Protocol in front of it, so we know what you are refrerring to.',
	parameters: {
		required: ["didOrHandle"],
		type: SchemaType.OBJECT,
		description: "resolveDidDoc parameters",
		properties: {
			didOrHandle: {
				description: "The user's DID or handle",
				type: SchemaType.STRING,
			},
		},
	},
};

async function func(args: any): Promise<any> {
	let did = args.didOrHandle as string;

	if (!did.startsWith("did:")) {
		const hdlres = new HandleResolver({});
		did = (await hdlres.resolve(did)) || (args.didOrHandle as string);
	}

	const didDoc = await fetch(`https://plc.directory/${did}`);

	return await didDoc.json();
}

registerTool(func, meta);
