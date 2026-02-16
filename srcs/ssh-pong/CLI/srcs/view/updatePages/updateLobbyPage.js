import { pageManager } from "../../../pong.js";
import blessed from "neo-blessed";
import apiLobby from "../../controller/api/apiLobby.js";

function getPlayerContainer(index) 
{
	return {
		left: 0,
		height: 1,
		tags: true,
		top: index,
		keys: true,
		mouse: true,
		scrollable: true,
		alwaysScroll: true,
		scrollbar: {
			ch: ' ',
			inverse: true
		},
		style: {
			bg: "black",
			scrollbar: {
			bg: 'blue'
			}
		}
	}
}

function setLobbyNumber(number)
{
    if (pageManager.currentPage.name == "lobbyPage")
    {
        const lobbyNumber = pageManager.currentPage.childs.get("lobbyNumber");
        lobbyNumber.setContent(number);
    }
}

function addPlayer(player, index)
{
    if (pageManager.currentPage.name == "lobbyPage")
    {
        const playersContainer = pageManager.currentPage.childs.get("players");
        const playerCTN = blessed.box(getPlayerContainer(index));
		if (player.isReady)
			playerCTN.setContent('{green-fg}' + player.alias + '{/}');
        else
            playerCTN.setContent(`{red-fg}${player.alias}{/}`);
        playersContainer.append(playerCTN);
    }
}

async function cleanPlayersContainer()
{
     if (pageManager.currentPage.name == "lobbyPage")
    {
        const playersContainer = pageManager.currentPage.childs.get("players");
		for (const child of [...playersContainer.children]) {
			playersContainer.remove(child);
			child.detach();
			child.destroy();  
        }
		pageManager.render();
    }
}

async function updateLobby(isUserReady)
{
    if (pageManager.currentPage.name == "lobbyPage")
    {
        const res = await apiLobby.lobby();
        const json = JSON.parse(res.body);
        if (json.error)
			return pageManager.error(json.error);
        else
        {
            await cleanPlayersContainer();
            setLobbyNumber(String(json.lobby));
            for (const [index, [login, player]] of Object.entries(json.players).entries())
                addPlayer(player, index);
        }
		const readyCTN = pageManager.currentPage.childs.get("ready");
		if (isUserReady)
		{
			readyCTN.style.border.fg = "green";
			readyCTN.setContent("Ready: Press [R]")
		}
		else if (isUserReady != null)
		{
			readyCTN.style.border.fg = "red";
			readyCTN.setContent("Not Ready: Press [R]")
		}
		pageManager.render();
    }
}

export default {updateLobby, setLobbyNumber, addPlayer};