import AtpAgent, { BskyAgent } from "@atproto/api";
import { HandleResolver } from "@atproto/identity";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";
import { LabelerViewDetailed } from "@atproto/api/dist/client/types/app/bsky/labeler/defs";

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
		"Gets the Name, Display Name, Bio, Description, Labels, Self-Labels, Pronouns, Avatar, Status and other metadata about a Bluesky user. Use the labeler's name and the label's localized metadata!! !no-unauthenticated is used to prevent unauthenticated users from viewing the profile. ",
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

const agent = new BskyAgent({
	service: process.env.ATPROTO_PDS || "https://bsky.social",
})

const LABELERS = "did:plc:ar7c4by46qjdydhdevvrndac;redact, did:plc:newitj5jo3uel7o4mnf3vj2o, did:plc:wkoofae5uytcm7bjncmev6n6, did:plc:jcce2sa3fgue4wiocvf7e7xj, did:plc:e4elbtctnfqocyfcml6h2lf7, did:plc:eeptyms6w2crpi6h73ok7qjt, did:plc:bv3lcacietc6fkdokxfqtdkj, did:plc:yv4nuaj3jshcuh2d2ivykgiz, did:plc:ubt73xes4uesthuuhbqwf37d, did:plc:lcdcygpdeiittdmdeddxwt4w, did:plc:pbmxe3tfpkts72wi74weijpo, did:plc:4ugewi6aca52a62u62jccbl7, did:plc:qu7zmf6snbnlkgoq7yehuimr, did:plc:i65enriuag7n5fgkopbqtkyk, did:plc:4grtcppa6rdgx3hgomz6kfdj, did:plc:mxsvcwyq6mofumlwyxiws3g5, did:plc:snxoa2w2hj2bdewwczlxpzif, did:plc:5bs7ob2txc2fub2ikvkjgkaf, did:plc:2pduupjftektqoitfekc2x76"
const LABELER_DIDS = [
	"did:plc:ar7c4by46qjdydhdevvrndac",
	"did:plc:newitj5jo3uel7o4mnf3vj2o",
	"did:plc:wkoofae5uytcm7bjncmev6n6",
	"did:plc:jcce2sa3fgue4wiocvf7e7xj",
	"did:plc:e4elbtctnfqocyfcml6h2lf7",
	"did:plc:eeptyms6w2crpi6h73ok7qjt",
	"did:plc:bv3lcacietc6fkdokxfqtdkj",
	"did:plc:yv4nuaj3jshcuh2d2ivykgiz",
	"did:plc:ubt73xes4uesthuuhbqwf37d",
	"did:plc:lcdcygpdeiittdmdeddxwt4w",
	"did:plc:pbmxe3tfpkts72wi74weijpo",
	"did:plc:4ugewi6aca52a62u62jccbl7",
	"did:plc:qu7zmf6snbnlkgoq7yehuimr",
	"did:plc:i65enriuag7n5fgkopbqtkyk",
	"did:plc:4grtcppa6rdgx3hgomz6kfdj",
	"did:plc:mxsvcwyq6mofumlwyxiws3g5",
	"did:plc:snxoa2w2hj2bdewwczlxpzif",
	"did:plc:5bs7ob2txc2fub2ikvkjgkaf",
	"did:plc:2pduupjftektqoitfekc2x76"
]

let labels: {[a:string]: any} = {};

async function func(args: any): Promise<any> {

	if (!agent.did) {
		if (process.env.ATPROTO_DID && process.env.BSKY_PASSWORD) {
			await agent.login({
				identifier: process.env.ATPROTO_DID!,
				password: process.env.BSKY_PASSWORD!
			});
			try {
				const labelers = await agent.app.bsky.labeler.getServices({
					dids: LABELER_DIDS,
					detailed: true
				});
				labelers.data.views.forEach(v => {
					let p = v as LabelerViewDetailed;
					(p.policies.labelValueDefinitions || []).forEach(l=>{
						labels[`${p.creator.did}/${l.identifier}`] = {labeler: p.creator.displayName, serverity: l.severity, name: l.locales[0].name, description: l.locales[0].description, id: l.identifier, blurs: l.blurs}
					})
					labels[`${p.creator.did}/!hide`] = {labeler: p.creator.displayName, serverity: "hide", description: "Hides the content", id: "!hide", blurs: false}
					labels[`${p.creator.did}/!warn`] = {labeler: p.creator.displayName, serverity: "warn", description: "Warns the user before showing the content", id: "!warn", blurs: false}
				});
			} catch(e_) {
				console.error(e_)
			}
		}
	}

	let did = args.didOrHandle as string;

	if (!did.startsWith("did:")) {
		const hdlres = new HandleResolver({});
		did = (await hdlres.resolve(did)) || (args.didOrHandle as string);
	}

	let appview = {error:"Service owner did not provide ATProto credentials"};

	if (agent.did) {
		const d = await agent.app.bsky.actor.getProfile({
			actor: did
		},{
			headers: {
				'atproto-accept-labelers': 'did:plc:ar7c4by46qjdydhdevvrndac;redact, did:plc:newitj5jo3uel7o4mnf3vj2o, did:plc:wkoofae5uytcm7bjncmev6n6, did:plc:jcce2sa3fgue4wiocvf7e7xj, did:plc:e4elbtctnfqocyfcml6h2lf7, did:plc:eeptyms6w2crpi6h73ok7qjt, did:plc:bv3lcacietc6fkdokxfqtdkj, did:plc:yv4nuaj3jshcuh2d2ivykgiz, did:plc:ubt73xes4uesthuuhbqwf37d, did:plc:lcdcygpdeiittdmdeddxwt4w, did:plc:pbmxe3tfpkts72wi74weijpo, did:plc:4ugewi6aca52a62u62jccbl7, did:plc:qu7zmf6snbnlkgoq7yehuimr, did:plc:i65enriuag7n5fgkopbqtkyk, did:plc:4grtcppa6rdgx3hgomz6kfdj, did:plc:mxsvcwyq6mofumlwyxiws3g5, did:plc:snxoa2w2hj2bdewwczlxpzif, did:plc:5bs7ob2txc2fub2ikvkjgkaf, did:plc:2pduupjftektqoitfekc2x76'
			}
		})
		let x = d.data
		x.labels = (d.data.labels || []).map(a=>{
			return labels[`${a.src}/${a.val}`] || {labeler: a.src, serverity: "unknown", description: "Unknown", id: a.val, blurs: false}
		})
		appview = x;
	}

	console.log(appview);

	return appview
}

registerTool(func, meta);
