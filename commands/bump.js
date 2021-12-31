const bumps = new Map();

function parseTime(str) {
	const timeRegex = /^([0-9]+)([a-z]+)$/i;
	if(!timeRegex.test(str)) throw "invalid time";
	const [_, timeStr, mod] = str.match(timeRegex);
	let time = parseInt(timeStr);
	if(!isFinite(time)) throw "too long!";
	switch(mod) {
		case "w": time *= 7;
		case "d": time *= 24;
		case "h": time *= 60;
		case "m": time *= 60;
		case "s": time *= 1000;
		break;
		default: throw "unknown modifier";
	}
	return time;
}

export default async (msg, argv) => {
	if(!msg.channel.isThread()) throw "cannot bump in a non-thread channel";
	if(!argv[1]) throw 'either provide a time or "stop"';
	if(argv[1] === "stop") {
		if(!bumps.has(msg.channelId)) throw "not bumping";
		const { interval, timeout } = bumps.get(msg.channelId);
		clearInterval(interval);
		clearTimeout(timeout);
		bumps.delete(msg.channelId);
		return "stopped bumping this thread";
	}
	if(bumps.has(msg.channelId)) throw "already bumping";
	const time = parseTime(argv[1]);
	const interval = setInterval(async () => {
		await msg.channel.setArchived(false).catch(() => clearInterval(interval));
	// }, 1000 * 60 * 30);
	}, 1000 * 10);
	const timeout = setTimeout(() => clearInterval(interval), time);
	bumps.set(msg.channelId, { interval, timeout });
	return "keeping this channel alive";
};

