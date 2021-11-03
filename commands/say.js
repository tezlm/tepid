module.exports = (msg, argv) => argv.slice(1).join(" ").replace(/@/g, "(at)");
