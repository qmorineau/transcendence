
// Classes
import PageManager from "./classes/PageManager.js"
import Page from "./classes/Page.js"

// Create Pages
import createAuthPage from "./createPages/createAuthPage.js"
import createGamePage from "./createPages/createGamePage.js";
import createLobbyPage from "./createPages/createLobbyPage.js";
import createPrivateMatchPage from "./createPages/createPrivateMatchPage.js";
import createProfilPage from "./createPages/createProfilPage.js";
import createTournamentPage from "./createPages/createTournamentPage.js";
import createMenuPage from "./createPages/createMenuPage.js";
import createWaitingRoomPage from "./createPages/createWaitingRoomPage.js";
import createFriendsPage from "./createPages/createFriendsPage.js";
import createErrorPage from "./createPages/createErrorPage.js";

// API
import apiGame from "../controller/api/apiGame.js";

// Variable
import { gameConfig } from "../../pong.js";

function initPageManager(screen)
{
	// Instanciate manager
	const pageManager = new PageManager(screen);
	
	// Array of name
	const pageNames =
	[
		"authPage",
		"gamePage",
		"lobbyPage",
		"privateMatchPage",
		"profilPage",
		"tournamentPage",
		"menuPage",
		"waitingRoomPage",
		"friendsPage",
		"errorPage"
	]

	// Object to link name and function
	const pageBuilder =
	{
		"authPage": createAuthPage,
		"gamePage": createGamePage,
		"lobbyPage": createLobbyPage,
		"privateMatchPage": createPrivateMatchPage,
		"profilPage": createProfilPage,
		"tournamentPage": createTournamentPage,
		"menuPage": createMenuPage,
		"waitingRoomPage": createWaitingRoomPage,
		"friendsPage": createFriendsPage,
		"errorPage": createErrorPage,
	}

	// Instantiate, create page then register in manager
	for (const name of pageNames)
	{
		const newPage = new Page(screen, name);
		pageManager.register(newPage);
		const pageCreator = pageBuilder[name];
		if (pageCreator)
			pageCreator(newPage);
	}
	pageManager.switch("menuPage");
	screen.render();
	return pageManager;
}

async function initGameConfig()
{
	if (!gameConfig.map)
	{
		const res = await apiGame.gameConfig();
		const json = JSON.parse(res.body);
		gameConfig.map = json.map;
		gameConfig.playerX = json.playerX;
		gameConfig.paddleSize = json.paddleSize;
	}
}

export default { initPageManager, initGameConfig}