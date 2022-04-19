import bent from "bent";
import { MessageEmbed } from "discord.js";
import config from "../config.js";
const search = bent("json", "https://dynabyte.ca/search");

async function fetch(url, retries = 3) {
	if(retries < 0) throw "couldn't fetch";

	const { results } = await search(url);
	if(!results.length) return fetch(url, retries - 1);
	return results;
}

export default async (msg, argv) => {
	const query = argv.slice(1).join(" ").trim();
	const results = await fetch(`?format=json&q=how%20to%20${encodeURIComponent(query)}`);
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

