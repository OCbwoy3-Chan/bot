import express, { Request, Response } from "express";
import { AddToBanlandCacheManager, BanlandCacheHelper } from "../../lib/BanlandCacheHelper";

export const app = express();

app.get("/discord",async(req: Request, res: Response)=>{
	res.redirect("https://ocbwoy3.dev/discord");
});

app.get("/",async(req: Request, res: Response)=>{
	res.send(`112 - OCbwoy3's GBan Handler<br/><a href="https://ocbwoy3.dev/discord">Discord</a>`);
});

const AllBanlandCacheHelper = new BanlandCacheHelper("All");
const SBBanlandCacheHelper = new BanlandCacheHelper("SB");
const MultiverseBanlandCacheHelper = new BanlandCacheHelper("OCbwoy3sMultiverse");

[AllBanlandCacheHelper,SBBanlandCacheHelper,MultiverseBanlandCacheHelper].forEach((h: BanlandCacheHelper)=>{ AddToBanlandCacheManager(h); });

app.get("/banland.json",async(req: Request, res: Response)=>{ res.send(await AllBanlandCacheHelper.GetCachedBanland()); });
app.get("/.prikolshub/banland.json",async(req: Request, res: Response)=>{ res.send(await AllBanlandCacheHelper.GetCachedBanland()); });

app.get("/sb.json",async(req: Request, res: Response)=>{ res.send(await SBBanlandCacheHelper.GetCachedBanland()); });
app.get("/multiverse.json",async(req: Request, res: Response)=>{ res.send(await MultiverseBanlandCacheHelper.GetCachedBanland()); });
