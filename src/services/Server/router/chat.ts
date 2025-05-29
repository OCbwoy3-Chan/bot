import { execSync } from "child_process";
import { getDistroNameSync } from "@112/Utility";
import { randomUUID } from "crypto";
import { AIContext, toolMetas } from "@ocbwoy3chanai/chat";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import Elysia, { status, t } from "elysia";
import assert from "assert";

const router = new Elysia();

function randomString(): string {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const length = 25;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * characters.length)
		);
	}
	return result;
}

let API_KEY = randomString();

export function resetOCbwoy3ChansAPIKey(): string {
	API_KEY = randomString();
	return API_KEY;
}

router.get("/ocbwoy3chan/funcs", ()=>toolMetas)


router.get(
	"/ocbwoy3chan",
	async ({ headers }) => {
		const authHeader = headers.Authorization;
		if (!authHeader || authHeader !== `${API_KEY}`) {
			return status(403, { error: "Forbidden" });
		}
		let branch = "unknown";
		let version = "unknown";
		let commit = "unknown";

		try {
			branch = execSync("git rev-parse --abbrev-ref HEAD")
				.toString()
				.trim();
			version = execSync("git describe --tags").toString().trim();
			commit = execSync("git rev-parse HEAD").toString().trim();
		} catch (error) {
			console.error("Error fetching git information:", error);
		}

		return status(200, {
			branch,
			distro: getDistroNameSync(),
			version,
			commit
		});
	},
	{
		tags: ["ai"],
		response: {
			403: t.Object({
				error: t.String({ default: "Unauthorized" })
			}),
			200: t.Object({
				branch: t.String({ default: "ocbwoy3/genai-next" }),
				distro: t.String({ default: "NixOS" }),
				version: t.String({ default: "v0.2.0-115-gac1d7ba "}),
				commit: t.String({ default: "gac1d7ba..." }),
			})
		},
		headers: t.Object({
			Authorization: t.String()
		})
	}
);

const queuedJobs: string[] = [];
const jobResults: { [jobid: string]: { tools: string[]; resp: string } } = {};

router.post(
	"/ocbwoy3chan/queue_job",
	async ({ headers, body }) => {
		const authHeader = headers.Authorization;
		if (!authHeader || authHeader !== `${API_KEY}`) {
			return status(403, { error: "Forbidden" });
		}

		// console.log(req.body);

		const jobid = randomUUID();

		const { msg: message, ctx: context } = body;
		const ct: Partial<AIContext> = context;

		assert(ct.currentChannel);
		assert(ct.currentAiModel);

		queuedJobs.push(jobid);

		const chat = chatManager.getChat(
			ct.currentChannel,
			ct.currentAiModel,
			"ocbwoy3_chan"
		);

		(async () => {
			try {
				const [resp, tools] = await chat.generateResponse(
					message,
					ct as AIContext
				);
				jobResults[jobid] = { resp, tools };
			} catch {}
			const index = queuedJobs.indexOf(jobid);
			if (index > -1) {
				queuedJobs.splice(index, 1);
			}
		})();

		return status(200, {
			jobid
		});
	},
	{
		tags: ["ai"],
		body: t.Object({
			msg: t.String(),
			ctx: t.Object({
				currentChannel: t.String(),
				currentAiModel: t.String()
			})
		}),
		response: {
			200: t.Object({
				jobid: t.String({
					format: "uuid"
				})
			}),
			403: t.Object({
				error: t.String({ default: "Unauthorized" })
			}),

		},
		headers: t.Object({
			Authorization: t.String()
		})
	}
);

router.post(
	"/ocbwoy3chan/get_response",
	async ({ headers, body }) => {
		const authHeader = headers.Authorization;
		if (!authHeader || authHeader !== `${API_KEY}`) {
			return status(403, { error: "Forbidden" });
		}

		const { id: jobid } = body;

		if (queuedJobs.includes(jobid)) {
			return status(200, { wait: true });
		}

		if (!jobid || !jobResults[jobid]) {
			return status(404, { error: "Job not found" });
		}

		const result = jobResults[jobid];
		delete jobResults[jobid];

		return status(200, result);
	},
	{
		tags: ["ai"],
		body: t.Object({
			id: t.String({
				format: "uuid"
			})
		}),
		response: {
			403: t.Object({
				error: t.String({ default: "Unauthorized" })
			}),
			404: t.Object({
				error: t.String({ default: "Job not found" })
			}),
			200: t.Object({
				wait: t.Optional(t.Boolean()),
				tools: t.Optional(t.Array(t.String())),
				resp: t.Optional(t.String())
			})
		},
		headers: t.Object({
			Authorization: t.String()
		})
	}
);

export const aiRouter = router;
