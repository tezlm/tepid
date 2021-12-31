import Discord from "discord.js";
import config from "../config.js";
const { emojis } = config;
const delay = ms => new Promise((res) => setTimeout(res, ms));

class Member {
	constructor(discordMember) {
		this.member = discordMember;
	}

	getStatus() {
		const status = this.member.presence?.clientStatus;
		if(!status) return `${emojis.offline} offline/invis`;
		for(let i in status) {
			return `${emojis[i][status[i]]} ${status[i]}`;
		}
		return `${emojis.offline} offline/invis`;
	}

	getBadges() {
		const badges = this.member.user.flags?.toArray()
			.map(i => emojis.badges[i])
			.filter(i => i) ?? [];
		if(this.member.user.bot) badges.push(emojis.bot);
		return badges.join(" ");
	}

	getColor() {
		return this.member.displayColor || config.color.default;
	}

	getData() {
		return {
			color: this.getColor(),
			fields: {
				status: this.getStatus(),
				id: this.member.user.id,
				created: `<t:${Math.floor(this.member.user.createdTimestamp / 1000)}>`,
				nickname: this.member.nickname,
				badges: this.getBadges(),
			}
		};
	}
}

async function getMember(msg, argv) {
	if(!argv[1]) return new Member(msg.member);
	
	const id = argv[1].match(/[0-9]+/)?.[0] || "";
	const member = msg.guild.members.cache.get(id);
	if(member) return new Member(member);

	const guilds = [];
	msg.client.guilds.cache.each(g => guilds.push(g));
	for(let guild of guilds) {
		const member = await guild.members.fetch(id).catch(() => null);
		if(member) return new Member(member);
	}

	throw "couldnt find that member";
}

function getEmbed(member) {
	const pfp = member.member.user.displayAvatarURL({ size: 4096, format: "png" });
	return new Discord.MessageEmbed()
		.setTitle("user info")
		.setAuthor(member.member.user.tag, pfp, pfp)
		.setTimestamp()
}

function update(embed, old, cur) {
	let changed = false;
	if(old.color !== cur.color) {
		changed = true;
		embed.setColor(cur.color);
	}
	const fields = [];
	for(let i in cur.fields) {
		if(cur.fields[i] !== old.fields[i]) changed = true;
		if(cur.fields[i]) {
			fields.push({ name: i, value: cur.fields[i], inline: true });
		}
	}
	embed.setFields(fields);
	return changed;
}

async function watch(embed, member, msg, sent) {
	let old = member.getData();
	while(!msg.deleted) {
		let cur = member.getData();
		if(update(embed, old, cur)) sent.edit({ embeds: [embed] });
		old = cur;
		await delay(500);
	}
}

export default async (msg, argv) => {
	const member = await getMember(msg, argv);
	const embed = getEmbed(member);
	update(embed, { fields: {} }, member.getData());
	const sent = await msg.reply({ embeds: [embed] });
	watch(embed, member, msg, sent);
	return sent;
}

