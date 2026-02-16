import { pageManager } from "../../../pong.js";
import apiFriends from "../../controller/api/apiFriends.js"

async function updateFriendsList()
{
	const list = pageManager.currentPage.getChildOfChild("list");
	list.clearItems();

	const json = await apiFriends.friendsList();
	if (json.error)
		return pageManager.error(json.error);
	const friends = JSON.parse(json.body);
	if (!friends.length)
		list.add("You don't have friends yet !")
	else
	{
		for (let i = 0; i < friends.length; i++)
			list.add(`${friends[i].login}`);
	}
	pageManager.render();
}

async function updateFriendsPending()
{
	const list = pageManager.currentPage.getChildOfChild("list");
	list.clearItems();

	const json = await apiFriends.friendsIncomingPending();
	if (json.error)
		return pageManager.error(json.error);
	const pending = JSON.parse(json.body);

	if (!pending.length)
		list.add("Nobody ask you as a friend !")
	else
	{
		for (let i = 0; i < pending.length; i++)
			list.add(`${pending[i].requester.login}`);
	}
	pageManager.render();
}

async function updateFriendsRequest()
{
	const list = pageManager.currentPage.getChildOfChild("list");
	list.clearItems();

	const json = await apiFriends.friendsOutgoingPending();
	if (json.error)
		return pageManager.error(json.error);
	const request = JSON.parse(json.body);

	if (!request.length)
		list.add("You didn't send any request !")
	else
	{
		for (let i = 0; i < request.length; i++)
			list.add(`${request[i].receiver.login}`);
	}
	pageManager.render();
}

export default {updateFriendsList, updateFriendsPending, updateFriendsRequest};