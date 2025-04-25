import { getGeminiInstance } from "@ocbwoy3chanai/gemini";
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

	const gemini = getGeminiInstance();
	const prompt = `
Target locale: ${targetLanguage}

Generate a 10-30 word long ban reason for this user based on the avaiable data provided in JSON.
If a ban reason is present, include every single bit of evidence.
Format it following similar format to Nova, like with this example reason: "Case 1 | Case 2 | Case 3 | et cetera".
The 'justified' field is where you output a boolean if you think the user should be banned. Instead of copying ban reasons, reword them.
'comment' must have a detailed explanation about the ban process and the reasoning behind it. List all ban providers used in the comment and where you got evidence.
Remember to use the pipe symbol seperators like Nova. Keep the comment at around 20-50 words long. Please ignore all JavaScript fetch errors and unfair or ban reasons which harass a person, etc.

If bans are empty, the user should not be banned. Command inputs are not counted as reasons.
Malicious and mean or rude reasons such as "fucking [slur]" should not be counted.
Do not count Exploiting as an offense.

TOS = Rules. Do not change words such as Roblox, Discord, etc.
PLEASE WRITE THE REASON AND ALL OTHER FIELDS IN THE TARGET LANGUAGE.`;

	const session = gemini.chats.create({
		model: "gemini-2.0-flash-lite",
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
					comment: {
						type: SchemaType.STRING
					},
					explanation: {
						type: SchemaType.STRING
					}
				},
				required: ["ban_reason", "justified", "comment", "explanation"]
			}
		}
	});

	const resp = await session.sendMessage({
		message: [
			"```json\n" +
				JSON.stringify(
					{ targetLanguage, bans: banReasons },
					undefined,
					"\t"
				) +
				"\n```"
		]
	});

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
