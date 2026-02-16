import blessed from "neo-blessed"
import utils from "./utilsCreatePage.js"
import profilPageController from "../../controller/pageHandler/profilPageController.js";

const listContainer = {
	name: "profilList",
	top: 3,
	bottom: 0,
	width: "100%",
	align: "left",
	style: {
		selected: {
			bg: "black",
			fg: "white",
		},
		bg: "black",
		fg: "white",
	}
}

const matchListContainer = {
	tags: true,
	name: "matchList",
	top: 3,
	bottom: 0,
	width: "100%",
	align: "left",
	scrollable: true,
	alwaysScroll: true,
	scrollbar: {
		ch: ' ',
		track: {
			bg: 'grey'
		},
		style: {
			bg: 'white'
		}
	},
	keys: true,
	mouse: true,
	style: {
		selected: {
			bold: true,
			bg: "black",
			fg: 11,
		},
		bg: "black",
		fg: "white",
	}
}

const searchInput = {
	name: "searchInput",
	top: 3,
	left: 1,
	bottom: 0,
	inputOnFocus: true,
	bg: "black",
	fg: "white",
}

function initSearch(searchContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Search a profil");

	const input = blessed.textbox(searchInput);
	profilPageController.eventHandlerSearch(input);

	searchContainer.append(keys);
	searchContainer.append(title);
	searchContainer.append(input);
}

function initHistory(historyContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Matches History");

	const matchList = blessed.list(matchListContainer);

	historyContainer.append(keys);
	historyContainer.append(title);
	historyContainer.append(matchList);
}

function initProfil(profilCTN)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Profil");

	const list = blessed.list(listContainer);

	profilCTN.append(keys);
	profilCTN.append(title);
	profilCTN.append(list);
}



function createProfilPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const profil = blessed.box(utils.getBaseContainer());
	initProfil(profil);

	const search = blessed.box(utils.getBaseContainer());
	initSearch(search);

	const history = blessed.box(utils.getBaseContainer());
	initHistory(history);
	
	page.register("profil", profil);
	page.register("search", search);
	page.register("history", history);
}

export default createProfilPage;