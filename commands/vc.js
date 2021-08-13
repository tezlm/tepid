const VC = require("@discordjs/voice");
const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const fs = require("fs");
const states = new Map();
const audio = [];

for(let i of fs.readdirSync("assets")) {
	audio.push([i, VC.createAudioResource("assets/" + i)]);
}

async function getSong(str) {
	if(!str) audio[Math.floor(Math.random() * audio.length)];
	if(ytdl.validateURL(str.replace(/(^<|>$)/g, ""))) {
		try {
			str = str.replace(/(^<|>$)/g, "");
			const data = await ytdl.getBasicInfo(str);
			return [data.videoDetails.title, VC.createAudioResource(ytdl(str))];
		} catch {
			throw "bad url";
		}
	}
	try {
		const res = await ytsr(str);
		const { url } = res.items.find(i => i.type === "video");
		const data = await ytdl.getBasicInfo(url);
		return [data.videoDetails.title, VC.createAudioResource(ytdl(url))];
	} catch(err) {
		throw "no songs found";
	}
	
}

async function join(channel) {
	const connection = await VC.joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});
	states.set(channel.guild.id, [connection, null]);
}

module.exports = async (msg, argv) => {
	const { channel } = msg.member.voice;
	if(!channel) throw "you need to be in a channel";
	if(channel.type !== "GUILD_VOICE") throw "not a voice channel";
	switch(argv[1]) {
		case "join": {
			if(states.has(channel.guild.id)) throw "already in a voice channel";
			await join(channel);
			return "ready";
		}
		case "play": {
			if(!states.has(channel.guild.id)) await join(channel);
			const state = states.get(channel.guild.id);
			if(state[1]) {
				if(state[1].state.status === "paused") {
					state[1].unpause();
					return "unpaused";
				} else {
					state[1].stop();
				}
			} else {
				state[1] = VC.createAudioPlayer();
				state[0].subscribe(state[1]);
			}
			const sent = await msg.reply("loading...");
			try {
				const song = await getSong(argv.slice(2).join(" "));
				state[1].play(song[1]);
				if(!sent.deleted) await sent.edit(`playing ${song[0]}`);
			} catch(err) {
				if(!sent.deleted) await sent.edit(err);
			}
			return sent;
		}
		case "stop": {
			if(!states.has(channel.guild.id)) throw "not in a voice channel";
			states.get(channel.guild.id)[1].stop();
			states.get(channel.guild.id)[0].destroy();
			states.delete(channel.guild.id);
			return "stopping";
		}
		case "pause":
			if(!states.has(channel.guild.id)) throw "not in a voice channel";
			const player = states.get(channel.guild.id)[1];
			if(player.state.status === "paused") throw "already paused";
			player.pause();
			return "pausing";
	}
}
