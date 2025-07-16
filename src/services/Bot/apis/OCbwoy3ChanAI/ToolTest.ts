import { Message } from "discord.js";
import { getTools, getTests } from "@ocbwoy3chanai/chat/tools";
import { AIContext } from "@ocbwoy3chanai/chat";
import { logger } from "@112/Utility";

const staticAIContext = {};

export async function testSingleTool(
	toolName: string,
	m: Message
): Promise<{ func: string; args: any; isError: boolean; result: any }[]> {
	const tool = getTools()[toolName]!;
	const test = getTests().find((a) => a.tool === toolName)!;

	const results: {
		func: string;
		args: any;
		isError: boolean;
		result: any;
	}[] = [];

	const params: AIContext = {
		askingUserId: m.author.id,
		chatbotUserId: m.client.user!.id,
		currentAiModel: "learnlm-1.5-pro-experimental",
		currentChannel: m.channel.id,
		currentUserStatusOrWhatTheUserIsDoingListeningToEtc: m.member
			? m.member.presence?.toJSON()
			: "avaiable only in servers",
		currentServer: m.guild
			? {
					name: m.guild.name,
					id: m.guild.id
			  }
			: null,
		currentChannelM: {
			name: m.channel.isDMBased() ? null : m.channel.name
		},
		...staticAIContext
	};

	if (!tool) {
		await m.reply(`[@ocbwoy3chanai/ToolTest] ${toolName} not found`);
		return [];
	}

	logger.info(`OCbwoy3ChanAI - testing ${test.tool}`);
	try {
		const result = await tool(test!.args);
		logger.info(`OCbwoy3ChanAI - testing ${test.tool} success`);
		results.push({
			func: toolName,
			args: test.args,
			isError: false,
			result: result
		});
	} catch (error) {
		logger.info(`OCbwoy3ChanAI - testing ${toolName} fail - ${error}`);
		await m.reply(
			`[@ocbwoy3chanai/ToolTest] ${toolName} exe fail - ${error}`
		);
		results.push({
			func: toolName,
			args: test,
			isError: true,
			result: `${error}`
		});
	}

	return results;
}

export async function testAllTools(
	m: Message
): Promise<{ func: string; args: any; isError: boolean; result: any }[]> {
	const tools = getTools();
	const tests = getTests();

	const results: {
		func: string;
		args: any;
		isError: boolean;
		result: any;
	}[] = [];

	const params: AIContext = {
		askingUserId: m.author.id,
		chatbotUserId: m.client.user!.id,
		currentAiModel: "learnlm-1.5-pro-experimental",
		currentChannel: m.channel.id,
		currentUserStatusOrWhatTheUserIsDoingListeningToEtc: m.member
			? m.member.presence?.toJSON()
			: "avaiable only in servers",
		currentServer: m.guild
			? {
					name: m.guild.name,
					id: m.guild.id
			  }
			: null,
		currentChannelM: {
			name: m.channel.isDMBased() ? null : m.channel.name
		},
		...staticAIContext
	};

	for (const test of tests) {
		const tool = tools[test.tool];
		if (!tool) {
			await m.reply(`[@ocbwoy3chanai/ToolTest] ${test.tool} not found`);
			continue;
		}

		logger.info(`OCbwoy3ChanAI - testing ${test.tool}`);
		try {
			const result = await tool(test.args);
			logger.info(`OCbwoy3ChanAI - testing ${test.tool} success`);
			results.push({
				func: test.tool,
				args: test.args,
				isError: false,
				result: result
			});
		} catch (error) {
			logger.info(`OCbwoy3ChanAI - testing ${test.tool} fail - ${error}`);
			await m.reply(
				`[@ocbwoy3chanai/ToolTest] ${test.tool} exe fail - ${error}`
			);
			results.push({
				func: test.tool,
				args: test.args,
				isError: true,
				result: `${error}`
			});
		}
	}

	return results;
}
