import * as VC from "@discordjs/voice";
import ytsr from "ytsr";
import ytdl from "ytdl-core";
import fs from "fs";
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
	connection.on(VC.VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, 500),
				entersState(connection, VoiceConnectionStatus.Connecting, 500),
			]);
		} catch (error) {
			connection.destroy();
		}
	});
	states.set(channel.guild.id, { conn: connection, queue: [] });
}

async function next(id) {
	const state = states.get(id);
	const pop = state.queue.pop();
	state.audio.stop();
	if(!pop) return;
	await load(id, await getSong(pop));
	state.audio.once("idle", () => next(id));
}

async function load(id, song) {
	const state = states.get(id);
	state.name = song[0];
	state.audio.play(song[1]);	
}

async function createAudio(state) {
	state.audio = VC.createAudioPlayer();
	state.audio.on("error", () => {
		state.audio.stop();
		state.audio = null;
	});
	state.conn.subscribe(state.audio);
}

export default async (msg, argv, old) => {
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
			if(state.audio && state.audio.state.status === "paused") {
				state.audio.unpause();
				return "unpaused";
			} else if(!state.audio) {
				createAudio(state);
			}

			const sent = old ? null : await msg.reply("loading...");
			try {
				if(old) {
					if(state.lastMsgID !== msg.id) return "too late to change";
					await state.audio.stop();
					await old.edit("loading...");
					await load(await getSong(argv.slice(2).join(" ")));
					return `playing ${state.name}`;
				} else {
					state.lastMsgID = msg.id;
					state.queue.push(argv.slice(2).join(" "));
					if(state.audio.state.status === "idle") await next(channel.guild.id);
					if(!sent.deleted) {
						if(state.queue.length) {
							await sent.edit(`queued your song`);
						} else {
							await sent.edit(`playing ${state.name}`);
						}
					}
				}
			} catch(err) {
				if(old) return err;
				if(!sent.deleted) await sent.edit(err);
			}
			return sent;
		}
		case "stop": {
			if(!states.has(channel.guild.id)) throw "not in a voice channel";
			states.get(channel.guild.id).audio.stop();
			states.get(channel.guild.id).conn.destroy();
			states.delete(channel.guild.id);
			return "stopping";
		}
		case "pause": {
			if(!states.has(channel.guild.id)) throw "not in a voice channel";
			const { audio } = states.get(channel.guild.id);
			if(audio.state.status === "paused") throw "already paused";
			audio.pause();
			return "paused";
		}
		case "playing": {
			if(!states.has(channel.guild.id)) throw "not in a voice channel";
			return `playing: ${states.get(channel.guild.id).name}`;
		}
		case "skip": {
			if(!states.has(channel.guild.id)) throw "not in a voice channel";
			await next(channel.guild.id);
			return `playing: ${states.get(channel.guild.id).name}`;
		}
	}
	throw "unknown command";
}
