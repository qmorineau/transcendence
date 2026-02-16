

const IAroutes = async (fastify, options) => {

    fastify.get('/internal', async (req, reply) => {
        return reply.send({ here: "pong" });
    });
};

export default IAroutes;