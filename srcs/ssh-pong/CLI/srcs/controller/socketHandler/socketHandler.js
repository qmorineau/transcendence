import manageLobby from "./socketLobby.js";
import managePrivateMatch from "./socketPrivateMatch.js";
import manageGame from "./socketGame.js"
import manageTournament from "./socketTournament.js";
import apiGame from "../api/apiGame.js";

import gamePage from "../../view/updatePages/updateGamePage.js";
import { pageManager } from "../../../pong.js";
import updateTournamentPage from "../../view/updatePages/updateTournamentPage.js";

function socketMessageHandler(socket)
{
	socket.on("message", async (data) => {
		const json = JSON.parse(data);
		
		if (json.game)
			manageGame.infoGame(json.game);
		else if (json.goal)
		{
			gamePage.updateScore(json.goal.score)
			apiGame.gameMove({"p1": 0, "p2": 0});
			await apiGame.gameResume();
		}
		else if (json.tournament)
			manageTournament(json.tournament);
		else if (json.tournamentInfo)
		{
			if (pageManager.currentPage.currentChild == pageManager.pages.get("tournamentPage").childs.get("overview"))
			{
				updateTournamentPage.updateNextOpponent();
				updateTournamentPage.updateRound();
			}
		}
		else if (json.lobby)
			manageLobby(json.lobby);
		else if (json.invite)
			managePrivateMatch.manageInviteMessage(json.invite);
		else if (json.private)
			managePrivateMatch.manageAcceptMessage(json.private);
	})
}

export default socketMessageHandler;