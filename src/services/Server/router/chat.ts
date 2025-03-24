import express, { Request, Response } from "express";
import {
	createForm,
	getForm,
	submitFormResponse,
	getFormResponses
} from "../../Database/helpers/FormHelpers";
import { execSync } from "child_process";
import { getDistroNameSync } from "@112/Utility";
import { randomUUID } from "crypto";
import { AIContext } from "@ocbwoy3chanai/chat";
import { chatManager } from "@ocbwoy3chanai/ChatManager";

const router = express.Router();
router.use(express.json());

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

router.get("/ocbwoy3chan", async (req: Request, res: Response) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || authHeader !== `${API_KEY}`) {
		return res.status(403).json({ error: "Forbidden" });
	}
	let branch = "unknown";
	let version = "unknown";
	let commit = "unknown";

	try {
		branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
		version = execSync("git describe --tags").toString().trim();
		commit = execSync("git rev-parse HEAD").toString().trim();
	} catch (error) {
		console.error("Error fetching git information:", error);
	}

	return res.status(200).json({
		branch,
		distro: getDistroNameSync(),
		version,
		commit
	});
});

let queuedJobs: string[] = [];
let jobResults: { [jobid: string]: { tools: string[]; resp: string } } = {};

router.post("/ocbwoy3chan/queue_job", async (req: Request, res: Response) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || authHeader !== `${API_KEY}`) {
		return res.status(403).json({ error: "Forbidden" });
	}

	// console.log(req.body);

	let jobid = randomUUID();

	const { msg: message, ctx: context } = req.body;
	let ct: AIContext = context;

	queuedJobs.push(jobid);

	let chat = chatManager.getChat(
		ct.currentChannel,
		ct.currentAiModel,
		"ocbwoy3_chan"
	);

	(async () => {
		try {
			const [resp, tools] = await chat.generateResponse(message, ct);
			jobResults[jobid] = { resp, tools };
		} catch {}
		const index = queuedJobs.indexOf(jobid);
		if (index > -1) {
			queuedJobs.splice(index, 1);
		}
	})();

	return res.status(200).json({
		jobid
	});
});

router.post(
	"/ocbwoy3chan/get_response",
	async (req: Request, res: Response) => {
		const authHeader = req.headers.authorization;
		if (!authHeader || authHeader !== `${API_KEY}`) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const { id: jobid } = req.body;

		if (queuedJobs.includes(jobid)) {
			return res.status(200).json({ wait: true });
		}

		if (!jobid || !jobResults[jobid]) {
			return res.status(404).json({ error: "Job not found" });
		}

		const result = jobResults[jobid];
		delete jobResults[jobid];

		return res.status(200).json(result);
	}
);

export const aiRouter = router;
