import blessed from "neo-blessed"
import utils from "./utilsCreatePage.js";

const infoContainer = {
	top: 0,
	align: "center",
	width: "100%",
	bg: "black",
	fg: "red",
	content: "Press [ESC] to leave the waiting room",
	height: 1,
}

const loadingContainer = {
	align: "center",
	valign: "middle",
	width: "100%",
	bg: "black",
	fg: "white",
	top: 1,
	bottom: 0,
}

function createWaitingRoomPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const loading = blessed.box(loadingContainer);
	const info = blessed.box(infoContainer);

	page.register("info", info);
	page.register("loading", loading);
}

export default createWaitingRoomPage;