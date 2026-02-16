import { pageManager } from "../../../pong.js";
import fetchToken from "./cookie.js";
import socket from "./socket.js"

async function createUser(res)
{
	pageManager.user.token = fetchToken(res);    
	await socket.createSocket(pageManager.user);
}

export default createUser;