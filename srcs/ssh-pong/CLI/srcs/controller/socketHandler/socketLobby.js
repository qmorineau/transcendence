import { pageManager } from "../../../pong.js";
import updateLobbyPage from "../../view/updatePages/updateLobbyPage.js";
import updateTournamentPage from "../../view/updatePages/updateTournamentPage.js";

async function manageLobby(message)
{
	if (message.start)
	{
		pageManager.switchChild("tournamentPage", "overview");
		updateTournamentPage.updateNextOpponent();
		await updateTournamentPage.updateRound();
	}
	else if (message.join || message.leave || message.ready)
		await updateLobbyPage.updateLobby(null);
	pageManager.render();
}

export default manageLobby;