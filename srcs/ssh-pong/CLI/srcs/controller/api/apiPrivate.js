import Request from "../../model/Request.js";
import { pageManager } from "../../../pong.js";

async function askPrivateMatch(login)
{
	const req = new Request("GET", `/api/private/${login}`, null);
 	const res = await req.sendRequest();
	
	return res;
}

async function acceptPrivateMatch(body)
{
	const req = new Request("POST", "/api/private/accept", body);
 	const res = await req.sendRequest();
	
	return res;
}

async function privateBotMatch()
{
	const req = new Request("GET", "/api/private/ai", null);
 	const res = await req.sendRequest();
	
	return res;
}

export default { askPrivateMatch, acceptPrivateMatch, privateBotMatch }