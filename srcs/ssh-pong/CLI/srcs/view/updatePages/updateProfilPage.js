import { pageManager } from "../../../pong.js";
import apiUser from "../../controller/api/apiUser.js";

async function updateProfilLogin(login)
{
	const keysMenu = pageManager.currentPage.getChildOfChild("keysMenu");
	keysMenu.setContent("Press [ESC] to go back / [F] to ask as friend");

	const resNames = await apiUser.userNamesInfo(login);
	if (resNames.error)
		return pageManager.error(resNames.error);
	const namesJson = JSON.parse(resNames.body);

	const resElo = await apiUser.userEloInfo(login);
	if (resElo.error)
		return pageManager.error(resElo.error);
	const eloJson = JSON.parse(resElo.body);

	const resMatch = await apiUser.userMatchInfo(login);
	if (resMatch.error)
		return pageManager.error(resMatch.error);
	const matchJson = JSON.parse(resMatch.body);

	const profilList = pageManager.currentPage.getChildOfChild("profilList");
	profilList.clearItems();
	profilList.add(`Login : ${login}`);
	profilList.add(`First Name : ${namesJson.firstName}`);
	profilList.add(`Last Name : ${namesJson.lastName}`);
	profilList.add(`Elo : ${eloJson.elo}`);
	profilList.add(`Total Playtime : ${matchJson.duration}`);

	pageManager.render();
}

async function updateUserProfil()
{
	const keysMenu = pageManager.currentPage.getChildOfChild("keysMenu");
	keysMenu.setContent("Press [ESC] to go back");

	const resMe = await apiUser.userInfo();
	if (resMe.error)
		return pageManager.error(resMe.error);
	const userJson = JSON.parse(resMe.body);

	const resNames = await apiUser.userNamesInfo(userJson.login);
	if (resNames.error)
		return pageManager.error(resNames.error);
	const namesJson = JSON.parse(resNames.body);

	const resElo = await apiUser.userEloInfo(userJson.login);
	if (resElo.error)
		return pageManager.error(resElo.error);
	const eloJson = JSON.parse(resElo.body);

	const resMatch = await apiUser.userMatchInfo(userJson.login);
	if (resMatch.error)
		return pageManager.error(resMatch.error);
	const matchJson = JSON.parse(resMatch.body);

	const profilList = pageManager.currentPage.getChildOfChild("profilList");	

	profilList.clearItems();
	profilList.add(`Login : ${userJson.login}`);
	profilList.add(`First Name : ${namesJson.firstName}`);
	profilList.add(`Last Name : ${namesJson.lastName}`);
	profilList.add(`Elo : ${eloJson.elo}`);
	profilList.add(`Total Playtime : ${matchJson.duration}`);

	pageManager.render();
}

async function updateMatchHistory()
{
	const list = pageManager.currentPage.getChildOfChild("matchList");
	list.clearItems();

	const resMe = await apiUser.userInfo();
	if (resMe.error)
		return pageManager.error(resMe.error);
	const userJson = JSON.parse(resMe.body);

	const resHistory = await apiUser.userMatchHistory(userJson.login);
	if (resHistory.error)
		return pageManager.error(resHistory.error);
	const historyList = JSON.parse(resHistory.body).items

	for (const item of historyList)
	{
		if (item.p1Score < item.p2Score)
			list.addItem(`{red-fg}${item.player1}{/red-fg} Vs {green-fg}${item.player2}{/green-fg} => {red-fg}${item.p1Score}{/red-fg} / {green-fg}${item.p2Score}{/green-fg}`);
		else
			list.addItem(`{green-fg}${item.player1}{/green-fg} Vs {red-fg}${item.player2}{/red-fg} => {green-fg}${item.p1Score}{/green-fg} / {red-fg}${item.p2Score}{/red-fg}`);
	}
	pageManager.render();
}

export default {updateUserProfil, updateProfilLogin, updateMatchHistory};