import { FastifyPluginAsync } from "fastify";
import { User } from "../../models/User";

const studentRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Centralized error handling middleware
  const handleError = (reply, statusCode, message) => {
    console.error(message);
    reply.status(statusCode).send({ error: message });
  };

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const offset = parseInt(request.query.offset || "0", 10);
      const limit = parseInt(request.query.limit || "10", 10);

      // Validate offset and limit
      if (isNaN(offset) || isNaN(limit) || offset < 0 || limit < 0) {
        return reply.code(400).send({ error: "Invalid offset or limit" });
      }

      // Assuming the authenticated user's client ID is stored in the request after authentication
      const clientId = request.user.client;

      // Perform the fetch and count in parallel for performance optimization
      const [students, totalCount] = await Promise.all([
        User.find({ role: "student", client: clientId }, "-password")
          .skip(offset)
          .limit(limit)
          .lean(),
        User.countDocuments({ role: "student", client: clientId })
      ]);

      // Send response
      reply.send({ students, offset, limit, totalCount });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });
};

export default studentRoutes;
