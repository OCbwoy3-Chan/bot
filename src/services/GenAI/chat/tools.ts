import { FunctionDeclaration } from "@google/generative-ai";
import { logger } from "../../../lib/Utility";

const tools: { [a: string]: Function } = {};
const toolMetas: FunctionDeclaration[] = [];

export function registerTool(f: Function, m: FunctionDeclaration): void {
	tools[m.name] = f;
	toolMetas.push(m);
	logger.info(
		`GenAIManager: Registered tool ${m.name} with ${
			m.parameters ? Object.keys(m.parameters.properties).length : 0
		} parameters`
	);
}

export function getTools(): { [a: string]: Function } {
	return tools;
}

export function getToolMetas(): FunctionDeclaration[] {
	return toolMetas;
}
