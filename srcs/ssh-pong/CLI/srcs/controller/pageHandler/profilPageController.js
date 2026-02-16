import { pageManager } from "../../../pong.js";
import updateProfil from "../../view/updatePages/updateProfilPage.js";
import apiFriends from "../api/apiFriends.js";
import apiUser from "../api/apiUser.js";

async function eventHandlerSearch(searchInput)
{
    searchInput.on("submit", async () => {
		pageManager.switchChild("profilPage", "profil");
		searchInput.cancel();
		
		const resMe = await apiUser.userInfo();
		if (resMe.error)
			return pageManager.error(resMe.error);
		const userJson = JSON.parse(resMe.body);
		
		if (searchInput.getValue() == userJson.login)
			updateProfil.updateUserProfil();
		else
    		updateProfil.updateProfilLogin(searchInput.getValue());
    })
}

function getLoginFromProfil()
{
	const list = pageManager.currentPage.getChildOfChild("profilList");
	const loginLine = list.getItem(0).getText();
	const login = loginLine.replace("Login : ", "");
	return login;
}

async function profilPageKeyHandler(page, key)
{
	switch (page.currentChild)
	{
		case page.childs.get("profil"):
			switch (key)
			{
				case "f":
					const resReq = await apiFriends.friendRequest(getLoginFromProfil());
					if (resReq.error)
						pageManager.error(resReq.error);
					else
						pageManager.error("Friend Request Send");
					break;
				case "escape":
					pageManager.currentPage.childs.get("search").children.find(child => child.name === "searchInput").clearValue();
					pageManager.switchChild("menuPage", "profilMenu");
					break;
			}
			break;
		default: 
			switch(key)
			{
				case "escape":
					pageManager.currentPage.childs.get("search").children.find(child => child.name === "searchInput").clearValue();
					pageManager.switchChild("menuPage", "profilMenu");
					break;
			}
			break;
	}
    pageManager.render();
}

export default {profilPageKeyHandler, eventHandlerSearch}