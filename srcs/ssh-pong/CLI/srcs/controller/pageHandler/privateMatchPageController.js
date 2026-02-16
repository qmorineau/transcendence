import { pageManager } from "../../../pong.js";
import apiPrivate from "../api/apiPrivate.js";
import apiGame from "../api/apiGame.js";

async function createPrivateBotMatch()
{
	const resPrivate = await apiPrivate.privateBotMatch();
	if(resPrivate.error)
		return pageManager.error(resPrivate.error);
	const res = await apiGame.gameSide();
	if(res.error)
		return pageManager.error(res.error);
	const json = JSON.parse(res.body);
	if (json.game && json.game.side)
		pageManager.user.side = json.game.side;
	const resResume = await apiGame.gameResume();
	if(resResume.error)
		return pageManager.error(resResume.error);
	pageManager.switch("gamePage");
}

async function privateMatchKeyHandler(page, key)
{
	const login = pageManager.currentPage.childs.get("login").getText();
    switch(key)
    {
		case "a":
			const resAccept = await apiPrivate.acceptPrivateMatch({"login": login, "accept": true});
			if (resAccept.error)
				pageManager.error(resAccept.error);
			break;
		case "r":
			const resRefuse = await apiPrivate.acceptPrivateMatch({"login": login, "accept": false});
			if (resRefuse.error)
				return pageManager.error(resRefuse.error);
			pageManager.switchChild("menuPage", "mainMenu");
			break;
    }
}

export default { privateMatchKeyHandler, createPrivateBotMatch}