import { pageManager } from "../../../pong.js";

import apiLobby from "../api/apiLobby.js";
import updateWaitingRoomPage from "../../view/updatePages/updateWaitingRoomPage.js";

async function waitingRoomPageController(page, key)
{
	 switch(key)
    {
        case "escape":
			const res = await apiLobby.leaveMainLobby();
			if (res.error)
				return pageManager.error(res.error);
			updateWaitingRoomPage.stopAnimation();
			pageManager.switchChild("menuPage", "mainMenu");
            break;
	}
}

export default waitingRoomPageController;