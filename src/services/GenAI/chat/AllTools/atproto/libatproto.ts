import { BskyAgent } from "@atproto/api";

export const agent = new BskyAgent({
	service: process.env.ATPROTO_PDS || "https://bsky.social"
});
