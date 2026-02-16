import Request from "../../model/Request.js";

async function lobbyReady()
{
	const req = new Request("GET", "/api/lobby/ready", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function lobby()
{
	const req = new Request("GET", "/api/lobby", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function joinMainLobby()
{
	const req = new Request("GET", "/api/play", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function leaveMainLobby()
{
	const req = new Request("GET",  "/api/leave", null);
 	const res = await req.sendRequest();
	
	return res;
}

export default {lobby, lobbyReady, joinMainLobby, leaveMainLobby}