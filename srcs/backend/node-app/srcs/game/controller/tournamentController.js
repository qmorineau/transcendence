// Class
import Tournament from "../model/Tournament.js"

// Controller
import lobbyCTL from "./lobbyController.js";
import websocketCTL from "./websocketController.js";

// Tools
import {z} from "zod";
import utils from "./utils.js";

// Variables
import { lobbies } from "./lobbyController.js"

// JSON Schema Format
const isPowerOfTwo = (n) => {
	if (typeof n !== "number" || !Number.isInteger(n) || n <= 1) {return false;}
	return (n & (n - 1)) === 0; // bitshift trick => 1000 & 0111 == 0
}

const TournamentCreateSchema = z.object({
	maxPlayer: z.number().refine(isPowerOfTwo, "maxPlayer must be a power of two"),
	alias: z.string()
		.min(6, "Alias must have more than 6 characters")
		.max(12,"Alias must have less than 12 characters")
		.regex(/^[A-Za-z0-9]+$/i, 'Alias contains invalid characters (only alpha-numerical characters accepted)')
		.regex(/^[A-Za-z]/, 'Alias must start with a letter')
})

const TournamentJoinSchema = z.object({
	room: z.number().int().positive()
		.min(100000, "Lobby are between 100000 and 999999")
		.max(999999, "Lobby are between 100000 and 999999"),
	alias: z.string()
		.min(6, "Alias must have more than 6 characters")
		.max(12,"Alias must have less than 12 characters")
		.regex(/^[A-Za-z0-9]+$/i, 'Alias contains invalid characters (only alpha-numerical characters accepted)')
		.regex(/^[A-Za-z]/, 'Alias must start with a letter')
})

// Global
export const runningTournaments = new Set();

// ========================== Utils ==========================

function getTournament(id)
{
	let search = null;
	for (const tournament of runningTournaments)
	{
		if (tournament.id == id)
			search = tournament;
	}
	return search;
}

function getPlayerTournament(tournament, id)
{
	let user = null;
	for (const player of tournament.players)
	{
		if (id == player.id)
			user = player;
	}
	return user;
}

function isInsideTournament(tournament, req)
{
	let user = null;
	for (const player of tournament.players)
	{	
		if (!player.isAI() && player.uuid == req.headers.uuid)
			user = player;
	}
	return user;
}

function isUuidInTournament(uuid)
{
	for (const tournament of runningTournaments)
	{
		for (const player of tournament.players)
		{
			if (player.uuid == uuid)
				return true;
		}
	}
	return false;
}

// ========================== Tournament Lobby Action ==========================

async function createTournament(req, reply)
{
	const parsed = TournamentCreateSchema.safeParse(req.body);
	if (!parsed.success)
		return reply.code(400).send({"error": JSON.parse(parsed.error)[0].message});
	if (!utils.isUuidAvailable(req.headers.uuid))
		return reply.code(409).send({"error": "You're already active in another game/tournament"})
	const res = await lobbyCTL.createLobby(req, "tournament");
	reply.code(200).send(res);
}

async function leaveTournament(req, reply)
{
	const res = await lobbyCTL.leaveLobby(req)
	if (res.error)
	{
		if (disconnectFromTournament(req.headers.uuid))
			return reply.send({"ok": true});
		return reply.code(409).send(res);
	}
	reply.send(res);
}

async function joinTournament(req, reply)
{
	const parsed = TournamentJoinSchema.safeParse(req.body);
	if (!parsed.success)
		return reply.code(400).send({error: JSON.parse(parsed.error)[0].message});
	if (!utils.isUuidAvailable(req.headers.uuid))
		return reply.code(409).send({"error": "You're already active in another game/tournament"})
	const res = await lobbyCTL.joinLobby(req, null);
	if (res.error)
		return reply.code(409).send(res);
	reply.send(res);
}

async function startTournament(req, reply)
{
	let tournamentLobby = null;
	let lobbyKey = null;
	for (const [key, room] of lobbies)
	{
		if (room.isClientInside(req))
		{
			tournamentLobby = room;
			lobbyKey = key;
		}
	}
	if (!tournamentLobby)
		return reply.code(409).send({error: "User is not in a lobby tournament"});
	if (tournamentLobby.playersAreReady())
	{
		const newTournament = new Tournament(tournamentLobby.players, tournamentLobby.id);
		newTournament.setPlayerNotReady();
		websocketCTL.notifyTournament(newTournament, {lobby: {start:"ok"}});
		lobbies.delete(lobbyKey);
		runningTournaments.add(newTournament);
		return reply.send({status: "Tournament started"});
	}
	reply.code(409).send({error: "All players are not ready"});
}

// ========================== Tournament Interaction ==========================

// Toggle ready state of a player in a tournament
async function playerReady(req, reply)
{
	let userTournament = null;
	for (const tournament of runningTournaments)
	{
		if (isInsideTournament(tournament, req))
			userTournament = tournament
	}
	if (userTournament)
	{
		const player = getPlayerTournament(userTournament, req.user.id);
		if (player)
		{
			player.changeReadyState();
			if (userTournament.isReady())
				await userTournament.startRound();
			return reply.send({"isReady": player.isReady()});
		}
	}
	reply.code(409).send({error: "User not in a tournament"});
}

// Send all Tournament info and ready state of the user asking
async function getInfoTournament(req, reply)
{
	let user = null;
	for (const tournament of runningTournaments)
	{
		user = isInsideTournament(tournament, req)
		if (user)
		{
			const nextOpponent = await tournament.nextOpponent(req.user.id);
			let res = {};
			res.tree = await tournament.serialize();
			res.round = tournament.actualRound;
			if (nextOpponent)
			{
				res.nextOpponent = nextOpponent;
				res.isReady = user.isReady();
			}
			res.isFinish = tournament.isFinished;
			reply.send(res);
			return;
		}
	}
	reply.code(400).send({error: `${req.user.login} is not in a tournament`});
}

async function getNextOpponent(req, reply)
{
	let user = null;
	for (const tournament of runningTournaments)
	{
		user = isInsideTournament(tournament, req)
		if (user)
		{
			reply.send({"nextOpponent": await tournament.nextOpponent(req.user.id)});
			return;
		}
	}
	reply.code(400).send({error: `${req.user.login} is not in a tournament`});
}

// ========================== Player Disconnection / Reconnection ==========================

function disconnectFromTournament(uuid)
{
	for (const tournament of runningTournaments)
	{
		for (const player of tournament.players)
		{
			if (player.uuid == uuid)
			{
				player.uuid = null;
				player.token = null;
				player.ready = true;
				if (tournament.isReady())
					tournament.startRound();
				return true;
			}
		}
	}
	return false;
}

function reconnectToTournament(id, token, uuid)
{
	for (const tournament of runningTournaments)
	{
		for (const player of tournament.players)
		{
			if (player.id == id && !player.uuid)
			{
				player.uuid = uuid;
				player.token = token;
				player.ready = false;
				return true;
			}
		}
	}
	return false;
}

// ========================== Player Deletion ==========================

async function cleanTournament(userId)
{
	for (const tournament of runningTournaments)
	{
		for (const player of tournament.players)
		{
			if (player.id == userId)
			{
				await tournament.replacePlayerByBot(userId);
				tournament.players.delete(player);
			}
		}
	}
}

export default {createTournament, leaveTournament, joinTournament, startTournament, getTournament, getInfoTournament, getNextOpponent, playerReady, disconnectFromTournament, reconnectToTournament, cleanTournament, isUuidInTournament}