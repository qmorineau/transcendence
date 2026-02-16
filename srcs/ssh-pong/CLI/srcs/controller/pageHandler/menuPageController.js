import { pageManager } from "../../../pong.js";

// Utils
import menuSelector from "./menuUtils.js";

// Api
import apiUser from "../api/apiUser.js";

// Update
import updateWaitingRoomPage from "../../view/updatePages/updateWaitingRoomPage.js";
import updateProfil from "../../view/updatePages/updateProfilPage.js";
import updateFriends from "../../view/updatePages/updateFriendsPage.js";

// User
import createUser from "../user/user.js";
import apiLobby from "../api/apiLobby.js";

// Controller
import privateMatchPageCTL from "./privateMatchPageController.js";

// init
import init from "../../view/init.js";

async function authMenuController(key)
{
	const menu = pageManager.currentPage.getChildOfChild("menu");
	if (!menu)
		return ;
	switch(key)
	{
		case "down":
			menuSelector.selectDown(menu);
			break;
		case "up":
			menuSelector.selectUp(menu);
			break;
		case "enter":
			switch (menu.selected)
			{
				case 0:
					pageManager.switchChild("authPage", "login");
					pageManager.currentPage.getChildOfChild("loginInput").focus();
					break;
				case 1:
					pageManager.switchChild("authPage", "register");
					pageManager.currentPage.getChildOfChild("loginInput").focus();
					break;
				case 2:
					const res = await apiUser.guestLogin();
					if (res.error)
						return pageManager.error(res.error);
					createUser(res);
					init.initGameConfig();
					pageManager.switchChild("menuPage", "mainMenu");
					break;
				case 3:
					process.exit(0);
					break;
			}
			break;
		case "escape":
			process.exit(0);
	}
	pageManager.render();
}

function tournamentMenuController(key)
{
	const menu = pageManager.currentPage.getChildOfChild("menu");
	if (!menu)
		return ;
	switch(key)
	{
		case "down":
			menuSelector.selectDown(menu);
			break;
		case "up":
			menuSelector.selectUp(menu);
			break;
		case "enter":
			switch (menu.selected)
			{
				case 0:
					pageManager.switchChild("tournamentPage", "create");
					pageManager.currentPage.getChildOfChild("aliasInput").focus();
					break;
				case 1:
					pageManager.switchChild("tournamentPage", "join");
					pageManager.currentPage.getChildOfChild("aliasInput").focus();
					break;
				case 2:
					pageManager.currentPage.switch("mainMenu");
					break;
			}
			break;
		case "escape":
			pageManager.currentPage.switch("mainMenu");
			break;
	}
}

function friendsMenuController(key)
{
	const menu = pageManager.currentPage.getChildOfChild("menu");
	if (!menu)
		return ;
	switch(key)
	{
		case "down":
			menuSelector.selectDown(menu);
			break;
		case "up":
			menuSelector.selectUp(menu);
			break;
		case "enter":
			switch (menu.selected)
			{
				case 0:
					pageManager.switchChild("friendsPage", "request");
					updateFriends.updateFriendsRequest();
					break;
				case 1:
					pageManager.switchChild("friendsPage", "pending");
					updateFriends.updateFriendsPending();
					break;
				case 2:
					pageManager.switchChild("friendsPage", "list");
					updateFriends.updateFriendsList();
					break;
				case 3:
					pageManager.switchChild("menuPage", "mainMenu");
					break;
			}
			break;
		case "escape":
			pageManager.switchChild("menuPage", "mainMenu");
			break;
	}
}

async function mainMenuController(key)
{
	const menu = pageManager.currentPage.getChildOfChild("menu");
	if (!menu)
		return ;
	switch(key)
	{
		case "down":
			menuSelector.selectDown(menu);
			break;
		case "up":
			menuSelector.selectUp(menu);
			break;
		case "enter":
			switch (menu.selected)
			{
				case 0:
					pageManager.switch("waitingRoomPage");
					const resJoin = await apiLobby.joinMainLobby();
					if (resJoin.error)
						return pageManager.error(resJoin.error);
					updateWaitingRoomPage.startAnimation();
					break;
				case 1:
					privateMatchPageCTL.createPrivateBotMatch();
					break;
				case 2:
					pageManager.currentPage.switch("profilMenu");
					break;
				case 3:
					pageManager.currentPage.switch("friendsMenu");
					break;
				case 4:
					pageManager.currentPage.switch("tournamentMenu");
					break;
				case 5:
					const resLogout = await apiUser.logout();
					if (resLogout.error)
						return pageManager.error(resLogout.error);
					pageManager.user.token = null;
					pageManager.switchChild("menuPage", "authMenu");
					break;
			}
			break;
		case "escape":
			const resLogout = await apiUser.logout();
			if (resLogout.error)
				return pageManager.error(resLogout.error);
			pageManager.user.token = null;
			pageManager.switchChild("menuPage", "authMenu");
			break;
	}
}

function profilMenuController(key)
{
	const menu = pageManager.currentPage.getChildOfChild("menu");
	if (!menu)
		return ;
	switch(key)
	{
		case "down":
			menuSelector.selectDown(menu);
			break;
		case "up":
			menuSelector.selectUp(menu);
			break;
		case "enter":
			switch (menu.selected)
			{
				case 0:
					pageManager.switchChild("profilPage", "profil");
					updateProfil.updateUserProfil();
					break;
				case 1:
					pageManager.switchChild("profilPage", "search");
					pageManager.currentPage.getChildOfChild("searchInput").focus();
					break;
				case 2:
					pageManager.switchChild("profilPage", "history");
					updateProfil.updateMatchHistory();
					pageManager.currentPage.getChildOfChild("matchList").focus();
					break;
				case 3:
					pageManager.currentPage.switch("mainMenu");
					break;
			}
			break;
		case "escape":
			pageManager.currentPage.switch("mainMenu");
			break;
	}
}

function menuPageController(page, key)
{
	switch(page.currentChild)
	{
		case page.childs.get("authMenu"):
			authMenuController(key);
			break;	
		case page.childs.get("profilMenu"):
			profilMenuController(key);
			break;
		case page.childs.get("tournamentMenu"):
			tournamentMenuController(key);
			break;
		case page.childs.get("mainMenu"):
			mainMenuController(key);
			break;
		case page.childs.get("friendsMenu"):
			friendsMenuController(key);
			break;
	}
	pageManager.render();
}

export default menuPageController;