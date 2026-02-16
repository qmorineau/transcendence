import blessed from "neo-blessed";
import utils from "./utilsCreatePage.js";

function getListContainer()
{
	return {
		tags: true,
		name: "list",
		top: 3,
		bottom: 0,
		width: "100%",
		align: "left",
		scrollable: true,
		alwaysScroll: true,
		scrollbar: {
			ch: ' ',
			track: {
			bg: 'grey'
			},
			style: {
			bg: 'white'
			}
		},
		keys: true,
		mouse: true,
		style: {
			selected: {
				bg: "black",
				fg: "yellow",
			},
			bg: "black",
			fg: "white",
		}
	}
}

function initPendingFriends(pendingContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [A] to Accept / [R] to Refuse / [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Friend Requests Received");

	const list = blessed.list(getListContainer());
	
	pendingContainer.append(keys);
	pendingContainer.append(title);
	pendingContainer.append(list);
}

function initFriendsList(listContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Select with [↑] & [↓] / [C] to challenge / [D] to Delete / [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Friends List");

	const list = blessed.list(getListContainer());
	
	listContainer.append(keys);
	listContainer.append(title);
	listContainer.append(list);
}

function initFriendsRequest(requestContainer)
{
	const keys = blessed.box(utils.getKeyMenuContainer());
	keys.setContent("Press [ESC] to go back");

	const title = blessed.box(utils.getTitleContainer());
	title.setContent("Friend Requests Sent (Not Accepted)");

	const list = blessed.list(getListContainer());
	
	requestContainer.append(keys);
	requestContainer.append(title);
	requestContainer.append(list);
}

function createFriendsPage(page)
{
	const container = blessed.box(utils.getBaseContainer());
	page.container.append(container);

	const pending = blessed.box(utils.getBaseContainer());
	initPendingFriends(pending);

	const list = blessed.box(utils.getBaseContainer());
	initFriendsList(list);

	const request = blessed.box(utils.getBaseContainer());
	initFriendsRequest(request);

	page.register("pending", pending);
	page.register("list", list);
	page.register("request", request);
}

export default createFriendsPage;