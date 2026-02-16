// Routes Import
import usersRoutes from "./userRoutes.js";


// Routes register
const routes = async (fastify, options) => {
	await fastify.register(usersRoutes);
};

export default routes;
