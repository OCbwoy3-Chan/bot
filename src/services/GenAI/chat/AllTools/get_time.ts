import { FunctionDeclaration } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "time_now",
	description:
		"Gets the current date/time right now.",
};

addTest(meta.name,null);

async function func(args: any): Promise<any> {
	return {
		unixMillis: Date.now(),
		isoString: new Date().toString(),
	};
}

registerTool(func, meta);
