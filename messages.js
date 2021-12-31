import bent from "bent";
import config from "./config.js";
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

const checkScam = bent("https://anti-fish.bitflow.dev/", "POST", "json", 200, 404);
const scamReplies = [config.emojis.warn + " scam link", "no", "go away", "shut", "i tried it, why no work??"];
const linkRegex = /https?:///i; // just to check

class Counter extends Map {
	constructor(lifetime = 30 * 1000) {
		super();
		this.lifetime = lifetime;
	}
	
	add(k) {
		if(!this.has(k)) this.set(k, 0)
		this.set(k, this.get(k) + 1);
		setTimeout(() => {
			this.set(k, this.get(k) - 1);
		}, this.lifetime);
	}
}

const messages = new Counter();

async function scam(msg) {
	if(!linkRegex.test(msg.content)) return;
	const res = await checkScam(
		"check",
		{ message: msg.cleanContent },
		{ "User-Agent": "tepidlemonade" },
	);

	if(res.match) {
		if(!msg.deletable) return msg.reply(rnd(scamReplies));
		await msg.delete();
		const dm = await msg.author.createDM();
		dm.send(rnd(scamReplies));
		return null;
	}
}

function checksum(str) {
	let a = 1, b = 0;
	for(let i of Buffer.from(str)) {
		a += i % 0xFFFE;
		b += b + a % 0xFFFE;
	}
	return a << 16 + b;
}

async function spam(msg) {
	if(!msg.deletable) return;
	if(msg.author.id === msg.client.user.id) return;
	let sum = msg.author.id + checksum(msg.content.trim());
	messages.add(sum);
	if(messages.get(sum) > 2) await msg.delete();
}

export default [];

