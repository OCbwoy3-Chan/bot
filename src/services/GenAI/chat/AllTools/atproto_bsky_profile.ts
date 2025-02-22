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
		"Fetches profile metadata from Bluesky (Name, Display Name, Bio, Labels, etc.). For unauthenticated users, use !no-unauthenticated.",
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

const LABELER_DIDS = `did:plc:zkd45zaim752t2nhdp4hx3tl
did:plc:w2zobotzori6wtdrdemjc4w6
did:plc:uck7o3astrz3d5duqzqzbqzb
did:plc:ta3x5yunfixtgxccegowqqyn
did:plc:su3mkntbu4e2utq7gwsugckj
did:plc:pavhkxlxvwdr22ucmwof2zyj
did:plc:mezyp3t2itt2ngp4olhfvejs
did:plc:m7w27miujxksry7k4kcy6v5x
did:plc:kqhjyyy2cqvezuto64hqzlyx
did:plc:j5knj3ltjinpmnggn4p7wdlv
did:plc:gxgyjkpew2yrd6cofdvs3tft
did:plc:fcu3cbdz4d7pwn6nbjrbsqgp
did:plc:dueaybwstgk6uo7qkm5eejd7
did:plc:dokb5fkt3krrl7u6ugvnuqjn
did:plc:7mqq4owwkghrdco5lppftzdl
did:plc:7765z3lirqtl5azkym24sick
did:plc:6okc3bhiiyc3wilnhlhva23k
did:plc:4djyfc24ob4vr4bypuvojfeq
did:plc:26lxvmm3akjgfn3abefw4v2h
did:plc:2qawvcwumvgxmed6iy6pmt6l
did:plc:4nkfpe7ty5lye5doc2dv5qpv
did:plc:sehu5el4gqw7s2jxxyyy3e6n
did:plc:d2mkddsbmnrgr3domzg5qexf
did:plc:ylmdlijvrvgbe4md6v4dyce6
did:plc:lr5smbne6sydt7gjymthx3ld
did:plc:xss2sw5p4bfhjqjorl7gk6z4
did:plc:657bbv43hgcuypiqbkuuiz4s
did:plc:6mjpba7ftd6yljjgvhwgj46p
did:plc:newitj5jo3uel7o4mnf3vj2o
did:plc:wkoofae5uytcm7bjncmev6n6
did:plc:jcce2sa3fgue4wiocvf7e7xj
did:plc:e4elbtctnfqocyfcml6h2lf7
did:plc:eeptyms6w2crpi6h73ok7qjt
did:plc:bv3lcacietc6fkdokxfqtdkj
did:plc:yv4nuaj3jshcuh2d2ivykgiz
did:plc:ubt73xes4uesthuuhbqwf37d
did:plc:lcdcygpdeiittdmdeddxwt4w
did:plc:pbmxe3tfpkts72wi74weijpo
did:plc:4ugewi6aca52a62u62jccbl7
did:plc:qu7zmf6snbnlkgoq7yehuimr
did:plc:i65enriuag7n5fgkopbqtkyk
did:plc:4grtcppa6rdgx3hgomz6kfdj
did:plc:mxsvcwyq6mofumlwyxiws3g5
did:plc:5bs7ob2txc2fub2ikvkjgkaf
did:plc:2pduupjftektqoitfekc2x76
did:plc:bpkpvmwpd3nr2ry4btt55ack
did:plc:gqaoe3na6isc3zyvp7iuqpu7
did:plc:zal76px7lfptnpgn4j3v6i7d
did:plc:vnzvtgtwden4hpeierfcfan2
did:plc:fqfzpua2rp5io5nmxcixvdvm
did:plc:aksxl7qy5azlzfm2jstcwqtz
did:plc:cdbp64nijvsmhuhodbuoqcwi
did:plc:p6eqp5xkulucs6ebeoqtveze
did:plc:w6yx4bltuzdmiolooi4kd6zt
did:plc:r5zogjmxhhn6v23dv47li6pc
did:plc:zxldzh7s6no6zikwqpasixrp
did:plc:z3yk2cflhmn6vmzo3f5ixqh4`.split("\n")
const LABELERS = LABELER_DIDS.join(", ")

let labels: {[a:string]: any} = {};

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
					dids: LABELER_DIDS,
					detailed: true
				});
				labelers.data.views.forEach(v => {
					let p = v as LabelerViewDetailed;
					(p.policies.labelValueDefinitions || []).forEach(l=>{
						labels[`${p.creator.did}/${l.identifier}`] = {labeler: p.creator.displayName, serverity: l.severity, name: l.locales[0].name, description: l.locales[0].description, id: l.identifier, blurs: l.blurs}
					})
					labels[`${p.creator.did}/!hide`] = {labeler: p.creator.displayName, serverity: "hide", description: "This content has been hidden by the moderators. This content has been labeled with the !hide global label value defined by the AT Protocol. ", id: "!hide", blurs: false}
					labels[`${p.creator.did}/!warn`] = {labeler: p.creator.displayName, serverity: "warn", description: "This content has received a general warning from moderators. This content has been labeled with the !warn global label value defined by the AT Protocol. ", id: "!warn", blurs: false}
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

	let appview: any = {error:"Service owner did not provide ATProto credentials"};

	if (agent.did) {
		const d = await agent.app.bsky.actor.getProfile({
			actor: did
		},{
			headers: {
				'atproto-accept-labelers': LABELERS
			}
		})
		let x = d.data
		x.labels = (d.data.labels || []).map(a=>{
			if (a.src == x.did && a.val == "!no-unauthenticated") {
				return {labeler: (x.displayName || x.handle), serverity: "hide", description: "This profile is labeled with the !no-unauthenticaed label value defined by the AT Protocol and is hidden from all logged-out users in client apps which respect the label.", id: a.val, blurs: false}
			}
			return labels[`${a.src}/${a.val}`] || {labeler: a.src, serverity: "unknown", description: "Unknown", id: a.val, blurs: false}
		})
		appview = x;
	}

	console.log(appview);

	return appview
}

registerTool(func, meta);
