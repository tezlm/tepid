const { MessageEmbed } = require("discord.js");
const bent = require("bent")("json", "https://en.wikipedia.org/w/api.php");
const search = query => bent(`?format=json&action=opensearch&search=${query}&namespace=0&limit=1&redirects=resolve`);
const info = page => bent(`?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${page}`);
const thumbnail = page => bent(`?action=query&titles=${page}&prop=pageimages&format=json&pithumbsize=600`);

function trim(text) {
	if(text.length < 1000) return text;
	return text.slice(0, 1000) + "...";
}

function getPage(obj) {
	const key = Object.keys(obj.query.pages)[0];
	if(!key) return null;
	return obj.query.pages[key];
}

module.exports = async (msg, argv) => {
	const [, title, , url] = await search(encodeURIComponent(argv.slice(1).join(" ")));
	const data = getPage(await info(encodeURIComponent(title)));
	const thumb = getPage(await thumbnail(encodeURIComponent(title)));
	if(!data) return "couldnt find that";
	const embed = new MessageEmbed();
	embed.setTitle(title[0]);
	embed.setURL(url[0]);
	embed.setColor(0x2CB1DD);
	embed.setDescription(trim(data.extract));
	embed.setAuthor("wikipedia");
	if(thumb.source) embed.setThumbnail(thumb.source);
	console.log(embed);
	msg.channel.send(embed)
	return embed;
}
