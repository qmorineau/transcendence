// Controller
import websocketCTL from "./websocketController.js";
import aiController from "./aiController.js";

// Classes
import Player from "../model/Player.js";
import tournamentController from "./tournamentController.js";

// utils
import utils from "./utils.js";
import privateMatchMW from "../../privateMatch/privateMatchMiddleware.js";

// Variables
export const matches = new Set();

// ========================== Utils ==========================

function getMatch(id, type)
{
	let game = null;
	for (const match of matches)
	{
		if (match.id == id && match.type == type)
			game = match;
	}
	return game;
}

async function getSide(req, reply)
{
	let side = null;
	for (const match of matches)
	{
		if (match.p1.uuid == req.headers.uuid)
		{
			side = "left";
			break;
		}
		else if (match.p2.uuid == req.headers.uuid)
		{
			side = "right";
			break;
		}
	}
	if (!side)
		return reply.code(409).send({error: "Player not in a match"});
	reply.send({game: {"side": side}});
}

// Check if user is in a game (spectators or player)
async function isInside(req, reply)
{
	for (const match of matches)
	{
		if (match.p1.id == req.user.id)
			return reply.send({"game": {"isInside": true}});
		else if (match.p2.id == req.user.id)
			return reply.send({"game": {"isInside": true}});
		else
		{
			if (match.spectators.has(req.user.id))
					return reply.send({"game": {"isInside": true}});
		}
	}
	return reply.send({"game": {"isInside": false}});
}

// check if client is in a game
async function isInGame(req, reply)
{
	for (const match of matches)
	{
		if (match.p1.uuid == req.headers.uuid || match.p2.uuid == req.headers.uuid)
		{
			if (match.type == "tournament")
				return reply.send({"game": {"isInGame": true, "type": "tournament"}});
			else
				return reply.send({"game": {"isInGame": true, "type": "private", "len": matches.size}});
		}
	}
	return reply.send({"game": {"isInGame": false}});
}

function isUuidInMatch(uuid)
{
	for (const match of matches)
	{
		if (match.p1.uuid == uuid || match.p2.uuid == uuid)
			return true;
	}
	return false;
}

// ========================== Spectate ==========================

async function spectate(req, reply)
{
	if (!req.params.id)
		return reply.code(400).send({error: "No match ID"});
	for (const match of matches)
	{
		if (match.id == req.params.id && match.type == "tournament")
		{
			const player = new Player(req);
			match.spectators.set(player.id, player);
			return reply.send({game: {"id": match.id, "watching": true}});
		}
	}
	return reply.code(409).send({error: "Match is finished or don't exist"});
}


// ========================== Main Game Loop Function ==========================

// Game calculation
function run()
{
	for (const match of matches)
	{
		match.game.nextFrame();
		const json = {
			game: {
				ball: {
					x: match.game.ball.x,
					y: match.game.ball.y
				},
				p1: match.game.p1.y,
				p2: match.game.p2.y
			}
		};
		if (!match.game.isRunning && match.hasAI() && !match.p1.uuid && !match.p2.uuid)
			match.game.resume();
		if (match.hasAI() && match.game.isRunning)
			aiController.requestDecideAI(match.id, match.type);
		if (match.game.isRunning)
			websocketCTL.notifyMatch(match, json);
		match.isFinished();
	}
}

// Player movement handler
async function movePlayer(req, reply)
{
	const json = req.body;
	for (const match of matches)
	{
		if (match.p1.uuid == req.headers.uuid)
		{
			if (json.p1 == -1)
				match.game.changeDirPlayer("p1", -1);
			else if (json.p1 == 1)
				match.game.changeDirPlayer("p1", 1);
			else if (json.p1 == 0)
				match.game.changeDirPlayer("p1", 0);
		}
		if (match.p2.uuid == req.headers.uuid)
		{
			if (json.p2 == -1)
				match.game.changeDirPlayer("p2", -1);
			else if (json.p2 == 1)
				match.game.changeDirPlayer("p2", 1);
			else if (json.p2 == 0)
				match.game.changeDirPlayer("p2", 0);
		}
	}
	reply.send({ok:true});
}

