const Discord = require("discord.js");
const { emojis } = require("../config.json");
const delay = ms => new Promise((res) => setTimeout(res, ms));

function getStatus(msg) {
	const status = msg.member.presence.clientStatus;
	for(let i in status) {
		return `${emojis[i][status[i]]} ${status[i]}`;
	}
	return `${emojis.offline} offline/invis`;
}

function getEmbed(msg) {
	const pfp = msg.author.displayAvatarURL({ size: 4096, format: "png" });
	return new Discord.MessageEmbed()
		.setTitle("user info")
		.setAuthor(msg.author.tag + (msg.author.bot ? emojis.bot : ""), pfp, pfp)
}

function updateEmbed(embed, old, cur) {
	let changed = false;
	const fields = [];
	if(old.color !== cur.color) {
		changed = true;
		embed.setColor(cur.color);
	}
	for(let i in cur.fields) {
		if(cur.fields[i] !== old.fields[i]) {
			changed = true;
		}
		if(cur.fields[i]) {
			fields.push({ name: i, value: cur.fields[i], inline: true });
		}
	}
	embed.setFields(fields);
	return changed;
}

/*
missing badges:

TEAM_USER
BUGHUNTER_LEVEL_2
VERIFIED_BOT
DISCORD_CERTIFIED_MODERATOR
*/

function getData(msg) {
	return {
		color: msg.member.displayColor || 0x2CB1DD,
		fields: {
			status: getStatus(msg),
			// bot: msg.author.bot.toString(),
			id: msg.author.id,
			badges: msg.author.flags.toArray().map(i => emojis.badges[i]).filter(i => i).join(" "),
		}
	};
}

async function update(embed, msg, sent) {
	let old = getData(msg);
	while(!msg.deleted) {
		let cur = getData(msg);
		if(updateEmbed(embed, old, cur)) sent.edit({ embeds: [embed] });
		old = cur;
		await delay(1000);
	}
}

module.exports = async (msg, argv) => {
	const embed = getEmbed(msg);
	updateEmbed(embed, { fields: {} }, getData(msg));
	const sent = await msg.reply({ embeds: [embed] });
	update(embed, msg, sent);
	return sent;
}

