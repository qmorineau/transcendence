// Other
import { request } from "undici";

// Classes
import Lobby from "../model/Lobby.js";
import Match from "../model/Match.js";
import Player from "../model/Player.js";
import Bot from "../model/Bot.js";

// Controllers
import websocketCTL from "./websocketController.js";
import lobbyCTL from "../controller/lobbyController.js";

// Variables
import { matches } from "./matchController.js";
import { lobbies } from "../controller/lobbyController.js";

// Middleware
import privateMatchMW from "../../privateMatch/privateMatchMiddleware.js";

// Utils
import utils from "./utils.js";

// ========================== TimeOut Private Match Invitation ==========================

function timeOutInvitation(id)
{
	setTimeout(() => {
		if (lobbies.has(id))
			lobbies.delete(id);
	}, 10000)
}

// ========================== Request / Response Private Match ==========================

// Ask connected user for a private match
async function inviteMatch(req, reply)
{	
	const opponentId = await utils.getId(req.params.login);
	if (!opponentId)
		return reply.code(409).send({"error": `User ${req.params.login} doesn't exist`});
	if (websocketCTL.isConnected(opponentId) && opponentId != req.user.id)
	{
		if (lobbies.has(req.user.login + "-" + req.params.login))
			reply.code(409).send({"error": "Invitation still active"});
		else if (!utils.isUuidAvailable(req.headers.uuid))
			reply.code(409).send({"error": "You're already active in another game/tournament"})
		else
		{
			const p1 = new Player(req);
			const newLobby = new Lobby(req.user.login + "-" + req.params.login, p1, 2, "private");
			lobbies.set(newLobby.id, newLobby);
			const json = {
				invite: {
					"player": req.user.login
				}
			}
			websocketCTL.notifyUser(opponentId, json);
			timeOutInvitation(newLobby.id);
			reply.send({"ok": true});
		}
	}
	else
	{
		if (opponentId == req.user.id)
			reply.code(409).send({error: "You can't invite yourself"});
		else
			reply.code(409).send({error: "Player not connected"});
	}
}

// Respond to the user that ask the private match
async function acceptMatch(req, reply)
{
	let res;

	if (!utils.isUuidAvailable(req.headers.uuid))
		return reply.code(409).send({"error": "You're already active in another game/tournament"})
	if (req.body.accept == true)
		res = acceptInvitation(req);
	else
		res = refuseInvitation(req);
	
	if (res.error)
		reply.code(409).send(res);
	else
		reply.send(res);
}

// ========================== Accept / Refuse Private Match ==========================

async function acceptInvitation(req)
{
	if (lobbies.has(req.body.login + "-" + req.user.login))
	{
		const lobby = lobbies.get(req.body.login + "-" + req.user.login);
		if (lobby && lobby.players.size == 1)
		{
			lobby.addPlayer(req, null);
			const array = Array.from(lobby.players);
			const res = await privateMatchMW.privateMatchCreate({"createdById": array[0].id, "player1Id": array[0].id, "player2Id": array[1].id});
			if (res.error)
				return ({error: "Can't create match"});
			lobbies.delete(lobby.id);
			const newMatch = new Match(res.id, array[0], array[1], null, false);
			matches.add(newMatch);
			const json = await {
				"private": {
					"start": true,
					"p1": await utils.getLogin(newMatch.p1.id),

					"p2": await utils.getLogin(newMatch.p2.id),
				}
			}
			websocketCTL.notifyLobby(lobby, json, null);
			return {ok:true};
		}
		else
			return {error: "Player 1 is disconnected"};
	}
	return {error: "Invitation timeout"};
}

async function refuseInvitation(req)
{
	for (const [key, lobby] of lobbies)
	{
		if (lobby.id == req.body.login + "-" + req.user.login)
		{
			websocketCTL.notifyLobby(lobby, {private: {"start": false}}, null);
			lobbies.delete(lobby.id);
			return {ok:true};
		}
	}
	return {error: "Lobby not founded"};
}

// ========================== Bot Match ==========================

async function botMatch(req, reply)
{
	if (!utils.isUuidAvailable(req.headers.uuid))
		return reply.code(409).send({"error": "You're already active in another game/tournament"})
	const p1 = new Player(req);
	const bot = new Bot();

	const res = await privateMatchMW.privateMatchCreate({"createdById": p1.id, "player1Id": p1.id, "player2Id": bot.id});
	if (res.error)
			return reply.code(409).send({"error": "Can't create match"});

	const newMatch = new Match(res.id, p1, bot, null, true);
	matches.add(newMatch);
	const json = {
		"private": {
			"start": true,
			"p1": await utils.getLogin(newMatch.p1.id),
			"p2": await utils.getLogin(newMatch.p2.id),
		}
	}
	websocketCTL.notifyPlayer(p1, json);
	reply.send({ok: true});
}

// ========================== Bot Match ==========================

async function localMatch(req, reply)
{
	if (!utils.isUuidAvailable(req.headers.uuid))
		return reply.code(409).send({"error": "You're already active in another game/tournament"})
	const p1 = new Player(req);
	const p2 = new Player(req);

	const res = await privateMatchMW.privateMatchCreate({"createdById": p1.id, "player1Id": p1.id, "player2Id": p2.id});
	if (res.error)
			return reply.code(409).send({"error": res.error});
	const newMatch = new Match(res.id, p1, p2, null, true);
	matches.add(newMatch);
	reply.send({ok: true});
}

export default {inviteMatch, acceptMatch, botMatch, localMatch};