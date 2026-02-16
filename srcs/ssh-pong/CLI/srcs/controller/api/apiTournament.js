import Request from "../../model/Request.js";

async function createTournament(body)
{
	const req = new Request("POST", "/api/tournament/create", body);
 	const res = await req.sendRequest();
	
	return res;
}

async function joinTournament(body)
{
	const req = new Request("POST", "/api/tournament/join", body);
 	const res = await req.sendRequest();
	
	return res;
}

async function leaveTournament()
{
	const req = new Request("POST", "/api/tournament/leave", {});
 	const res = await req.sendRequest();
	
	return res;
}

async function startTournament()
{
	const req = new Request("POST", "/api/tournament/start", {});
 	const res = await req.sendRequest();
	
	return res;
}

async function tournamentInfo()
{
	const req = new Request("GET", "/api/tournament/info", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function tournamentReady()
{
	const req = new Request("GET", "/api/tournament/ready", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function nextOpponent()
{
	const req = new Request("GET", "/api/tournament/nextOpponent", null);
 	const res = await req.sendRequest();
	
	return res;
}

export default {createTournament, joinTournament, leaveTournament, startTournament, tournamentInfo, tournamentReady, nextOpponent}