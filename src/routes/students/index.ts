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

      // Fetch students with projection
      const students = await User.find({ role: "student" })
        .skip(offset)
        .limit(limit)
        .lean();

      // Get total count of students
      const totalCount = await User.countDocuments({ role: "student" });

      // Send response
      reply.send({ students, offset, limit, totalCount });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });
};

export default studentRoutes;
