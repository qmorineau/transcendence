import { pageManager } from "../../../pong.js";
import updateFriendsPage from "../../view/updatePages/updateFriendsPage.js";
import apiFriends from "../api/apiFriends.js";
import apiPrivate from "../api/apiPrivate.js";

function getSelectedValue()
{
	const list = pageManager.currentPage.getChildOfChild("list");
	if (!list.getItem(list.selected).getText().includes(' '))
		return list.getItem(list.selected).getText();
	return null;
}

async function friendsPendingController(key)
{
	switch(key)
	{
		case "escape":
			pageManager.switchChild("menuPage", "friendsMenu");
			break;
		case "a":
			const acceptLogin = getSelectedValue();
			if (acceptLogin)
			{
				const resAccept = await apiFriends.friendAcceptRequest(acceptLogin);
				if (resAccept.error)
					return pageManager.error(resAccept.error);
				updateFriendsPage.updateFriendsPending();
			}
			break;
		case "r":
			const refuseLogin = getSelectedValue();
			if (refuseLogin)
			{
				const resRefuse = await apiFriends.friendDeclineRequest(refuseLogin);
				if (resRefuse.error)
					return pageManager.error(resRefuse.error);
				updateFriendsPage.updateFriendsPending();
			}
			break;
	}
}

function friendsRequestController(key)
{
	switch(key)
	{
		case "escape":
			pageManager.switchChild("menuPage", "friendsMenu");
			break;
	}
}

async function friendsListController(key)
{
	switch(key)
	{
		case "escape":
			pageManager.switchChild("menuPage", "friendsMenu");
			break;
		case "c":
			const challengeLogin = getSelectedValue();
			if (challengeLogin)
			{
				const resAsk = await apiPrivate.askPrivateMatch(challengeLogin);
				if (resAsk.error)
					pageManager.error(bool);
				else
					pageManager.error("Invite send");
			}
			break;
		case "d":
			const deleteLogin = getSelectedValue();
			if (deleteLogin)
			{
				const resRemove = await apiFriends.friendsRemove(deleteLogin);
				if (resRemove.error)
					return pageManager.error(resRemove.error);
				updateFriendsPage.updateFriendsPending();
			}
			break;
	}
}

function friendsKeyHandler(page, key)
{
	switch(page.currentChild)
	{
		case page.childs.get("pending"):
			friendsPendingController(key);
			break;
		case page.childs.get("request"):
			friendsRequestController(key);
			break;
		case page.childs.get("list"):
			friendsListController(key);
			break;
	}
	pageManager.render();
}

export default { friendsKeyHandler };