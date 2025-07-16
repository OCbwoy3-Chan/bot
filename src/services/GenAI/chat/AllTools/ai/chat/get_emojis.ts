import { FunctionDeclaration } from "@google/generative-ai";
import { AIContext } from "../../..";
import { addTest, registerTool } from "../../../tools";
import { getAllEmojisForAI } from "@112/EmojiManager";

const meta: FunctionDeclaration = {
	name: "ai.get_emojis",
	description: "Gets ALL emojis the current AI agent can say in chat."
};

addTest(meta.name, null);

async function func(args: any, ctx: AIContext): Promise<any> {
	return getAllEmojisForAI();
}

registerTool(func, meta);
