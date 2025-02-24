import { getBanReasonsForUserid } from "./getGbans";
import { getGeminiInstance } from "@ocbwoy3chanai/gemini";
import { SchemaType } from "@google/generative-ai";

type BanReason = {
	ban_reason: string,
	justified: boolean,
	comment: string
}

export async function generateBanReason(userid: string): Promise<BanReason> {
	const banReasons = await getBanReasonsForUserid(userid)

	const gemini = getGeminiInstance();
	const prompt = `Generate a 10-30 word long ban reason for this user based on the avaiable data provided in JSON.
If a ban reason is present, include every single bit of evidence.
Format it following similar format to Nova, like with this example reason: "Case 1 | Case 2 | Case 3 | et cetera".
The 'justified' field is where you output a boolean if you think the user should be banned.
'comment' must have a detailed explanation about the ban process and the reasoning behind it. List all ban providers used in the comment and where you got evidence.
Remember to use the pipe symbol seperators like Nova. Keep the comment at around 20-50 words long.`;

	const model = gemini.getGenerativeModel({
		model: "gemini-1.5-flash",
		systemInstruction: prompt
	});

	const session = model.startChat({
		generationConfig: {
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
					}
				},
				required: [
					"ban_reason",
					"justified",
					"comment"
				]
			},
		},
	});

	const resp = await session.sendMessage(["```json\n"+JSON.stringify(banReasons,undefined,"\t")+"\n```"])

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

	return JSON.parse(resp.response.text()) as BanReason;
}
