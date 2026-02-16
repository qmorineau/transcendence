import Request from "../../model/Request.js";

async function gameMove(body)
{
	const req = new Request("POST", "/api/game/move", body);
 	const res = await req.sendRequest();
	
	return res;
}

async function gameResume()
{
	const req = new Request("POST", "/api/game/resume", {});
 	const res = await req.sendRequest();
	
	return res;
}

async function gameSide()
{
	const req = new Request("GET", "/api/game/side", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function gameWatch()
{
	const req = new Request("GET", "/api/game/watch/:id", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function gameIsInside()
{
	const req = new Request("GET", "/api/game/isInside", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function gameConfig()
{
	const req = new Request("GET",  "/api/game/config", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function isReconnect()
{
	const req = new Request("GET",  "/api/isReconnect", null);
 	const res = await req.sendRequest();
	
	return res;
}

async function gameInfo()
{
	const req = new Request("GET",  "/api/game/info", null);
 	const res = await req.sendRequest();
	
	return res;
}

export default {gameMove, gameMove, gameResume, gameSide, gameWatch, gameIsInside, gameConfig, isReconnect, gameInfo}