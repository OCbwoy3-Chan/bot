import { resolveKey } from "@sapphire/plugin-i18next";

export const ALL_LANGUAGES: { id: string, name: string, english: string }[] = [
	{ id: "en", name: "English", english: "English" },
	{ id: "lv", name: "Latviešu", english: "Latvian" }
]

export const r = resolveKey;
