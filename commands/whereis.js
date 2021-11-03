const config = require("../config.json");
const { basename, extname, dirname } = require("path");
const { MessageEmbed } = require("discord.js");
const fs = require("fs");
const fuzzysort = require("fuzzysort");
const bent = require("bent")("json", "https://api.github.com/", { "User-Agent": "lollolol" });
const fetch = require("bent")("string", "https://raw.githubusercontent.com/");
const fetchFile = (repo, file) => fetch(`${repo}/master/${file}`);
const link = (repo, file) => `https://github.com/${repo}/blob/master/${encodeURIComponent(file)}`;
const day = Date.now() + 1000 * 60 * 60 * 24;
const files = [];
const cache = new Map();

const exts = {
	images: ["png", "jpeg", "jpg", "gif"],
	text: ["java", "js", "txt", "css", "html", "yml", "json", "hjson", "gradle", "kt", "c++", "c", "rs", "cs", "xml", "sln", "h", "md"],
};

function firstNLines(str, n = 20) {
	let out = "", lines = 0;
	for(let i = 0; lines < n && i < str.length; i++) {
		out += str[i];
		if(str[i] === "\n") lines++;
	}
	return out.slice(0, 1500);
}

async function fetchTree(repo) {
	for(let branch of ["master", "main"]) {
		try {
			return await bent(`repos/${repo}/git/trees/${branch}?recursive=true`)
		} catch {}
	}
	throw "cannot find " + repo;
}

async function read(repo) {
	if(!fs.existsSync("data/" + repo)) return [await fetchTree(repo), true];
	if(fs.statSync("data/" + repo).mtimeMs < Date.now() - day) return [await fetchTree(repo), true];
	return [JSON.parse(fs.readFileSync("data/" + repo, "utf8")), false];
}

async function load(repo) {
	const [data, shouldWrite] = await read(repo);
	if(shouldWrite) {
		if(!fs.existsSync("data/" + repo)) fs.mkdirSync(dirname("data/" + repo), { recursive: true });
		fs.writeFileSync("data/" + repo, JSON.stringify(data));
	}
	const filtered = data.tree.filter(i => i.type === "blob");
	const mapped = filtered.map(i => ({
		key: fuzzysort.prepare(basename(i.path)),
		name: basename(i.path),
		path: i.path,
		repo,
	}));
	files.push(...mapped);
	console.log(`${shouldWrite ? "[f] " : "[c] "}loaded ${repo}`);
}

async function getFile(embed, { repo, path }) {
	const ext = extname(path).slice(1);
	if(exts.images.includes(ext)) {
		embed.setImage(`https://raw.githubusercontent.com/${repo}/master/${encodeURIComponent(path)}`);
	} else if(exts.text.includes(ext)) {
		if(!cache.has(`${repo}:${path}`)) {
			const fetched = await fetchFile(repo, path);
			cache.set(`${repo}:${path}`, {
				view: firstNLines(fetched),
				len: fetched.length,
				lines: (fetched.trim().match(/\n/g) || '').length + 1,
			});
		}
		const got = cache.get(`${repo}:${path}`);
		embed.setDescription("```" + (ext === "hjson" ? "js" : ext) + "\n" + got.view + "\n```");
		embed.addField("length", got.len.toString(), true);
		embed.addField("lines", got.lines.toString(), true);
	} else {
		embed.setDescription("*binary file*");
	}
	embed.addField("repo", repo, true);
}

module.exports = async (msg, argv) => {
	const search = argv.slice(1).join(" ");
	if(!search) return new MessageEmbed().setTitle("no search").setColor(config.color.default);
	const results = fuzzysort.go(search, files, { limit: 5, threshold: -500, key: "key" });
	const exact = results.length === 1 ? results[0] : results.find(i => i.score === 0);
	if(exact) {
		const res = exact.obj;
		const embed = new MessageEmbed()
			.setTitle(res.name)
			.setURL(link(res.repo, res.path))
			.setColor(config.color.default);
		await getFile(embed, res);
		return embed;
	} else if(results.length) {
		const links = results.map(i => `[${i.obj.name}](${link(i.obj.repo, i.obj.path)})`);
		return new MessageEmbed()
			.setDescription(links.join("\n"))
			.setColor(config.color.default);
	} else {
		return new MessageEmbed()
			.setTitle("no results")
			.setColor(config.color.error);
	}
}

load("anuken/mindustry");
load("anuken/arc");
load("sk7725/betamindy");
load("sh1penfire/pixelcraft");
load("bluewolf3682/exotic-mod");
load("qmelz/hackustry");
// load("ppy/osu");
load("torvalds/linux");
// load("nodejs/node");
// load("sample-text-here/community-mod");
load("sh1penfire/endless-rusting");
// load("meltdown-altair/opposing-front");
load("Pietro303HD/ShitShow");

