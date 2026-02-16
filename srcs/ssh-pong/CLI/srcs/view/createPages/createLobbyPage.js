import blessed from "neo-blessed"
import utils from "./utilsCreatePage.js"

const lobbyContainer = {
	top: 0,
	left: "center",
	width: "100%",
	height: 3,
	bg: "black",
}

const keysContainer = {
	height: 3,
	bottom: 0,
	width: "100%",
	bg: "black"
}

const lobby = {
	top: 0,
	left: "center",
	align: "center",
	width: 10,
	height: 3,
	border: {
		type: "line"
	},
	style: {
		fg: "cyan",
		bg: "black",
		border: {
			fg: "white",
			bg: "black"
		}
	},
}

const players = {
	top: 3,
	bottom: 3,
	left: "center",
	width: "100%",
	border: {
		type: "line"
	},
	style: {
		fg: "white",
		bg: "black",
		border: {
			fg: "grey",
			bg: "black"
		}
	},
}

const ready = {
	tags: true,
	width: "30%",
	height: 3,
	bottom: 0,
	left: 0,
	border: {
		type: "line"
	},
	style: {
		fg: "white",
		bg: "black",
		border: {
			fg: "red",
			bg: "black"
		}
	},
	content: 'Ready: Press [R]',
	align: "center",
}

const start = {
	width: "30%",
	height: 3,
	bottom: 0,
	right: 0,
	border: {
		type: "line"
	},
	style: {
		fg: "white",
		bg: "black",
		border: {
			fg: "blue",
			bg: "black"
		}
	},
	content: 'Start: Press [S]',
	align: "center",
}

const leave = {
	width: "30%",
	left: "center",
	height: 3,
	bottom: 0,
	border: {
		type: "line"
	},
	style: {
		fg: "white",
		bg: "black",
		border: {
			fg: "yellow",
			bg: "black",
		}
	},
	content: 'Leave: Press [ESC]',
	align: "center",
}

function createLobbyPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const lobbyBg = blessed.box(lobbyContainer);
	const keyBg = blessed.box(keysContainer);

	const lobbyNumber = blessed.box(lobby);
	const playersContainer = blessed.box(players);
	const readyButton = blessed.button(ready);
	const startButton = blessed.button(start);
	const leaveButton = blessed.button(leave);

	lobbyNumber.setContent("100000")
	page.register("lobbyBg", lobbyBg);
	page.register("keyBg", keyBg);
	page.register("lobbyNumber", lobbyNumber);
	page.register("players", playersContainer);
	page.register("ready", readyButton);
	page.register("start", startButton);
	page.register("leave", leaveButton);
}

export default createLobbyPage;