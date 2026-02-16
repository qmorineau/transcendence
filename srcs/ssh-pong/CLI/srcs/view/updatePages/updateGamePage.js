import { pageManager } from "../../../pong.js"
import apiGame from "../../controller/api/apiGame.js";

function updateScore(jsonScore)
{
	const gamePage = pageManager.pages.get("gamePage");
	const score = gamePage.childs.get("score");

	const p1 = score.children.find(child => child.name === "p1Score");
	const p2 = score.children.find(child => child.name === "p2Score");

	p1.setContent(String(jsonScore.p1));
	p2.setContent(String(jsonScore.p2));
}

function updateName(p1Login, p2Login)
{
	const gamePage = pageManager.pages.get("gamePage");
    const score = gamePage.childs.get("score");

	const p1 = score.children.find(child => child.name === "p1Name");
	const p2 = score.children.find(child => child.name === "p2Name");

	p1.setContent(p1Login);
	p2.setContent(p2Login);
}

async function updateSide() {
	const res = await apiGame.gameSide();
	if(res.error)
		return pageManager.error(res.error);
	const json = JSON.parse(res.body);
	if (json.game && json.game.side)
		pageManager.user.side = json.game.side;
}

export default {updateScore, updateName, updateSide}