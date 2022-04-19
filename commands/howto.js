import google from "googlethis";
import { MessageEmbed } from "discord.js";
import config from "../config.js";

export default async (msg, argv) => {
	const query = argv.slice(1).join(" ").trim();
	const { results } = await google.search("how to " + query);
	const embed = new MessageEmbed();
	let text = "";
	for(let result of results.slice(0, 5)) {
		text += `[${result.title}](${result.url})\n`;
	}
	embed.setTitle("how to " + query);
	embed.setColor(config.color.default);
	embed.setDescription(text);
	embed.setTimestamp();
	return embed;
};

