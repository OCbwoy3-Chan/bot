import { Listener } from "@sapphire/framework";
import { Events, Message } from "discord.js";

export class AutoReactListener extends Listener {
	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.MessageCreate
		});
	}

	public async run(message: Message) {
		if (message.author.bot) return;
		if (message.client.user.id !== "1271869353389723738") return;

		try {
			// i hate this so much
			// - ocbwoy3
			if (
				/fox ?news|(donald( ?j)? ?)?trump|elon(ia)?( ?musk)?|jd ?vance|republican|maga|make ?america ?great ?again|joe ?rogan/.test(
					message.content.toLowerCase()
				)
			) {
				void message
					.react("<:magahat:1334988593856516268>")
					.catch((a) => {});
			}
			if (
				/afd|alternative ?for ?germany|(alternative?|absteig) ?f[üu]r ?deutschland/.test(
					message.content.toLowerCase()
				)
			) {
				void message
					.react("<:afd:1344575300666916864>")
					.catch((a) => {});
			}
			if (/(alice ?)?w(ei|ie)del/.test(message.content.toLowerCase())) {
				void message
					.react("<:weidel:1344575766645440542>")
					.catch((a) => {});
			}
			if (/(jesse ?)?singal/.test(message.content.toLowerCase())) {
				void message
					.react("<:uhh:1337362664137031761>")
					.catch((a) => {});
			}
			if (/darktru/.test(message.content.toLowerCase())) {
				void message
					.react("<:darktru_:1347537875041914952>")
					.catch((a) => {});
			}
		} catch (error) {
			void this.container.logger.error(
				`Failed to react to message: ${error}`
			);
		}
	}
}

export default AutoReactListener;
