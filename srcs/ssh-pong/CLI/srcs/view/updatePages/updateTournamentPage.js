import { pageManager } from "../../../pong.js";
import apiTournament from "../../controller/api/apiTournament.js";

async function updateReadyState()
{
	if (pageManager.currentPage.currentChild == pageManager.pages.get("tournamentPage").childs.get("overview"))
	{
		const res = await apiTournament.tournamentReady();
		if (res.error)
			return pageManager.error(res.error);
		const json = JSON.parse(res.body);

		const readyBox = pageManager.currentPage.getChildOfChild("ready");
		if (!readyBox)
			return ;
		if (json.isReady == true)
			readyBox.setContent("{green-fg}Ready{/}");
		else
			readyBox.setContent("{red-fg}Not Ready{/}");
	}
	pageManager.render();
}

async function updateNextOpponent()
{
	if (pageManager.currentPage.currentChild == pageManager.pages.get("tournamentPage").childs.get("overview"))
	{
		const res = await apiTournament.nextOpponent();
		if (res.error)
			return pageManager.error(res.error);
		const json = JSON.parse(res.body);

		if (pageManager.currentPage.currentChild == pageManager.pages.get("tournamentPage").childs.get("overview"))
		{
			const opponent = pageManager.currentPage.getChildOfChild("nextOpponent");
			if (!json.nextOpponent)
				opponent.setContent("Next Opponent: {red-fg}You're not playing anymore{/}");
			else if (!json.nextOpponent.alias)
				opponent.setContent("Next Opponent: {red-fg}Not Decided Yet{/}");
			else
				opponent.setContent("Next Opponent: {yellow-fg}" + json.nextOpponent.alias + "{/}");
			pageManager.render();
		}
	}
}

async function updateRound()
{
	if (pageManager.currentPage.currentChild == pageManager.pages.get("tournamentPage").childs.get("overview"))
	{
		const round = pageManager.currentPage.getChildOfChild("round");
		const ready = pageManager.currentPage.getChildOfChild("ready");

		const res = await apiTournament.tournamentInfo();
		if (res.error)
			return pageManager.error(res.error);
		const json = JSON.parse(res.body);
		round.setContent(`Round: ${json.round}/${json.tree.round}`);
		pageManager.render();
	}
}

async function updateKeysMovement(isLoosing)
{
	const keys = pageManager.currentPage.getChildOfChild("keysMenu");
	if (isLoosing)
		keys.setContent("Press [ESC] to quit tournament");
	else
		keys.setContent("Press [R] to be ready");
	pageManager.render();
}

export default {updateNextOpponent, updateReadyState, updateRound, updateKeysMovement};