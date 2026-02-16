// Utils
import undici from "undici";
const { Client } = undici;

// Controllers
import matchCTL from "./matchController.js";
import websocketCTL from "./websocketController.js";

// Middleware
import matchMW from "../../match/matchMiddleware.js";
import privateMatchMW from "../../privateMatch/privateMatchMiddleware.js";

// Class
import Bot from "../model/Bot.js"

// Variables
const upstream = new Client("http://ia-client:3001", {});

// ========================== Utils ==========================

function createRes(match, aiPaddle)
{
	return {
		gameId: match.id,
		ball: {
			x: match.game.ball.x,
			y: match.game.ball.y,
			vx: match.game.ball.vx,
			vy: match.game.ball.vy,
			speed: match.game.ball.speed
		},
		aiPaddle: {
			x: aiPaddle.x,
			y: aiPaddle.y
		}
	};
}

// ========================== Get Info a Game ==========================

async function gameInfo(req, reply)
{
	const match = matchCTL.getMatch(req.body.gameId, req.body.type);
	if (!match)
		return reply.code(409).send({error: "Game not found"});
	let aiPaddle;
	match.p1 == null ? aiPaddle = match.game.p1 : aiPaddle = match.game.p2
	const res = createRes(match, aiPaddle);
	reply.send(res);
}

// ========================== AI Movement Handler ==========================

async function moveAI(req, reply)
{
	const match = matchCTL.getMatch(req.body.id, req.body.type);
	if (!match)
		return reply.code(409).send({error: "Game not found"});
	if (match.p1.id == 1)
		match.game.moveP1(req.body.move == "up" ? -1 : 1);
	else if (match.p2.id == 1)
		match.game.moveP2(req.body.move == "up" ? -1 : 1);
}

// ========================== AI Request ==========================

async function requestRegisterAI(gameId, paddleX, side, type)
{
	upstream.request({
	path: "/internal/register",
	method: "POST",
	headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			"gameId": gameId,
			"paddleX": paddleX,
			"side": side,
			"type": type
		})
	})
}

async function requestUnregisterAI(gameId, type)
{
	upstream.request({
		path: "/internal/unregister",
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({"gameId": gameId, "type": type})
	})
}

async function requestDecideAI(gameId, type)
{
	upstream.request({
		path: "/internal/decide",
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({"gameId": gameId, "type": type})
	})
}

// ========================== Update Player to AI ==========================

function setupUpdateMatch(match, playerId)
{
	const bot = new Bot();
	if (match.p1.id == playerId)
	{
		websocketCTL.cleanWebsocket(match.p1.id);
		match.p1 = bot;
		match.game.config.p1 = bot.id;
	}
	else
	{
		websocketCTL.cleanWebsocket(match.p2.id);
		match.p2 = bot;
		match.game.config.p2 = bot.id;
	}
	return bot;
}

async function matchChangePlayerToAI(match, playerId)
{
	const bot = setupUpdateMatch(match, playerId);
	if (match && !match.isEnded)
	{
		await matchMW.onMatchUpdate(match.id, match.p1.id, match.p2.id);
		const side = bot == match.game.p1 ? "left" : "right";
		requestRegisterAI(match.id, side == "left" ? match.game.p1.x : match.game.p2.x, side, match.type);
	}
	return bot;
}

async function privateMatchChangePlayerToAI(match, playerId)
{
	const bot = setupUpdateMatch(match, playerId);
	if (match && !match.isEnded)
	{
		await privateMatchMW.onPrivateMatchUpdate(match.id, match.p1.id, match.p2.id);
		const side = bot == match.game.p1 ? "left" : "right";
		requestRegisterAI(match.id, side == "left" ? match.game.p1.x : match.game.p2.x, side, match.type);
	}
	return bot;
}

export default {gameInfo, moveAI, requestRegisterAI, requestUnregisterAI, requestDecideAI, matchChangePlayerToAI, privateMatchChangePlayerToAI};