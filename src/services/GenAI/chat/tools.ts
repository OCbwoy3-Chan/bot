import { FunctionDeclaration } from "@google/generative-ai";
import { logger } from "../../../lib/Utility";
import assert from "assert";

const tools: { [a: string]: Function } = {};
const toolMetas: FunctionDeclaration[] = [];

const tests: { tool: string; args: any }[] = [];

export function registerTool(f: Function, m: FunctionDeclaration): void {
	tools[m.name!] = f;
	toolMetas.push(m);
	logger.info(
		`GenAIManager: Registered tool ${m.name} with ${
			m.parameters ? Object.keys(m.parameters!.properties!).length : 0
		} parameters`
	);
}

export function addTest(toolName?: string, args?: any) {
	assert(toolName,"No tool name :(");
	tests.push({ tool: toolName!, args });
}

export function getTools(): { [a: string]: Function } {
	return tools;
}

export function getTests(): { tool: string; args: any }[] {
	return tests;
}

export function getToolMetas(): FunctionDeclaration[] {
	return toolMetas;
}
