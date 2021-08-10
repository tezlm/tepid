const config = require("../config.json");
const { MessageEmbed } = require("discord.js");
const bent = require("bent")("json", "https://en.wikipedia.org/w/api.php");
const fetch = require("bent")("json");
const search = query => bent(`?format=json&action=opensearch&search=${query}&namespace=0&limit=1&redirects=resolve`);
const info = page => bent(`?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${page}`);
const thumbnail = page => bent(`?action=query&titles=${page}&prop=pageimages&format=json&pithumbsize=600`);
const wolfram = query => fetch(`https://www.wolframalpha.com/n/v1/api/autocomplete/?i=${query}`);
const wikipediaIcon = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/600px-Wikipedia-logo-v2.svg.png";
const wolframIcon = "https://media.discordapp.net/attachments/777553502431084565/874516342559105085/unknown.png";

function trim(text) {
	if(text.length < 1000) return text;
	return text.slice(0, 1000) + "...";
}

function getPage(obj) {
	if(!obj.query) return null;
	const key = Object.keys(obj.query.pages)[0];
	if(!key) return null;
	return obj.query.pages[key];
}

function parseWolfram(obj) {
	if(!obj.instantMath) return null;
	return obj.instantMath.exactResult || obj.instantMath.approximateResult;
}

module.exports = async (msg, argv) => {
	if(!argv[1]) {
		return new MessageEmbed({
			title: "missing search query",
			color: config.color.error,
		});
	}
	const input = encodeURIComponent(argv.slice(1).join(" "));
	const math = parseWolfram(await wolfram(input));
	if(math !== null) {	
		const embed = new MessageEmbed();
		embed.setTitle(math);
		embed.setURL(`https://www.wolframalpha.com/input/?i=${input}`);
		embed.setColor(config.color.default);
		// embed.setDescription(trim(data.extract));
		embed.setAuthor("wolframalpha", wolframIcon, "https://wolframalpha.com");
		return embed;
	}
	const [, title, , url] = await search(input);
	const data = getPage(await info(encodeURIComponent(title)));
	const thumb = getPage(await thumbnail(encodeURIComponent(title)));
	if(!data) {
		return new MessageEmbed({
			title: "couldnt find that",
			color: config.color.error,
		});
	}
	const embed = new MessageEmbed();
	embed.setTitle(title[0]);
	embed.setURL(url[0]);
	embed.setColor(config.color.default);
	embed.setDescription(trim(data.extract));
	embed.setAuthor("wikipedia", wikipediaIcon, "https://wikipedia.org");
	if(thumb.thumbnail?.source) embed.setThumbnail(thumb.thumbnail.source);
	return embed;
}
