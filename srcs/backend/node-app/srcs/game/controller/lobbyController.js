// Other
import { request } from "undici";

// Classes
import Lobby from "../model/Lobby.js";
import Player from "../model/Player.js";
import Bot from "../model/Bot.js";
import Match from "../model/Match.js";

// Middleware
import tournamentMW from "../../tournament/tournamentMiddleware.js";
import privateMatchMW from "../../privateMatch/privateMatchMiddleware.js";

// Controllers
import websocketCTL from "./websocketController.js";

// Utils
import utils from "./utils.js";

// Variables
import { matches } from "./matchController.js"
export const lobbies = new Map();
const mainLobby = new Lobby("main", new Bot(), 1024, "private");
mainLobby.removePlayer(1);

// ========================== Utils ==========================

function print()
{
	console.log("--------------------");
	lobbies.forEach((lobby, key) => {
		console.log("Room ID = ", key);
		lobby.print();
		console.log("");
	})
	console.log("--------------------");
}

function random()
{
	if (lobbies.size > 500000)
		return 0;
	const min = 100000;
	const max = 999999;
	let id = Math.floor(Math.random() * (max - min) + min);
	while (lobbies.has(id))
		id = Math.floor(Math.random() * (max - min) + min);
	return id;
}

async function getPlayer(lobby)
{
	const players = Array.from(lobby.players);
	const res = {};
	for (let i = 0; i < players.length; i++)
	{
		const login = await utils.getLogin(players[i].id);
		if (!login)
			return {"error": `One player doesn't exist`};
		res[login] = {"login": login, "isReady": players[i].ready, "alias": players[i].alias};
	}
	return res;
}

async function getLobby(req, reply)
{
	let playerLobby = null;
	let lobbyKey = null;
	for (const [key, lobby] of lobbies)
	{
		if (lobby.isClientInside(req))
		{
			playerLobby = lobby;
			lobbyKey = key
		}
	}
	if (playerLobby)
		reply.send({type: playerLobby.type, "lobby": lobbyKey, "players": await getPlayer(playerLobby), "userIsReady": playerLobby.getPlayer(req.user.id).isReady()});
	else
		reply.code(409).send({error: "User is not in a lobby"});
}

// ========================== CRUD Lobby ==========================

async function createLobby(req, type)
{
	let maxPlayer;
	type == "private" ? maxPlayer = 2 : maxPlayer = req.body.maxPlayer;
	let res = {};
	if (type == "tournament")
		res = await tournamentMW.tournamentCreate();
	if (res.error)
		return {error: "Can't create tournament"};
	const lobbyId = res.id;
	const player = new Player(req);
	const lobby = new Lobby(lobbyId, player, maxPlayer, type);
	const id = random();
	if (!id)
		return {error: "Too many lobby, can't create one"};
	await leaveLobby(req);
	lobbies.set(id, lobby);
	print();
	return {"lobby": id, "maxPlayer": maxPlayer};
}

async function leaveLobby(req)
{
	let res = {error: "User not in a lobby"};
	for (const [key, room] of lobbies)
	{
		console.log("lobby number = ", lobbies.size);
		const player = room.isClientInside(req);
		if (player)
		{
			res = {ok:true};
			room.removePlayer(player.id);
			websocketCTL.notifyLobby(room, {lobby: {leave: player.alias}}, req.user.id);
			if (room.players.size == 0)
			{
				if (room.type == "tournament")
					res = await tournamentMW.tournamentDelete({id: room.id});
				lobbies.delete(key);
			}
		}
	}
	return res;
}

