// Routes Import
import friendshipRoutes from "./friendshipRoutes.js";


// Routes register
const routes = async (fastify, options) => {
	await fastify.register(friendshipRoutes);
};

export default routes;
