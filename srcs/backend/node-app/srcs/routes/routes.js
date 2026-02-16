// Routes Import
import gameRoutes from "../game/gameRoutes.js";
import usersRoutes from "../users/usersRoutes.js";
import privateMatchRoutes from "../privateMatch/privateMatchRoutes.js"
import tournamentRoutes from "../tournament/tournamentRoutes.js";
import matchRoutes from '../match/matchRoutes.js'
import IAroutes from "../IAroutes/IARoutes.js";

// Routes register
const routes = async (fastify, options) => {
	// Quentin
	await fastify.register(gameRoutes);
	
	// LOIC
	await fastify.register(IAroutes); // JUST A HEALTHCHECK
	await fastify.register(usersRoutes);   // TODO SEPARATE AUTH & STATS -> Auth & UserStats CONTAINER
	
	// await fastify.register(privateMatchRoutes); // EMPTY
	// await fastify.register(tournamentRoutes); // EMPTY
	// await fastify.register(matchRoutes);  // EMPTY
};

export default routes;
