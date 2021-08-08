require("dotenv").config();
const intents = [
	"GUILDS",
	"GUILD_MEMBERS",
	"GUILD_BANS",
	"GUILD_EMOJIS_AND_STICKERS",
	"GUILD_INTEGRATIONS",
	"GUILD_WEBHOOKS",
	"GUILD_INVITES",
	"GUILD_VOICE_STATES",
	"GUILD_PRESENCES",
	"GUILD_MESSAGES",
	"GUILD_MESSAGE_REACTIONS",
	"GUILD_MESSAGE_TYPING",
	"DIRECT_MESSAGES",
	"DIRECT_MESSAGE_REACTIONS",
	"DIRECT_MESSAGE_TYPING",
];

const Discord = require("discord.js");
const client = new Discord.Client({ intents });
const commands = new Map();
const listening = new Map();

// manual loading for now
// commands.set("status", require("./commands/status.js"));
commands.set("say", require("./commands/say.js"));
commands.set("whatis", require("./commands/whatis.js"));

client.on("ready", () => {
	client.user.setActivity("vela uwu", { type: "WATCHING" });
	console.log("ready");
});

client.on("messageCreate", async (msg) => {
	// if(msg.author.bot) return;
	if(msg.content[0] !== '$') return;
	const argv = msg.content.slice(1).split(" ");
	if(!commands.has(argv[0])) return;
	listening.set(msg.id, await msg.channel.send(await commands.get(argv[0])(msg, argv)));
});

client.on("messageUpdate", async (old, msg) => {
	if(!listening.has(msg.id)) return;
	const sent = listening.get(msg.id);
	const argv = msg.content.slice(1).split(" ");
	if(!commands.has(argv[0])) return;
	await sent.edit(msg, await commands.get(argv[0])(msg, argv));
});

client.on("messageDelete", async (msg) => {
	if(!listening.has(msg.id)) return;
	await listening.get(msg.id).delete();
});

client.login(process.env.TOKEN);
