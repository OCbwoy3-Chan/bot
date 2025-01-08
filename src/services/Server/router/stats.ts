import { Presence } from "discord.js";
import express from "express";

export const router = express.Router();

let presence: Presence | null = null;

export function setPresence(p: any | null) {
	presence = p;
}

router.get("/ocbwoy3dev/rpc.json", (req, res) => {
	res.json(presence);
});
