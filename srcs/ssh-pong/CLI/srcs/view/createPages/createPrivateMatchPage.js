import blessed from "neo-blessed"
import utils from "./utilsCreatePage.js";

const loginContainer = {
	top: 3,
	bottom: 0,
	align: "center",
	valign: "middle",
	height: 3,
	border: {
		type: "line",
	},
	style: {
		border: {
			bg: "black",
			fg: "green",
		},
		fg: "white",
		bg: "black",
	}
}

const bgContainer = {
	top: 6,
	width: "100%",
	bottom: 0,
	bg: "black",
}

function createPrivateMatchPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [A] to Accept / Press [R] to Refuse");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Someone Challenge You !");

	const login = blessed.box(loginContainer);
	const bg = blessed.box(bgContainer);

	page.register("keys", keys);
	page.register("title", title);
	page.register("login", login);
	page.register("bg", bg);
}

export default createPrivateMatchPage;