async function joinLobby(req)
{
	await leaveLobby(req);
	let lobby;
	if (lobbies.has(Number(req.body.room)))
		lobby = lobbies.get(Number(req.body.room));
	else
		return {error: `Room ${req.body.room} doesn't exist`};
	if (lobby.isUserInside(req))
		return {error: `User is already in the lobby`};
	if (lobby.isDuplicateAlias(req.body.alias))
		return {error: `Alias \"${req.body.alias}\" already exist`};
	if (!lobby.addPlayer(req, null))
		return {error: `Room ${req.body.room} is full`};
	websocketCTL.notifyLobby(lobby, {"lobby": {"join": req.body.alias, "login": req.user.login}}, req.user.id);
	print();
	return {lobby: req.body.room, players: await getPlayer(lobby)};
}

async function removeFromLobby(uuid)
{
	for (const [key, room] of lobbies)
	{
		for (const player of room.players)
		{
			if (player.uuid == uuid)
			{
				websocketCTL.notifyLobby(room, {lobby: {leave: player.alias}}, null);
				room.removePlayer(player.id);
				if (room.type == "tournament")
					tournamentMW.tournamentDelete({id: room.id});
				if (room.players.size == 0)
					lobbies.delete(key);
			}
		}
	}
}

// ========================== Lobby Interaction ==========================

// change ready state of player in a lobby
async function playerReady(req, reply)
{
	let res =  {error: "player not in a lobby"};
	let playerLobby = null;
	for (const [key, lobby] of lobbies)
	{
		if (lobby.isClientInside(req))
		{
			res = {};
			playerLobby = lobby;
			const player = lobby.getPlayer(req.user.id);
			player.changeReadyState();

			const login = await utils.getLogin(player.id);
			if (!login)
				return reply.code(409).send({"error": "One player doesn't exist"});
			const json = {"lobby": {"ready": {"login": login, "isReady": player.isReady()}}};
			if (player.alias)
				json.lobby.ready.alias = player.alias;
			websocketCTL.notifyLobby(lobby, json, null);
		}
	}
	if (!res.error)
		reply.send({"isReady": playerLobby.getPlayer(req.user.id).isReady()});
	else
		reply.code(409).send(res);
}

// ========================== Main Lobby ==========================

async function joinMainLobby(req, reply)
{
	if (mainLobby.getPlayer(req.user.id))
		reply.code(409).send({error: "You are already inside"});
	else
	{
		mainLobby.addPlayer(req);
		if (mainLobby.players.size >= 2)
		{
			const array = Array.from(mainLobby.players);
			const p1 = array[0];
			const p2 = array[1];
			const res = await privateMatchMW.privateMatchCreate({createdById: p1.id, player1Id: p1.id, player2Id: p2.id});
			if (res.error)
				return reply.code(409).send({error: "Can't create match"});
			mainLobby.removePlayer(p1.id);
			mainLobby.removePlayer(p2.id);
			const newMatch = new Match(res.id, p1, p2, null, false);
			matches.add(newMatch);
			const json = await {
				"private": {
					"start": true,
					"p1": await utils.getLogin(p1.id),
					"p2": await utils.getLogin(p2.id),
				}
			}
			websocketCTL.notifyPlayer(p1, json);
			websocketCTL.notifyPlayer(p2, json);
		}
		reply.send({ok: true});
	}
}

async function leaveMainLobby(req, reply)
{
	if (mainLobby.getPlayer(req.user.id))
	{
		mainLobby.removePlayer(req.user.id)
		reply.send({ok: true});
	}
	else
		reply.code(409).send({error: "Player not in the main lobby"});
}

// ========================== User Deletion Remove Lobby ==========================

function cleanLobbies(userId)
{
	for (const [key, lobby] of lobbies)
	{
		const player = lobby.getPlayer(userId); 
		if (player)
		{
			lobby.removePlayer(userId);
			if (room.players.size == 0)
				lobbies.delete(key);
			websocketCTL.notifyLobby(lobby, {"lobby": {"leave": player.alias}}, null);
		}
	}

	if (mainLobby.getPlayer(userId))
		mainLobby.removePlayer(userId);
}

export default {createLobby, joinLobby, leaveLobby, print, playerReady, getLobby, removeFromLobby, joinMainLobby, leaveMainLobby, cleanLobbies};