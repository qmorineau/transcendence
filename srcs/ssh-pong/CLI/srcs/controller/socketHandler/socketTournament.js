import { pageManager } from "../../../pong.js";
import updateGamePage from "../../view/updatePages/updateGamePage.js";
import updateTournamentPage from "../../view/updatePages/updateTournamentPage.js";
import apiGame from "../api/apiGame.js";

async function startMatch(message)
{
	pageManager.switch("gamePage");
	updateGamePage.updateName(message.p1, message.p2);
	const res = await apiGame.gameSide();
	const json = JSON.parse(res.body);
	if (json.game && json.game.side)
		pageManager.user.side = json.game.side;
	await apiGame.gameResume();
	pageManager.render();
}

function manageTournament(message)
{	
	if (message.match)
		return startMatch(message.match);
	else if (message.start)
		pageManager.switchChild("tournamentPage", "overview");
	updateTournamentPage.updateNextOpponent();
	updateTournamentPage.updateRound();
}

export default manageTournament;