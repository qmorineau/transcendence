import { pageManager } from "../../pong.js";

import authPageController from "./pageHandler/authPageController.js"
import lobbyPageController from "./pageHandler/lobbyPageController.js"
import privateMatchPageController from "./pageHandler/privateMatchPageController.js"
import profilPageController from "./pageHandler/profilPageController.js"
import tournamentPageController from "./pageHandler/tournamentPageController.js"
import menuPageController from "./pageHandler/menuPageController.js";
import waitingRoomPageController from "./pageHandler/waitingRoomPageController.js";
import friendsPageController from "./pageHandler/friendsPageController.js";

function keyHandler(key)
{
	switch (pageManager.currentPage.name)
	{
		case "authPage":
			authPageController.authKeyHandler(pageManager.currentPage, key);
			break;
		case "lobbyPage":
			lobbyPageController(pageManager.currentPage, key);
			break;
		case "privateMatchPage":
			privateMatchPageController.privateMatchKeyHandler(pageManager.currentPage, key);
			break;
		case "profilPage":
			profilPageController.profilPageKeyHandler(pageManager.currentPage, key);
			break;
		case "tournamentPage":
			tournamentPageController.tournamentKeyHandler(pageManager.currentPage, key);
			break;
		case "menuPage":
			menuPageController(pageManager.currentPage, key);
			break;
		case "waitingRoomPage":
			waitingRoomPageController(pageManager.currentPage, key);
			break;
		case "friendsPage":
			friendsPageController.friendsKeyHandler(pageManager.currentPage, key);
			break;
		case "errorPage":
			pageManager.hideError();
			break;
	}
	pageManager.render();
}

// Key detection

function isEnter(key)
{
	const str = String(key);
	if (str.charCodeAt(0) == 13 && !str.charCodeAt(1))
		return true;
	return false
}

function isEscape(key)
{
	const str = String(key);
	if (str.charCodeAt(0) == 27 && !str.charCodeAt(1))
		return true;
	return false
}

function isArrowUp(key)
{
	if (String(key).charCodeAt(2) == 66)
		return true;
	return false
}

function isArrowDown(key)
{
	if (String(key).charCodeAt(2) == 65)
		return true;
	return false
}

function isArrowLeft(key)
{
	if (String(key).charCodeAt(2) == 68)
		return true;
	return false
}

function isArrowRight(key)
{
	if (String(key).charCodeAt(2) == 67)
		return true;
	return false
}

function keyName(key)
{
	if (isArrowDown(key))
		return "up";
	else if (isArrowUp(key))
		return "down";
	else if (isArrowLeft(key))
		return "left";
	else if (isArrowRight(key))
		return "right";
	else if (isEscape(key))
		return "escape";
	else if (isEnter(key))
		return "enter";
	else
		return String(key);
}

export default {keyHandler, keyName};