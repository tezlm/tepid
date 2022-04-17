import config from "../config.js";

export default async (msg) => {
	msg.react(config.emojis.pong);
}
