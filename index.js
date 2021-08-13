require("dotenv").config();
const fs = require("fs");
const config = require("./config.json");
const Discord = require("discord.js");
const client = new Discord.Client({ intents: config.intents });
const commands = new Map();
const listening = new Map();

// load commands
for(let cmd of fs.readdirSync("commands")) {
	commands.set(cmd.match(/^[a-z]+/i)[0], require("./commands/" + cmd));
}

// set status
client.on("ready", () => {
	client.user.setPresence({
		activities: [{ name: "shrek", type: "STREAMING", url: "https://www.youtube.com/watch?v=z_HWtzUHm6s" }],
		status: "idle",
	});
	console.log("ready");
});

// parse argv
async function parse(msg, sent) {
	if(msg.content[0] !== ':') return;
	const argv = msg.content.slice(1).split(" ");
	if(!commands.has(argv[0])) return;
	try {
		return await commands.get(argv[0])(msg, argv, sent);
	} catch(err) {
		return new Discord.MessageEmbed()
			.setTitle(err)
			.setColor(config.color.error);
	}
}

// main bot
client.on("messageCreate", async (msg) => {
	const res = await parse(msg, null);
	if(!res) return;
	if(res instanceof Discord.MessageEmbed) {
		listening.set(msg.id, await msg.reply({ embeds: [res] }));
	} else if(res instanceof Discord.Message) {
		listening.set(msg.id, res);
	} else if(res) {
		listening.set(msg.id, await msg.reply(res));
	}
});

client.on("messageUpdate", async (old, msg) => {
	if(!listening.has(msg.id)) return;
	const sent = listening.get(msg.id);
	if(sent.deleted) return;
	const res = await parse(msg, sent);
	if(!res) return;
	if(res instanceof Discord.MessageEmbed) {
		await sent.edit({ embeds: [res] });
	} else {
		await sent.edit(res);
	}
});

client.on("messageDelete", async (msg) => {
	if(!listening.has(msg.id)) return;
	if(listening.get(msg.id).deleted) return;
	await listening.get(msg.id).delete();
});

client.login(process.env.TOKEN);
