import { pageManager } from "../../../pong.js";

import apiGame from "../api/apiGame.js";

function keyReleaseGame()
{
	if (pageManager.user.side == "left")
		apiGame.gameMove({"p1": "0"});
	else if (pageManager.user.side == "right")
		apiGame.gameMove({"p2": "0"});
}

function keyPressGame(key)
{
	if (pageManager.currentPage.name == "gamePage")
	{	
		if (key == "up")
		{
			if (pageManager.user.side == "left")
				apiGame.gameMove({"p1": "1"});
			else if (pageManager.user.side == "right")
				apiGame.gameMove({"p2": "1"});
		}
		else if (key == "down")
		{
			if (pageManager.user.side == "left")
				apiGame.gameMove({"p1": "-1"});
			else if (pageManager.user.side == "right")
				apiGame.gameMove({"p2": "-1"});
		}
		else 
			keyReleaseGame();
	}
}

export default { keyPressGame }