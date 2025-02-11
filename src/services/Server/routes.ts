import express, { Request, Response } from "express";
import {
	AddToBanlandCacheManager,
	BanlandCacheHelper,
} from "../../lib/BanlandCacheHelper";
import { router, setNumBans } from "./router/stats";
import { formRouter } from "./router/forms";
import { aiRouter } from "./router/chat";

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

app.get("/", async (req: Request, res: Response) => {
	res.send(
		`112 - OCbwoy3's GBan Handler<br/><a href="https://ocbwoy3.dev/discord">Discord</a>`
	);
});

app.use(router);


const AllBanlandCacheHelper = new BanlandCacheHelper("All");
AllBanlandCacheHelper._updateBanCountFunc = setNumBans;

AddToBanlandCacheManager(AllBanlandCacheHelper);

app.get("/banland.json", async (req: Request, res: Response) => {
	res.send(await AllBanlandCacheHelper.GetCachedBanland());
});

app.get("/bans", async (req: Request, res: Response) => {
	res.send(await AllBanlandCacheHelper.GetCachedBanland());
});

app.get("/.prikolshub/banland.json", async (req: Request, res: Response) => {
	res.send(await AllBanlandCacheHelper.GetCachedBanland());
});

app.use(aiRouter);

/*
app.use(express.json());
app.use(formRouter);
*/
