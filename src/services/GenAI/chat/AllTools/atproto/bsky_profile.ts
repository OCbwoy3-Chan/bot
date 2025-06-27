import { BskyAgent } from "@atproto/api";
import { HandleResolver } from "@atproto/identity";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../../tools";
import { LabelerViewDetailed } from "@atproto/api/dist/client/types/app/bsky/labeler/defs";
import { agent, DEFAULT_FORCED_LABELERS } from "./libatproto";

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
	name: "atproto.profile",
	description:
		"Fetches profile metadata from Bluesky (Name, Display Name, Bio, Labels, etc.). For unauthenticated users, use !no-unauthenticated.",
	parameters: {
		required: ["didOrHandle"],
		type: SchemaType.OBJECT,
		description: "getBskyProfile parameters",
		properties: {
			didOrHandle: {
				description: "The user's DID or handle",
				type: SchemaType.STRING
			}
		}
	}
};

addTest(meta.name, {
	didOrHandle: "ocbwoy3.dev"
});

const LABELERS = DEFAULT_FORCED_LABELERS.join(", ");

const labels: { [a: string]: any } = {};

/* stupid pds' appview ratelimits wtf */

async function func(args: any): Promise<any> {
	if (!agent.did) {
		if (process.env.ATPROTO_DID && process.env.BSKY_PASSWORD) {
			await agent.login({
				identifier: process.env.ATPROTO_DID!,
				password: process.env.BSKY_PASSWORD!
			});
			try {
				const labelers = await agent.app.bsky.labeler.getServices({
					dids: DEFAULT_FORCED_LABELERS,
					detailed: true
				});
				labelers.data.views.forEach((v) => {
					const p = v as LabelerViewDetailed;
					(p.policies.labelValueDefinitions || []).forEach((l) => {
						labels[`${p.creator.did}/${l.identifier}`] = {
							labeler_did: p.creator.did,
							labeler: p.creator.displayName,
							serverity: l.severity,
							name: l.locales[0].name,
							description: l.locales[0].description,
							id: l.identifier,
							blurs: l.blurs
						};
					});
					labels[`${p.creator.did}/!hide`] = {
						labeler_did: p.creator.did,
						labeler: p.creator.displayName,
						serverity: "hide",
						description:
							"This content has been hidden by the moderators. This content has been labeled with the !hide global label value defined by the AT Protocol. ",
						id: "!hide",
						blurs: false
					};
					labels[`${p.creator.did}/!warn`] = {
						labeler_did: p.creator.did,
						labeler: p.creator.displayName,
						serverity: "warn",
						description:
							"This content has received a general warning from moderators. This content has been labeled with the !warn global label value defined by the AT Protocol. ",
						id: "!warn",
						blurs: false
					};
				});
			} catch (e_) {
				console.error(e_);
			}
		}
	}

	let did = args.didOrHandle as string;

	if (!did.startsWith("did:")) {
		const hdlres = new HandleResolver({});
		did = (await hdlres.resolve(did)) || (args.didOrHandle as string);
	}

	let appview: any = {
		error: "Service owner did not provide ATProto credentials"
	};

	if (agent.did) {
		const d = await agent.app.bsky.actor.getProfile(
			{
				actor: did
			},
			{
				headers: {
					"atproto-accept-labelers": LABELERS
				}
			}
		);
		const x = d.data;
		x.labels = (d.data.labels || []).map((a) => {
			if (a.src == x.did && a.val == "!no-unauthenticated") {
				return {
					labeler: x.displayName || x.handle,
					serverity: "hide",
					description:
						"This profile is labeled with the !no-unauthenticaed label value defined by the AT Protocol and is hidden from all logged-out users in client apps which respect the label.",
					id: a.val,
					blurs: false
				};
			}
			return (
				labels[`${a.src}/${a.val}`] || {
					labeler_did: a.src,
					labeler: a.src,
					serverity: "unknown",
					description: "Unknown",
					id: a.val,
					blurs: false
				}
			);
		});
		appview = x;
	}

	console.log(appview);

	return appview;
}

registerTool(func, meta);
