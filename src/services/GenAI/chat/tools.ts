import { FunctionDeclaration, SchemaType, Tool } from "@google/generative-ai";
import { RegularResults, search, translate } from "@navetacandra/ddg";

const tools: { [a: string]: Function } = {};
const toolMetas: FunctionDeclaration[] = [];

export function registerTool(f: Function, m: FunctionDeclaration): void {
	tools[m.name] = f;
	toolMetas.push(m);
}

export function getTools(): { [a: string]: Function } {
	return tools
}

export function getToolMetas(): FunctionDeclaration[] {
	return toolMetas
}
