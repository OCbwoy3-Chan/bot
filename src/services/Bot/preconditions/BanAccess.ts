import { Precondition } from "@sapphire/framework";
import type {
	CommandInteraction,
	ContextMenuCommandInteraction,
	Message,
} from "discord.js";
import { general } from "../../../locale/commands";
import { IsWhitelisted } from "../../Database/helpers/DiscordWhitelist";

export class BanAccessPrecondition extends Precondition {
	public override async messageRun(message: Message) {
		return this.error({ message: "Unsupported" });
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		if (await IsWhitelisted(interaction.user.id)) {
			return this.ok();
		} else {
			interaction.reply({
				content:
					general.errors.missingPermission("WHITELIST") +
					"\n> If you are looking up an user and are not a 112 moderator, please use [ocbwoy3.dev](<https://ocbwoy3.dev/lookup>) instead.",
				ephemeral: true,
			});
			return this.error({ message: "Disallowed" });
		}
	}

	public override async contextMenuRun(
		interaction: ContextMenuCommandInteraction
	) {
		return this.error({ message: "Unsupported" });
	}
}
