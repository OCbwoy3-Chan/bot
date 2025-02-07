import { Listener } from "@sapphire/framework";
import { Events, Message } from "discord.js";

export class AutoReactListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageCreate,
		});
	}

	public async run(message: Message) {
		if (message.author.bot) return;
		if (message.client.user.id !== "1271869353389723738") return;

		try {
			// i hate it
			// - ocbwoy3
			if (/fox ?news|(donald ?j? ?)?trump|elon(ia)?( ?musk)?|jd ?vance|republican|maga|make ?america ?great ?again|joe ?rogan/.test(message.content.toLowerCase())) {
				await message.react("<:magahat:1334988593856516268>");
			}
			if (/afd/.test(message.content.toLowerCase())) {
				await message.react("<:AfD:1334990340180021329>");
			}
			if (/(jesse ?)?singal/.test(message.content.toLowerCase())) {
				await message.react("<:uhh:1337362664137031761>");
			}
		} catch (error) {
			this.container.logger.error(`Failed to react to message: ${error}`);
		}
	}
}

export default AutoReactListener;
