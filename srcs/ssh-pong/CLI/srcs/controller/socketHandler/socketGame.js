import { pageManager } from "../../../pong.js";
import { gameConfig } from "../../../pong.js";
import updateGamePage from "../../view/updatePages/updateGamePage.js";
import updateTournamentPage from "../../view/updatePages/updateTournamentPage.js";
import apiTournament from "../api/apiTournament.js";

async function infoGame(message)
{
	
	const count = pageManager.pages.get("gamePage").childs.get("score").children.find(child => child.name === "count");

	if (pageManager.currentPage.name == "gamePage")
	{
		if (message.ball)
		{
			const height = Number(pageManager.screen.height) - 5;
			const width = Number(pageManager.screen.width) - 2;
			const ball = pageManager.currentPage.childs.get("ball");
			const p1 = pageManager.currentPage.childs.get("p1");
			const p2 = pageManager.currentPage.childs.get("p2");

			count.setText("");
			count.style.bg = "black";
			ball.top = 4 + Math.floor((height / 2) + (message.ball.y * (height / gameConfig.map.height)));
			ball.left = Math.floor((width / 2)  + (message.ball.x * (width / gameConfig.map.width)));

			const mapRatio = height / gameConfig.map.height;
			const paddleHeight = Math.floor(Number(mapRatio * gameConfig.paddleSize));

			p1.width = 1;
			p1.top = Math.floor((gameConfig.map.height / 2 + message.p1) * mapRatio - (paddleHeight / 2)) + 4;
			p1.height = paddleHeight;
			p1.left = Math.floor(Number(width / 2) + Number(gameConfig.playerX.p1 * (width / gameConfig.map.width)));

			p2.width = 1;
			p2.top = Math.floor((gameConfig.map.height / 2 + message.p2) * mapRatio - (paddleHeight / 2)) + 4;
			p2.height = paddleHeight;
			p2.left = Math.floor(Number(width / 2) + Number(gameConfig.playerX.p2 * (width / gameConfig.map.width)));

			pageManager.render();
		}
		else if (message.countdown)
		{
			count.setText("Start in "+ String(message.countdown));
			switch (message.countdown)
			{
				case 1:
					count.style.bg = "green";
					break;
				case 2:
					count.style.bg = "yellow";
					break;
				case 3:
					count.style.bg = "light-red";
					break;
			}
			pageManager.render();
		}
		else if (message.ended)
		{
			pageManager.user.side = null;
			updateGamePage.updateScore({"p1": 0, "p2": 0});
			const res = await apiTournament.tournamentInfo();
			if (res.error)
				pageManager.switchChild("menuPage", "mainMenu");
			else
			{
				pageManager.switchChild("tournamentPage", "overview");
				await updateTournamentPage.updateKeysMovement(res.isReady ? false : true);
				await updateTournamentPage.updateNextOpponent();
				await updateTournamentPage.updateRound();
				pageManager.currentPage.getChildOfChild("ready").setContent("{red-fg}Not Ready{/}");
			}
			pageManager.render();
		}
	}
}

export default {infoGame};