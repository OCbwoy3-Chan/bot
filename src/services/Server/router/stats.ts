import { Presence } from "discord.js";
import express from "express";

export const router = express.Router();

let presence: Presence | null = null;

export function setPresence(p: any | null) {
	presence = p;
}

export function getPresence(): Presence | null {
	return presence;
}

let numBans: number = 0;

export function setNumBans(p: number) {
	numBans = p;
}

router.get("/stats.json", (req, res) => {
	res.json({
		numBans,
	});
});

router.get("/ocbwoy3dev/rpc.json", (req, res) => {
	res.json(presence);
});
