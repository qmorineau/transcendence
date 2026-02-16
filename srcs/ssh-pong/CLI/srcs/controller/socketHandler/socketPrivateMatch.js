import { pageManager } from "../../../pong.js";
import updateGamePage from "../../view/updatePages/updateGamePage.js";
import apiGame from "../api/apiGame.js";

function manageInviteMessage(message)
{
	pageManager.switch("privateMatchPage");
	const login = pageManager.currentPage.childs.get("login");
	login.setContent(message.player);
	pageManager.render();
}

async function manageAcceptMessage(message)
{
	if (message.start && message.start == true)
	{
		pageManager.switch("gamePage");
		updateGamePage.updateName(message.p1, message.p2);
		const res = await apiGame.gameSide();
		const json = JSON.parse(res.body);
		if (json.game && json.game.side)
			pageManager.user.side = json.game.side;
		await apiGame.gameResume();
	}
}

export default {manageInviteMessage, manageAcceptMessage};