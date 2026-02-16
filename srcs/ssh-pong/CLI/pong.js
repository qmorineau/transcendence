process.env.NODE_TLS_REJECT_UNAUTHORIZED='1'

import blessed from "neo-blessed";
import contrib from "blessed-contrib";
import init  from "./srcs/view/init.js"
import keys from "./srcs/controller/keyHandler.js";
import gamePageController from "./srcs/controller/pageHandler/gamePageController.js";

const screen = blessed.screen({
	smartCSR: true,
	dockBorders: true,
	fullUnicode: true,
	useBCE: true,
	autoPadding: true,
	style: {
		bg: "black"
	}
});

// Init
export const pageManager = init.initPageManager(screen, contrib);
export let gameConfig = {};

// Key handler
export const pressedKeys = new Map();

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", (rawKey) => {
	const key = keys.keyName(rawKey);
	if (pageManager.currentPage.name == "gamePage")
		gamePageController.keyPressGame(key);

	keys.keyHandler(key);
})

// Other key handler
screen.key(["C-c"], function(ch, key) {
	return process.exit(0);
})

screen.render();