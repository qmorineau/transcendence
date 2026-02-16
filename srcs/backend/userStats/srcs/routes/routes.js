// Routes Import
import usersStatsRoutes from "./userStatsRoutes.js";


// Routes register
const routes = async (fastify, options) => {
	await fastify.register(usersStatsRoutes);
};

export default routes;
