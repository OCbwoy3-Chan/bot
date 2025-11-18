import { resolveKey } from "@sapphire/plugin-i18next";

export const ALL_LANGUAGES: {
	id: string;
	name: string;
	english: string;
	flag?: string;
}[] = [
	{ id: "en", name: "English", english: "English", flag: "us" },
	{ id: "lv", name: "Latviešu", english: "Latvian" },
	{ id: "ru", name: "Русский", english: "Russian" }
];

export type LanguageId = "en" | "lv" | "ru";

export const r = resolveKey;
