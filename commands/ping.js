import config from "../config.js";

export default (msg) => {
	msg.react(config.emojis.pong);
}
