// Controller
import lobbyCTL from "./lobbyController.js"
import tournamentCTL from "./tournamentController.js";
import matchCTL from "./matchController.js";

// Middleware
import onUser from "../../users/usersMiddleware.js";

// Variables
import { matches } from "./matchController.js";
import { runningTournaments } from "./tournamentController.js";
import { server }from "../../server.js"

export const sockets = new Map();

// ========================== Utils ==========================

async function ping()
{
	for (const [login, tokenMap] of sockets)
	{
		for (const [token, uuidMap] of tokenMap)
		{
			for (const [uuid, socket] of uuidMap)
				socket.send(JSON.stringify({"ping": new Date()}));
		}
	}
	print();
}

function print()
{
	let count = 0;
	let userCount = 0;
	for (const [login, tokenMap] of sockets)
	{
		for (const [token, uuidMap] of tokenMap)
		{
			count += uuidMap.size;
		}
		userCount++;
	}
	console.log("===========================");
	console.log("Clients connected:", count);
	console.log("Users connected:", userCount);
	console.log("===========================");
}

function getSocket(id, token, uuid)
{
	let socket = null;
	socket = sockets.get(String(id))?.get(token)?.get(uuid);
	return socket;
}

function isConnected(id)
{
	if (sockets.has(String(id)))
		return true;
	return false;
}

// ========================== Connection / Disconnection of Guests Websockets ==========================

const guestTimeout = new Map();

function timeOutGuest(login, id)
{
	const newTimeout = setTimeout(() => {
		if (!sockets[id])
			onUser.onUserDisconnection(login, id);
	}, 30000);

	if (guestTimeout.get(id))
		clearTimeout(guestTimeout.get(id));
	guestTimeout.set(id, newTimeout);
}

function clearTimeOutGuest(login, id)
{
	if (guestTimeout.get(id))
		clearTimeout(guestTimeout.get(id));
	else
		onUser.onUserConnection(login, id);
}

// ========================== Connection / Disconnection of Websockets ==========================

function addSocket(socket, req, uuid)
{
	const id = req.user.id;
	const token = req.cookies.session;

	if (!sockets.has(id))
	{
		if (req.user.title == "GUEST")
			clearTimeOutGuest(req.user.login, req.user.id);
		else
			onUser.onUserConnection(req.user.login, req.user.id);
		sockets.set(id, new Map());
	}

	const mapId = sockets.get(id);
	if (!mapId.has(token))
		mapId.set(token, new Map());

	const mapToken = mapId.get(token);
	if (!mapToken.has(uuid))
		mapToken.set(uuid, socket);
	else
		socket.send(JSON.stringify({error: "UUID already exist"})); // close socket ?
	print();
}

function removeSocket(ws , req)
{
	const id = req.user.id;
	const token = req.cookies.session;

	const mapToken = sockets.get(id);
	const mapUuid = mapToken?.get(token);
	if (mapUuid)
	{
		for (const [uuid, socket] of mapUuid)
		{
			if (socket == ws)
			{
				lobbyCTL.removeFromLobby(uuid);
				tournamentCTL.disconnectFromTournament(uuid);
				matchCTL.disconnectFromMatch(uuid);
				mapUuid.delete(uuid);
			}
		}
		if (!mapUuid.size)
			mapToken.delete(token);
		if (!mapToken.size)
		{
			if (req.user.title == "GUEST")
				timeOutGuest(req.user.login, req.user.id);
			else
				onUser.onUserDisconnection(req.user.login, req.user.id);
			sockets.delete(id);
		}
		print();
		return ;
	}
}

// ========================== User Deletion Cleaning Websockets ==========================	

function cleanWebsocket(userId)
{
	const mapId = sockets.get(String(userId));
	if (mapId)
	{
		for (const [id, tokenMap] of mapId)
		{
			if (userId == id)
			{
				for (const [token, uuidMap] of tokenMap)
				{
					for (const [uuid, socket] of uuidMap)
					{
						socket.close();
						uuidMap.delete(uuid);
					}
					tokenMap.delete(token);
				}
			}
			sockets.delete(id);
		}
	}
}

// ========================== Client Reconnection, Check Tournament / Game reconnect ==========================

function isReconnecting(req, reply)
{	
	for (const match of matches)
	{
		if (match.p1.uuid == req.headers.uuid || match.p2.uuid == req.headers.uuid)
			return reply.send({"isReconnecting": true, "redirect": "game"});
	}
	if (tournamentCTL.isUuidInTournament(req.headers.uuid))
		return reply.send({"isReconnecting": true, "redirect": "waiting"});
	return reply.send({"isReconnecting": false});
}

// ========================== Function to send message to Websocket ==========================
	
// Notify all player in a match and spectators
function notifyMatch(match, message)
{
	let socketP1 = null;
	let socketP2 = null;
	match.p1.isAI() ? true : socketP1 = match.p1.getSocket();
	match.p2.isAI() ? true : socketP2 = match.p2.getSocket();
	if (socketP1)
		socketP1.send(JSON.stringify(message));
	if (socketP2)
		socketP2.send(JSON.stringify(message));
	for (const [key ,spectator] of match.spectators)
	{
		const socket = spectator.getSocket();
		if (socket)
			socket.send(JSON.stringify(message));
	}
}

// Notify all player of a lobby
function notifyLobby(lobby, message, id)
{
	for (const player of lobby.players)
	{
		const socket = player.getSocket();

		if (socket)
			socket.send(JSON.stringify(message));
	}
}

// Notify all player of a tournament not in a match
function notifyTournament(tournament, message)
{
	for (const player of tournament.players)
	{
		const socket = player.getSocket();

		if (socket)
			socket.send(JSON.stringify(message));
	}
}

// Notify the socket of a player
function notifyPlayer(player, message)
{
	const socket = getSocket(player.id, player.token, player.uuid);
	if (socket)
		socket.send(JSON.stringify(message));
}

// Notify all sockets of a user
async function notifyUser(id, message)
{

	const idMap = sockets.get(String(id));
	if (idMap)
	{
		for (const [token, uuidMap] of idMap)
		{
			for (const [uuid, socket] of uuidMap)
			{
				if (message.invite)
				{
					if (tournamentCTL.isUuidInTournament(uuid) || matchCTL.isUuidInMatch(uuid))
						continue;
				}
				socket.send(JSON.stringify(message));
			}
		}
	}
}

// ========================== Websocket Handler ==========================

function websocketHandler (ws, req)
{
	ws.on('message', (data) => {
		const uuid = JSON.parse(data).uuid;
		if (uuid)
		{
			addSocket(ws, req, uuid);
			if (!tournamentCTL.reconnectToTournament(req.user.id, req.cookies.session, uuid))
				matchCTL.reconnectToMatch(req.user.id, req.cookies.session, uuid);
		}
		else
		{
			ws.send(JSON.stringify({error: "No UUID, can't register websocket"}));
			ws.close();
		}
	});

	ws.on('close', message => {
		removeSocket(ws, req);
	});
}

export default {websocketHandler, notifyMatch, notifyLobby, notifyPlayer, notifyTournament, notifyUser, ping, getSocket, isConnected, cleanWebsocket, isReconnecting};