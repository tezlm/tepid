import Discord from "discord.js";
import config from "../config.js";
const { emojis } = config;
const delay = ms => new Promise((res) => setTimeout(res, ms));

async function getMember(msg, argv) {
	if(!argv[1]) return msg.member;
	const id = argv[1].match(/[0-9]+/)?.[0] || "";
	const member = msg.guild.members.cache.get(id);
	if(member) return member;
	const guilds = [];
	msg.client.guilds.cache.each(g => guilds.push(g));
	for(let guild of guilds) {
		const member = await guild.members.fetch(id).catch(() => null);
		if(member) return member;
	}
}

function getStatus(member) {
	const status = member?.presence?.clientStatus;
	if(!status) return `${emojis.offline} offline/invis`;
	for(let i in status) {
		return `${emojis[i][status[i]]} ${status[i]}`;
	}
	return `${emojis.offline} offline/invis`;
}

function getEmbed(member) {
	const pfp = member.user.displayAvatarURL({ size: 4096, format: "png" });
	return new Discord.MessageEmbed()
		.setTitle("user info")
		.setAuthor(member.user.tag, pfp, pfp)
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

function getData(member) {
	let badges = member.user.flags?.toArray().map(i => emojis.badges[i]).filter(i => i).join(" ") ?? "";
	if(member.user.bot) badges += " " + emojis.bot;
	return {
		color: member.displayColor || 0x2CB1DD,
		fields: {
			status: getStatus(member),
			id: member.user.id,
			created: `<t:${Math.floor(member.user.createdTimestamp / 1000)}>`,
			nickname: member.nickname,
			badges,
		}
	};
}

async function update(embed, member, msg, sent) {
	let old = getData(member);
	while(!msg.deleted) {
		let cur = getData(member);
		if(updateEmbed(embed, old, cur)) sent.edit({ embeds: [embed] });
		old = cur;
		await delay(500);
	}
}

export default async (msg, argv) => {
	const member = await getMember(msg, argv);
	if(!member) throw "couldn't find that user";
	const embed = getEmbed(member);
	updateEmbed(embed, { fields: {} }, getData(member));
	const sent = await msg.reply({ embeds: [embed] });
	update(embed, member, msg, sent);
	return sent;
}