// Resume when game is paused
async function resume(req, reply)
{
	let isUnpaused = false;
	for (const match of matches)
	{
		if (match.p1.uuid == req.headers.uuid)
			match.p1.ready = true;
		if (match.p2.uuid == req.headers.uuid)
			match.p2.ready = true;
		if (match.p1.isReady() && match.p2.isReady())
		{
			match.start();
			isUnpaused = true;
		}
	}
	if (isUnpaused)
		return reply.send({status:"ok"});
	reply.send({status:"waiting"});
}

// ========================== Manual Leaving ==========================

async function leaveMatch(req, reply)
{
	tournamentController.disconnectFromTournament(req.headers.uuid);
	disconnectFromMatch(req.headers.uuid);
	reply.send({"ok":"true"});
}

// ========================== Get Info of the Game ==========================

async function getInfo(req, reply)
{
	for (const match of matches)
	{
		if (match.p1.uuid == req.headers.uuid || match.p2.uuid == req.headers.uuid)
		{
			const res = {
				"isRunning": match.game.isRunning,
				"p1": match.p1.alias ? match.p1.alias : await utils.getLogin(match.p1.id),
				"p2": match.p2.alias ? match.p2.alias : await utils.getLogin(match.p2.id),
				"score": {
					"p1": match.game.score.p1,
					"p2": match.game.score.p2
				}
			}
			return reply.send(res);
		}
	}
	reply.code(409).send({"error": "Client not in a match"});
}

// ========================== Disconnect / Reconnect Websocket ==========================
async function reconnectToMatch(id, token, uuid)
{
	for (const match of matches)
	{
		if (match.p1.id == id && !match.p1.uuid)
		{
			match.p1.token = token;
			match.p1.uuid = uuid;
			match.p1.ready = false;
		}
		else if (match.p2.id == id && !match.p2.uuid)
		{
			match.p2.token = token;
			match.p2.uuid = uuid;
			match.p2.ready = false;
		}
		else
		{
			for (const [id, player] of match.spectators)
			{
				if (player.id == id && !player.uuid)
				{
					player.token = token;
					player.uuid = uuid;
					return ;
				}
			}
		}
	}
}

async function disconnectFromMatch(uuid)
{
	for (const match of matches)
	{
		if (match.shouldBeDeleted)
		{
			if (match.hasAI())
				await aiController.requestUnregisterAI(match.id, match.type);
			privateMatchMW.privateMatchDelete(match.id);
			matches.delete(match);
		}
		else if (!match.p1.isAI() && match.p1.uuid == uuid)
		{
			match.p1.token = null;
			match.p1.uuid = null;
		}
		else if (!match.p2.isAI() && match.p2.uuid == uuid)
		{
			match.p2.token = null;
			match.p2.uuid = null;
		}
		else
		{
			for (const [id, player] of match.spectators)
			{
				if (player.uuid == uuid)
				{
					player.uuid = null;
					player.token = null;
				}
			}
		}
	}
}

async function cleanFromMatches(id)
{
	for (const match of matches)
	{
		if (match.p1.id == id)
		{
			match.p1.token = null;
			match.p1.uuid = null;
		}
		else if (match.p2.id == id)
		{
			match.p2.token = null;
			match.p2.uuid = null;
		}
		else
			for (const [id, player] of match.spectators)
			{
				if (player.id == id)
				{
					player.uuid = null;
					player.token = null;
				}
			}
	}
}

export default {run, movePlayer, getMatch, getSide, resume, reconnectToMatch, disconnectFromMatch, cleanFromMatches, isInside, isInGame, leaveMatch, spectate, isUuidInMatch, getInfo};