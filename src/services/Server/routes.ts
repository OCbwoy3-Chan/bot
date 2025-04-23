import express, { Request, Response } from "express";
import {
	AddToBanlandCacheManager,
	BanlandCacheHelper
} from "../../lib/BanlandCacheHelper";
import { router, setNumBans } from "./router/stats";
import { aiRouter } from "./router/chat";
import { execSync } from "child_process";
import { getDistroNameSync } from "@112/Utility";

export const app = express();

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
});

app.get("/discord", async (req: Request, res: Response) => {
	res.redirect("https://ocbwoy3.dev/discord");
});

(async () => {
	const branch = execSync("git rev-parse --abbrev-ref HEAD")
		.toString()
		.trim();
	const version = execSync("git describe --tags").toString().trim();
	const commit = execSync("git rev-parse HEAD").toString().trim();

	const distro = getDistroNameSync();

	app.get("/", async (req: Request, res: Response) => {
		// res.redirect(307,"https://ocbwoy3.dev")
		res.status(418)
			.header("Content-Type", "text/plain")
			.send(
				`ocbwoy3.dev - [112 / OCbwoy3-Chan] ${branch}@${commit} (${version}) running on ${distro}`
			);
	});
})().catch((a) => {});

app.use(router);

const AllBanlandCacheHelper = new BanlandCacheHelper("All");
AllBanlandCacheHelper._updateBanCountFunc = setNumBans;

AddToBanlandCacheManager(AllBanlandCacheHelper);

app.get("/banland.json", async (req: Request, res: Response) => {
	res.header("Content-Type", "application/json").send(
		await AllBanlandCacheHelper.GetCachedBanland()
	);
});

app.get("/bans", async (req: Request, res: Response) => {
	res.header("Content-Type", "application/json").send(
		await AllBanlandCacheHelper.GetCachedBanland()
	);
});

app.get("/.prikolshub/banland.json", async (req: Request, res: Response) => {
	res.header("Content-Type", "application/json").send(
		await AllBanlandCacheHelper.GetCachedBanland()
	);
});

app.use(aiRouter);

/*
app.use(express.json());
app.use(formRouter);
*/
