import { prisma } from "../db";
import { FormQuestion, FormQuestionType } from "../../../services/Server/api/FormsHelper";

export async function createForm(authorId: string, questions: FormQuestion[]): Promise<void> {
	await prisma.form.create({
		data: {
			authorId,
			questions: JSON.stringify(questions),
		},
	});
}

export async function updateForm(id: string, authorId: string, questions: FormQuestion[]): Promise<void> {
	await prisma.form.upsert({
		where: { id },
		update: {
			authorId,
			questions: JSON.stringify(questions)
		},
		create: {
			id,
			authorId,
			questions: JSON.stringify(questions)
		}
	});
}

updateForm("test", "ocbwoy3", [
	{
		type: FormQuestionType.TEXT,
		question: "Best Roblox Game?",
		description: "Regretevator, Obviously.",
		options: []
	}
])

export async function getForm(formId: string) {
	// console.log(formId)
	const f = await prisma.form.findFirst({
		where: { id: { equals: formId } },
	});
	return f
}

export async function submitFormResponse(formId: string, respondentId: string, ip: string, responses: Object): Promise<void> {
	await prisma.formResponse.create({
		data: {
			formId,
			respondentId,
			ipAddress: ip,
			answers: JSON.stringify(responses),
		},
	});
}

export async function getFormResponses(formId: string) {
	return await prisma.formResponse.findMany({
		where: { formId },
	});
}
