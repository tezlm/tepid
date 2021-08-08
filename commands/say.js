module.exports = async (msg, argv) => {
	return argv.slice(1).join(" ") || "\u200b";
}
