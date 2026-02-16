// Controller
import gatewayCTL from "./controller/websocketController.js";
import privateMatchCTL from "./controller/privateMatchController.js";
import tournamentCTL from "./controller/tournamentController.js";
import lobbyCTL from "./controller/lobbyController.js";
import matchCTL from "./controller/matchController.js";
import aiCTL from "./controller/aiController.js";
import websocketCTL from "./controller/websocketController.js";

// Other
import getConfigGame from "./controller/gameConfig.js";

// Functions
const gameRoutes = async (fastify, options) => {
	// Update games each 10ms
	setInterval(() => {matchCTL.run();}, 10);

	// Ping Websocket so it doesn't close of inactivity
	setInterval(async () => {await gatewayCTL.ping();}, 30000);

	// Websocket
	fastify.get('/api/ws', { websocket: true }, (socket, req) => {gatewayCTL.websocketHandler(socket, req)});

	// Lobby
	fastify.get("/api/lobby/ready", {preHandler: [fastify.ws]}, async (req, reply) => {await lobbyCTL.playerReady(req, reply)});
	fastify.get("/api/lobby", {preHandler: [fastify.ws]}, async (req, reply) => {await lobbyCTL.getLobby(req, reply)});

	// Tournament Lobby
	fastify.post("/api/tournament/create", {preHandler: [fastify.ws]}, async (req, reply) => {await tournamentCTL.createTournament(req, reply)});
	fastify.post("/api/tournament/join", {preHandler: [fastify.ws]}, async (req, reply) => {await tournamentCTL.joinTournament(req, reply)});
	fastify.post("/api/tournament/leave", {preHandler: [fastify.ws]}, async (req, reply) => {await tournamentCTL.leaveTournament(req, reply)});
	fastify.post("/api/tournament/start", {preHandler: [fastify.ws]}, async (req, reply) => {await tournamentCTL.startTournament(req, reply)});	
	fastify.get("/api/tournament/info", {preHandler: [fastify.ws]}, async (req, reply) => {await tournamentCTL.getInfoTournament(req, reply)});
	fastify.get("/api/tournament/ready", {preHandler: [fastify.ws]}, async (req, reply) => {await tournamentCTL.playerReady(req, reply)});
	fastify.get("/api/tournament/nextOpponent", {preHandler: [fastify.ws]}, async (req, reply) => {await tournamentCTL.getNextOpponent(req, reply)});

	// Private Lobby
	fastify.get("/api/private/:login", {preHandler: [fastify.title, fastify.ws]}, async (req, reply) => {await privateMatchCTL.inviteMatch(req, reply)});
	fastify.post("/api/private/accept", {preHandler: [fastify.title, fastify.ws]}, async (req, reply) => {await privateMatchCTL.acceptMatch(req, reply)});
	fastify.get("/api/private/ai", {preHandler: [fastify.ws]}, async (req, reply) => {await privateMatchCTL.botMatch(req, reply)});
	fastify.get("/api/private/local", {preHandler: [fastify.ws]}, async (req, reply) => {await privateMatchCTL.localMatch(req, reply)});

	// Game Routes
	fastify.post("/api/game/move", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.movePlayer(req, reply)});
	fastify.post("/api/game/resume", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.resume(req, reply)});
	fastify.get("/api/game/side", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.getSide(req, reply)});
	fastify.get("/api/game/watching/:id", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.spectate(req, reply)});
	fastify.get("/api/game/isInside", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.isInside(req, reply)});
	fastify.get("/api/game/leave", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.leaveMatch(req, reply)});
	fastify.get("/api/game/isInGame", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.isInGame(req, reply)});
	fastify.get("/api/game/info", {preHandler: [fastify.ws]}, async (req, reply) => {await matchCTL.getInfo(req, reply)});
	fastify.get("/api/game/config", async (req, reply) => {await getConfigGame(req, reply)});

	// Reconnecting
	fastify.get("/api/isReconnect", {preHandler: [fastify.ws]}, async (req, reply) => {await websocketCTL.isReconnecting(req, reply)});

	// Main Lobby
	fastify.get("/api/play", {preHandler: [fastify.ws]}, async (req, reply) => {await lobbyCTL.joinMainLobby(req, reply)});
	fastify.get("/api/leave", {preHandler: [fastify.ws]}, async (req, reply) => {await lobbyCTL.leaveMainLobby(req, reply)});

	// IA
	fastify.post("/internal/gameUpdate", {logLevel: 'silent'}, async (req, reply) => {await aiCTL.gameInfo(req, reply)});
	fastify.post("/internal/moveAI", {logLevel: 'silent'}, async (req, reply) => {await aiCTL.moveAI(req, reply)});

	// logLevel :
	// 	- silent
	// 	- debug
	// 	- info
	// 	- warn
	// 	- error
	// 	- fatal 
};

export default gameRoutes; 
