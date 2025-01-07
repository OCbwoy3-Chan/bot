import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { HandleResolver } from "@atproto/identity";

const meta: FunctionDeclaration = {
	name: "resolveDidDoc",
	description:
		"Resolves the given DID or handle to an ATProto did doc. The AT Protocol used for the Social Media Platform called \"Bluesky\"",
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
		did = await hdlres.resolve(did) || args.didOrHandle as string;
	}

	const didDoc = await fetch(`https://plc.directory/${did}`);

	return await didDoc.json();
}

registerTool(func, meta);
