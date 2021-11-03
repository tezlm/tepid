require("dotenv").config();
const fs = require("fs");
const config = require("./config.json");
const Discord = require("discord.js");
const readline = require("readline");
const client = new Discord.Client({ intents: config.intents });
const map = new Map();
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "> ",
});

client.on("ready", () => rl.prompt());
rl.on("line", (line) => {
	const argv = line.trim().split(" ").filter(i => i);
	console.log(map.get(argv[0])?.(argv) ?? "");
	rl.prompt();
});

map.set("say", (argv) => {
	const msg = argv.slice(2).join(" ");
	if(!msg) return;
	client.channels.cache.get(argv[1]).send(msg);	
});

map.set("reply", async (argv) => {
	const msg = argv.slice(3).join(" ");
	if(!msg) return;
	const channel = client.channels.cache.get(argv[1]);
	const ref = await channel.messages.fetch(argv[2]);
	ref.reply(msg);
});

client.login(process.env.TOKEN);

