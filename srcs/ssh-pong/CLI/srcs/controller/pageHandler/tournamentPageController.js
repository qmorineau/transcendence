import { pageManager } from "../../../pong.js";
import apiTournament from "../api/apiTournament.js";
import lobby from "../../view/updatePages/updateLobbyPage.js"
import updateTournamentPage from "../../view/updatePages/updateTournamentPage.js";

// ============ Event Handler ===============
function eventHandlerCreate(aliasInput, maxPlayerInput)
{
    aliasInput.on("submit", () => {
        aliasInput.cancel()
        maxPlayerInput.focus();
        pageManager.render();
    })
    maxPlayerInput.on("submit", async () => {
        const res = await apiTournament.createTournament({
            "alias": aliasInput.getValue(),
            "maxPlayer": Number(maxPlayerInput.getValue())
        });
		aliasInput.clearValue();
		maxPlayerInput.clearValue();
        if (res.error)
            return pageManager.error(res.error);
        else
        {
            aliasInput.clearValue();
            maxPlayerInput.clearValue();
            pageManager.switch("lobbyPage");
            lobby.updateLobby();
        }
        pageManager.render();
    })
}

function eventHandlerJoin(aliasInput, lobbyInput)
{
    aliasInput.on("submit", () => {
        aliasInput.cancel()
        lobbyInput.focus();
        pageManager.render();
    })
    lobbyInput.on("submit", async () => {
        const res = await apiTournament.joinTournament({
            "alias": aliasInput.getValue(),
            "room": Number(lobbyInput.getValue())
        });
		aliasInput.clearValue();
		lobbyInput.clearValue();
        if (res.error)
			return pageManager.error(res.error);
        else
        {
            aliasInput.clearValue();
            lobbyInput.clearValue();
            pageManager.switch("lobbyPage");
            lobby.updateLobby();
        }
        pageManager.render();
    })
}

// ============ Key Handler =================

async function tournamentOverviewKeyHandler(key)
{
	switch(key)
	{
		case "r":
			await updateTournamentPage.updateReadyState();
			break;
		case "escape":
			if (pageManager.pages.get("tournamentPage").childs.get("overview").children.find(child => child.name === "keysMenu").getText().search("[R]") == -1)
				pageManager.switchChild("menuPage", "mainMenu");
			break;
	}
}

async function tournamentKeyHandler(page, key)
{
	switch(page.currentChild)
	{
		case page.childs.get("overview"):
			tournamentOverviewKeyHandler(key);
			break;
		default:
			if (key == "escape")
			{
				apiTournament.leaveTournament();
				pageManager.switchChild("menuPage", "tournamentMenu");
			}
			break;
	}
	pageManager.render();
}

export default {tournamentKeyHandler, eventHandlerCreate, eventHandlerJoin}