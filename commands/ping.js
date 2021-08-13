const config = require("../config.json");

module.exports = (msg) => {
	msg.react(config.emojis.pong);
}
