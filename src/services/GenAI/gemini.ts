import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { logger } from "../../lib/Utility";

let genai: GoogleGenerativeAI | null = null;
let file_manager: GoogleAIFileManager | null = null;

export function initGemini(apiKey: string): GoogleGenerativeAI {
	logger.info(
		`Creating new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY)`
	);
	genai = new GoogleGenerativeAI(apiKey);
	file_manager = new GoogleAIFileManager(apiKey);
	return genai;
}

export function getGeminiInstance(): GoogleGenerativeAI {
	if (!genai) {
		throw new Error("GenAI not initialized");
	}
	return genai;
}

export function getFileManagerInstance(): GoogleGenerativeAI {
	if (!genai) {
		throw new Error("GenAI not initialized");
	}
	return genai;
}

export function areGenAIFeaturesEnabled(): boolean {
	return genai ? true : false;
}

export const AllModels: { [a: string]: { m: string; t: string } } = {

	// GEMINI 2.0
	"Gemini 2.0 Flash-Lite Preview 02-05": { m: "gemini-2.0-flash-lite-preview-02-05", t: "1mil" },

	// PREVIEW
	"Gemini 2.0 Flash Experimental": { m: "gemini-2.0-flash-exp", t: "1mil" },
	"LearnLM 1.5 Pro Experimental": { m: "learnlm-1.5-pro-experimental", t: "32k" },

	// GEMINI 1.5

	"Gemini 1.5 Pro": { m: "gemini-1.5-pro", t: "2mil" },
	"Gemini 1.5 Flash": { m: "gemini-1.5-flash", t: "1mil" },
	"Gemini 1.5 Flash 8B": { m: "gemini-1.5-flash-8b", t: "1mil" },

};

export const AI_HELP_MSG = `# OCbwoy3-Chan
**This is an experimental AI chatbot built for assisting users Discord.**
I am built on Google's Gemini API and can generate content from text, audio, video and code. Sadly it's not multimodal.

OCbwoy3-Chan will become more helpful as you chat, picking up on details and preferences to tailor its responses to your needs and selected character, similar to ChatGPT.

**To understand what OCbwoy3-Chan remembers or teach it something new, just ask it:**
- “Remember that I like concise responses.”
- “My favourite song is Staircase Hell!”
- “What do you remember about me?”
- “What's my favourite song?”

Sometimes OCbwoy3-Chan would forget to save something, so asking it to do so would most likely work. If the AI updates it's memories, you would see a reaction with the :notebook: emoji.

**OCbwoy3-Chan can also use a variety of tools, such as**
- Searching [DuckDuckGo](<https://duckduckgo.com>),
- Querying data from Bluesky with the [AT Protocol](<https://atproto.com>),
- Utilizing Roblox's APIs,
- Fetching GBans,
- Looking up pages on [Fandom](<https://fandom.com>),
- Scraping websites with [Puppeteer](<https://pptr.dev>),
- and much more..

OCbwoy3-Chan can also roleplay as specific preset characters via the \`/ai set_character\` command.

You can always contribute to the development of 112-SB on our [GitHub](<https://github.com/OCbwoy3-Chan/112>).`.replace(/^[\t ]+$/gm, '').replace(/\n\n\n/g, '\n\n')
