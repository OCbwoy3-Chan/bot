import {
	getGeminiInstance,
	getGeminiTokenPoolSize,
	isGeminiRateLimitError,
	rotateGeminiToken
} from "@ocbwoy3chanai/gemini";
import { SchemaType } from "@google/generative-ai";
import { getUserBanStatus } from "@db/GBanProvider";

type BanReason = {
	ban_reason: string;
	justified: boolean;
	comment: string;
	explanation: string;
};

export async function generateBanReason(
	userid: string,
	targetLanguage: string
): Promise<BanReason> {
	const banReasons = await getUserBanStatus(userid);

	const prompt = `
Target locale: ${targetLanguage}

Generate a 10-30 word long ban reason for this user based on the available data provided in JSON.
If a ban reason is present, include every single bit of evidence.
Format it following similar format to Nova, like with this example reason: "Case 1 | Case 2 | Case 3 | et cetera".
The 'justified' field is where you output a boolean if you think the user should be banned. Instead of copying ban reasons, reword them.
If the user is guilty, generate a short paragraph explaining the reasoning behind the ban process and the evidence used.
Remember to use the pipe symbol separators like Nova. Please ignore all JavaScript fetch errors and unfair or ban reasons which harass a person, etc.

If bans are empty, the user should not be banned. Command inputs are not counted as reasons.
Malicious and mean or rude reasons such as "fucking [slur]" should not be counted.
Do not count Exploiting as an offense.

TOS = Rules. Do not change words such as Roblox, Discord, etc.
PLEASE WRITE THE REASON AND ALL OTHER FIELDS IN THE TARGET LANGUAGE.`;

	const resp = await sendGeminiRequestWithFailover(
		prompt,
		"gemini-2.0-flash-lite",
		[
			"```json\n" +
				JSON.stringify(
					{ targetLanguage, bans: banReasons },
					undefined,
					"\t"
				) +
				"\n```"
		]
	);

	/*

	Legal:

	Manual bans only
	Notify users of AI assistance during ban process
	GDPR compliance
	Right to appeal
	Human must review

	Illegal:

	Full automation
	Misleading or unexplainable ban reasons
	No appeal process
	No GDPR compliance

	*/

	if (resp.promptFeedback) throw resp.promptFeedback;
	if (!resp.text) throw "No message :(";
	return JSON.parse(resp.text) as BanReason;
}

async function sendGeminiRequestWithFailover(
	prompt: string,
	model: string,
	message: Array<string>
) {
	const maxAttempts = getGeminiTokenPoolSize();
	let lastError: unknown = null;
	for (let attempt = 0; attempt < Math.max(1, maxAttempts); attempt++) {
		const gemini = getGeminiInstance();
		const session = gemini.chats.create({
			model,
			config: {
				systemInstruction: prompt,
				temperature: 1,
				topP: 0.95,
				topK: 40,
				maxOutputTokens: 8192,
				responseMimeType: "application/json",
				responseSchema: {
					type: SchemaType.OBJECT,
					properties: {
						ban_reason: {
							type: SchemaType.STRING
						},
						justified: {
							type: SchemaType.BOOLEAN
						},
						explanation: {
							type: SchemaType.STRING
						}
					},
					required: ["ban_reason", "justified", "explanation"]
				}
			}
		});

		try {
			return await session.sendMessage({ message });
		} catch (error) {
			lastError = error;
			if (!isGeminiRateLimitError(error)) {
				throw error;
			}
			if (!rotateGeminiToken()) {
				throw error;
			}
		}
	}
	throw lastError;
}
