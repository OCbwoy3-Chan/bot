export enum FormQuestionType {
	RADIO_BTNS = 'Radio',
	CHECKBOXES = 'Checkbox',
	TEXT = 'Text',
	YES_NO = 'YesNo'
}

export type FormQuestion = {
	question: string,
	type: FormQuestionType,
	description?: string,
	options: {
		name: string,
		id: string
	}[]
}

export type Form = {
	name: string,
	description?: string,
	questions: FormQuestion[]
}
