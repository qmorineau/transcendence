import { pageManager } from "../../../pong.js";
import apiLobby from "../api/apiLobby.js";
import apiTournament from "../api/apiTournament.js";
import lobbyPage from "../../view/updatePages/updateLobbyPage.js";

async function leaveLobby()
{
	const res = await apiTournament.leaveTournament();
	if (res.error)
		pageManager.error(res.error);
	else
		pageManager.switchChild("menuPage", "mainMenu");
}

async function startLobby()
{
	const res = await apiTournament.startTournament();
	if (res.error)
		pageManager.error(res.error);
}

async function readyLobby()
{
	const res = await apiLobby.lobbyReady();
	if (res.error)
		return pageManager.error(res.error);
	const json = JSON.parse(res.body);
	lobbyPage.updateLobby(json.isReady);
}

async function lobbyPageController(page, key)
{
    switch(key)
    {
        case "escape":
            leaveLobby();
            break;
        case "s":
			startLobby();
            break;
        case "r":
			readyLobby();
            break;
    }
}

export default lobbyPageController