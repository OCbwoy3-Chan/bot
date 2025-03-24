import { Precondition } from "@sapphire/framework";
import type {
	CommandInteraction,
	ContextMenuCommandInteraction,
	Message
} from "discord.js";
import { r } from "112-l10n";

export class OwnerOnlyPrecondition extends Precondition {
	public override async messageRun(message: Message) {
		return this.error({ message: "Unsupported" });
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		if (interaction.user.id === process.env.OWNER_ID) {
			return this.ok();
		} else {
			interaction.reply({
				content: await r(interaction, "errors:not_bot_owner"),
				ephemeral: true
			});
			return this.error({
				message: await r(interaction, "errors:not_bot_owner")
			});
		}
	}

	public override async contextMenuRun(
		interaction: ContextMenuCommandInteraction
	) {
		return this.error({ message: "Unsupported" });
	}
}
