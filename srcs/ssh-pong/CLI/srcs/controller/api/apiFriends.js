import Request from "../../model/Request.js";

async function friendRequest(login)
{
	const req = new Request("POST", "/api/friends/request", {"login": login});
 	const res = await req.sendRequest();
	
	return res;
}

async function friendAcceptRequest(login)
{
	const req = new Request("POST", `/api/friends/accept`, {"login": login});
 	const res = await req.sendRequest();
	
	return res;
}

async function friendDeclineRequest(login)
{
	const req = new Request("DELETE", `/api/friends/pending`, {"login": login});
 	const res = await req.sendRequest();
	
	return res;
}

async function friendsRemove(login)
{
	const req = new Request("DELETE", `/api/friends/unfriend`, {"login": login});
 	const res = await req.sendRequest();
	
	return res;
}

async function friendsList()
{
	const req = new Request("GET", `/api/friends/list`, null);
 	const res = await req.sendRequest();
	
	return res;
}

async function friendsIncomingPending()
{
	const req = new Request("GET", `/api/friends/incoming`, null);
 	const res = await req.sendRequest();
	
	return res;
}

async function friendsOutgoingPending()
{
	const req = new Request("GET", `/api/friends/outgoing`, null);
 	const res = await req.sendRequest();
	
	return res;
}

export default {friendRequest, friendAcceptRequest, friendDeclineRequest, friendsRemove, friendsList, friendsIncomingPending, friendsOutgoingPending};